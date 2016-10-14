// configuration for jshint 
/* jshint browser: true, devel: true, strict: true */
/* global ko */

// Javascript module pattern with dynamic namespacing via the Namespace Proxy technique
// http://javascriptweblog.wordpress.com/2010/12/07/namespacing-in-javascript/
// http://www.sitepoint.com/my-favorite-javascript-design-pattern/
var Landing = (function() {
  "use strict";
  
  console.log("loading Landing");

  // private variables
  var services;
  var types;
  var enumerators;
  var type_lookup = {};
  var enumerator_lookup = {};
  var enumerator_default = {};
  var recent;
  var types_used = [];
  var service_undefined = false;
  // provide access to the function-scope this object in the private functions
  var THIS = this;
  // number of downloaded files
  var downloaded = 0;
  // number of files to download
  var toDownload = 0;

  // public variables
  this.initialized = false;
  // view model with child view models
  this.viewModel = {
    prefix : ko.observable(''),
    services : [],
    recent : [],
    types : [],
    enumerators : [],
    remove_recent: function(r) {
      var c = r.tag() + " of type " + r.type() + " last used on " + format_date(r.modified_at());
      navigator.notification.confirm("This will clear all locally saved data for case " + c + " !",
        function(buttonIndex) {
          if (buttonIndex === 1) {
            console.log("removing case " + r.handle());
            removeRecent(r.handle());
            updateRecent(true);
            // TODO
            // navigator.notification.confirm("This will clear all remotely saved data for case " + c + " !",
            //   function(buttonIndex) {
            //     if (buttonIndex === 1) {
            //       console.log("removing case " + r.handle() + " from remote service");
            //     }
            //   }, "Confirm remote removal");
          }
        }, "Confirm local removal");
      }
  };

  // public functions
  this.init = function(callback) {
    console.log("initializing Landing");
    lockUI("Landing.init");
    // refresh services, types and recent lists
    updateServices(false, callback);
  }; // init

  this.update = function(callback) {
    console.log("updating Landing");
    // refresh services, types and recent lists
    updateServices(true, callback);
  }; // update

  this.updateRT = function() {
    console.log("updating Landing recent & types");
    // refresh services, types and recent lists
    updateTypes(true);
  }; // updateRT

  this.type_property = function(type_name, property_name, default_value) {
    var type = type_lookup[type_name];
    // console.log("retrieving " + property_name + " of type " + type.name);
    if (type === undefined) {
      // console.log("type is undefined, return default");
      return default_value;
    } else if ( property_name in type) {
      // console.log("return " + type[property_name]);
      return type[property_name];
    } else {
      // console.log("type.icon is undefined, return default");
      return default_value;
    }
  }; // type_property
  
  // private functions
  function electActive(detailedServices) {
    // logic to elect the active service among those that are alive
    var len = detailedServices.services.length, i;
    var foundActive = false;
    var foundAlive = -1;
    for ( i = 0; i < len; i++) {
      if (detailedServices.services[i].active && !detailedServices.services[i].dead)
        foundActive = true;
      if (!detailedServices.services[i].dead)
        foundAlive = i;
    }
    if (!foundActive) {
      if (foundAlive == -1)
        navigator.notification.alert("Discovery failed", function() { }, "Service error", "OK");
      else
        detailedServices.services[foundAlive].active = true;
    }
  } // electActive

  function updateServices(update, callback) {
    console.log('updateServices');
    // uncomment to force reloading each time
    // localStorage.clear();
    var services_key = "services.json";
    // public services:
    var serviceUrl = "http://simevo.com/api/process.json";
    // private services:
    // var serviceUrl = "http://192.168.0.1/process.json";
    // var serviceUrl = "http://simevo.com/api/process-private.json";
    if (localStorage.getItem(services_key) === null) {
      // services key in localStorage was empty: first app launch
      console.log("need to discover the services");
      getData(serviceUrl, function(data){
        if (data===null) {
          console.error("No services to discover !");
          data = { "services" : [ ] };
        }
        detailDiscovery(data, function(detailedServices) {
          console.log('detailed services = ' + JSON.stringify(detailedServices));
          electActive(detailedServices);
          saveToLocal(detailedServices, services_key, function() {
            console.log("calling download assets");
            downloadAssets(detailedServices.services, function () {
              console.log('in downloadAssets callback');
              loadFromLocal(services_key, update, callback);
            });
          }); // saveToLocal
        });  // detailDiscovery
      }); // getData
    } else if (!update) {
      console.log("services already in local: need to update them");
      var services_string = localStorage.getItem(services_key);
      var old_services = JSON.parse(services_string);
      getData(serviceUrl, function(new_data){
        if (new_data===null) {
          console.error("No services to discover !");
          new_data = { "services" : [ ] };
        }
        // mark as dead the old services that are not anymore in new_data, and delete from new_data the old ones
        old_services.services.forEach(function(service) {
          var len = new_data.services.length, i, found = -1;
          for (i = 0; i < len; i++)
            if (new_data.services[i].service_uuid == service.service_uuid)
              found = i;
          if (found >= 0) {
            // known service is in new_data
            if (new_data.services[found].status=="alive"){
              service.dead = false;
            } else {
              service.dead = true;
              service.active = false;
            }
            new_data.services.splice(found, 1);
          } else {
            service.dead = true;
            service.active = false;
          } // found
        });
        detailDiscovery(new_data, function(detailedNewServices) {
          console.log('new detailed services = ' + JSON.stringify(detailedNewServices));
          var detailedServices = {};
          detailedServices.services = detailedNewServices.services.concat(old_services.services);
          console.log('resulting detailed services = ' + JSON.stringify(detailedServices));
          electActive(detailedServices);
          saveToLocal(detailedServices, services_key, function() {
            console.log("calling download assets");
            downloadAssets(detailedNewServices.services, function () {
              console.log('in downloadAssets callback');
              loadFromLocal(services_key, update, callback);
            });
          }); // saveToLocal
        });  // detailDiscovery
      }); // getData
    } else {
      console.log("services already in local");
      // make as if all files are already downloaded (actually they are!)
      downloaded = toDownload - 1;
      loadFromLocal(services_key, update, callback);
    } // if services key present in localStorage or init
  } // updateServices

  ///////////////////////////// update enumerators ////////////////////////////

  var mappingEnumerators = {
    'enumerators' : {
      create : function(options) {
        return new MyEnumeratorModel(options.data);
      }
    }
  };
  var MyEnumeratorModel = function(data) {
    var self = this;
    ko.mapping.fromJS(data, { }, self);
    self.default = ko.computed(function() {
      return enumerator_default[this.name()];
    }, this);
  };

  function updateEnumerators(update, callback) {
    console.log('updateEnumerators');

    var service_uuid = THIS.viewModel.services.activeService().service_uuid();
    getFileEntry(service_uuid, '/enumerators.json', function(fileEntry) {
      console.log('--------loading enumerators from: ' + fileEntry.toURL() + '-----------------');
      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
          if (this.result === null) {
            console.error("enumerators.json null");
          }
          if (this.result === undefined) {
            console.error("enumerators.json undefined");
          }
          console.log("raw file enumerators.JSON = " + this.result);
          if (typeof this.result === 'object') {
            enumerators = this.result;
          } else if (typeof this.result === 'string') {
            console.log("enumerators string length = " + this.result.length);
            if (this.result.length === 0) {
              console.error("enumerators.json empty");
              navigator.notification.alert("Try clearing the cache !", function() { }, "Internal app error", "OK");
            }
            enumerators = JSON.parse(this.result);
          } else {
            console.error("enumerators.json has unexpected type");
          }
          console.log("enumerators = " + JSON.stringify(enumerators.enumerators));

          enumerator_lookup = {};
          for (var i = 0, len = enumerators.enumerators.length; i < len; i++) {
            // provide default for the default (!)
            enumerator_default[enumerators.enumerators[i].name] = 0;
            // console.log("adding enumerator_lookup for " + enumerators.enumerators[i].name);
            enumerator_lookup[enumerators.enumerators[i].name] = enumerators.enumerators[i];
            enumerator_lookup[enumerators.enumerators[i].name].option = {}; // store descriptions
            for (var j = 0, len1 = enumerators.enumerators[i].options.length; j < len1; j++) {
              enumerator_lookup[enumerators.enumerators[i].name].option[enumerators.enumerators[i].options[j].name] = enumerators.enumerators[i].options[j].description;
              if (enumerators.enumerators[i].options[j].default) {
                enumerator_default[enumerators.enumerators[i].name] = j;
              }
            }
          }
          console.log("enumerator_lookup = " + JSON.stringify(enumerator_lookup));
          console.log("enumerator_default = " + JSON.stringify(enumerator_default));
          if (update)
            ko.mapping.fromJS(enumerators, mappingEnumerators, THIS.viewModel.enumerators);
          else
            THIS.viewModel.enumerators = ko.mapping.fromJS(enumerators, mappingEnumerators);
          
          updateTypes(update, callback);
        };
        reader.readAsText(file);
      }); // fileEntry
    }); // gotFileEntry
  } // updateEnumerators

  /////////////////////////////// update types ////////////////////////////////

  var mappingTypes = {
    'types' : {
      create : function(options) {
        return new MyTypesModel(options.data);
      }
    }
  };
  var MyTypesModel = function(data) {
    var self = this;
    ko.mapping.fromJS(data, mappingStringOptions, self);
    self.instance_tag = ko.observable().extend({ valid: " ,-_{}<>" });
    self.instance_description = ko.observable().extend({ valid: " ,:-_{}<>[]." });
    self.isValid = ko.computed(function() {
      return ( this.instance_tag.isValid() && this.instance_description.isValid() );
    }, this);
    self.last_used = ko.computed({
      read : function() {
        return type_used(self.name());
      },
      write : function(value) {
        set_type_used(self.name(), value);
      }
    });
  };

  var mappingStringOptions = {
    'stringOptions' : {
      create : function(options) {
        return new MyStringOptionsModel(options.data);
      }
    }
  };
  var MyStringOptionsModel = function(data) {
    ko.mapping.fromJS(data, {}, this);
    this.selected = ko.observable(enumerator_default[this.enumerator()]);
    this.selected_description = ko.computed(function() {
      console.log('looking for the description of option ' + this.selected() + ' in enumerator ' + this.enumerator());
      return enumerator_lookup[this.enumerator()].option[this.selected()];
    }, this);
    this.options = ko.computed(function() {
      console.log('returning options for enumerator ' + this.enumerator());
      return enumerator_lookup[this.enumerator()].options;
    }, this);
  };

  function updateTypes(update, callback) {
    console.log('updateTypes');

    var types_used_key = "types_used.json";
    if (localStorage.getItem(types_used_key) === null) {
      // store initial types_used list in local storage
      try {
        localStorage.setItem(types_used_key, '[]');
      } catch (e) {
        if (e == QUOTA_EXCEEDED_ERR) {
          console.log('Web Storage quota exceeded');
        }
      }
    }
    // load value from local storage
    var types_used_json = localStorage.getItem(types_used_key);
    // parse JSON to javascript object
    types_used = JSON.parse(types_used_json);

    var service_uuid = THIS.viewModel.services.activeService().service_uuid();
    getFileEntry(service_uuid, '/types.json', function(fileEntry) {
      console.log('--------loading types from: ' + fileEntry.toURL() + '-----------------');
      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function (e) {
          if (this.result === null) {
            console.error("types.json null");
          }
          if (this.result === undefined) {
            console.error("types.json undefined");
          }
          console.log("raw file types.JSON = " + this.result);
          if (typeof this.result === 'object') {
            types = this.result;
          } else if (typeof this.result === 'string') {
            console.log("types string length = " + this.result.length);
            if (this.result.length === 0) {
              console.error("types.json empty");
              navigator.notification.alert("Try clearing the cache !", function() { }, "Internal app error", "OK");
            }
            types = JSON.parse(this.result);
          } else {
            console.error("types.json has unexpected type");
          }
          var types_instantiatable = {
            'types' : []
          };
          for (var x = 0; x < types.types.length; x++) {
            var t = types.types[x];
            if (t.instantiable) {
              types_instantiatable.types.push(t);
            }
            if (t.icon) {
              t.icon = THIS.viewModel.prefix() + service_uuid + "/" + t.icon;
            } else {
              t.icon = "images/" + t.category + ".svg";
            }
          }
          console.log("types_instantiatable = " + JSON.stringify(types_instantiatable.types));

          for (var i = 0, len = types.types.length; i < len; i++) {
            // console.log("adding type_lookup for " + types.types[i].name);
            type_lookup[types.types[i].name] = types.types[i];
          }
          // console.log("type_lookup = " + JSON.stringify(type_lookup));

          if (update)
            ko.mapping.fromJS(types_instantiatable, mappingTypes, THIS.viewModel.types);
          else
            THIS.viewModel.types = ko.mapping.fromJS(types_instantiatable, mappingTypes);
          THIS.viewModel.types.types.sort(sortFunction);
          
          updateRecent(update, callback);
        };
        reader.readAsText(file);
      }); // fileEntry
    }); // gotFileEntry
  } // updateTypes

  //////////////////////////////// update recent ///////////////////////////////
  var mappingRecent = {
    create : function(options) {
      // console.log("creating recent with data = " + options.data);
      // first map the vm like normal
      var mapping2 = {
        'recent' : {
          create : function(options) {
            // console.log("creating recent[] with data = " + options.data);
            return new MyRecentModel(options.data);
          }
        }
      };
      var vm = ko.mapping.fromJS(options.data, mapping2);

      // now manipulate the returned vm in any way that you like
      vm.query = ko.observable('');
      vm.query_lowercase = ko.computed(function() {
        return vm.query().toLowerCase();
      });
      vm.recentFiltered = ko.computed(function() {
        // console.log("query = " + vm.query() + " recent = " + vm.recent().length);
        if (vm.query().length === 0) {
          return vm.recent();
        } else {
          return vm.recent().filter(function(r) {
            var q = vm.query_lowercase();
            return ((r.type().toLowerCase().search(q) >= 0) || (r.tag().toLowerCase().search(q) >= 0) || (r.description().toLowerCase().search(q) >= 0));
          });
        }
      });

      // return our vm that has been mapped and tweaked
      return vm;
    }
  };
  var MyRecentModel = function(data) {
    ko.mapping.fromJS(data, {}, this);
    this.icon = ko.computed(function() {
      return THIS.type_property(this.type(), "icon", "images/unit.svg");
    }, this);
    this.type_description = ko.computed(function() {
      return THIS.type_property(this.type(), "description", "");
    }, this);
  };
  var sortFunction = function(left, right) {
    return left.last_used() == right.last_used() ? 0 : (left.last_used() > right.last_used() ? -1 : 1);
  };

  function updateRecent(update, callback) {
    console.log('updateRecent');
    var recent_key = THIS.viewModel.services.activeService().service_uuid() + ".recent.json";
    if (localStorage.getItem(recent_key) === null) {
      // store initial empty recent list in local storage
      try {
        localStorage.setItem(recent_key, '{"recent":[]}');
      } catch (e) {
        if (e == QUOTA_EXCEEDED_ERR) {
          console.log('Web Storage quota exceeded');
        }
      }
    }
    // load value from local storage
    var recent_json = localStorage.getItem(recent_key);
    // parse JSON to javascript object
    var recent = JSON.parse(recent_json);
    if (update) {
      ko.mapping.fromJS(recent, mappingRecent, THIS.viewModel.recent);
      THIS.viewModel.recent.query("");
    } else {
      THIS.viewModel.recent = ko.mapping.fromJS(recent, mappingRecent);
    }
    THIS.viewModel.recent.recent.sort(sortFunction);
    
    service_undefined = apply(service_undefined, update);

    // activating field clearer
    var recent_search_clearer = document.getElementById('recent-search-clearer');
    recent_search_clearer.onclick = function() {
      clear_field('recent-search');
    };

    unlockUI("updateRecent");
    THIS.initialized = true;
    if (callback)
      callback();
  } // updateRecent

  function removeRecent(handle) {
    console.log("removeRecent " + handle);
    var recent_key = THIS.viewModel.services.activeService().service_uuid() + ".recent.json";
    console.log("recent_key = " + recent_key);
    if (localStorage.getItem(recent_key) !== null) {
      // load value from local storage
      var recent_json = localStorage.getItem(recent_key);
      // parse JSON to javascript object
      var recent = JSON.parse(recent_json);
      console.log("found " + recent.recent.length + " items");
      for(var i = recent.recent.length - 1; i >= 0; i--) {
        console.log("looking at " + recent.recent[i].handle);
        if(recent.recent[i].handle === handle) {
          console.log("found it: " + JSON.stringify(recent.recent[i]));
          recent.recent.splice(i, 1);
        } // match handle
      } // for each item
      recent_json = JSON.stringify(recent);
      localStorage.setItem(recent_key, recent_json);
    }
  } // removeRecent

  // all DOM manipulations are done by this function 
  function apply(service_undefined, update) {
    var ts = document.getElementsByClassName("tab");

    if (!update) {
      console.log("applying Landing");
      var landing_page = document.getElementById('landing-page');
      ko.applyBindings(THIS.viewModel, landing_page);

      // assign onclick events to the tabs
      for (var x = 0; x < ts.length; x++) {
        ts[x].onclick = toggleTab;
      }
    }

    var service_uuid = THIS.viewModel.services.activeService().service_uuid();
    var background_file = THIS.viewModel.prefix() + service_uuid + '/background.jpg';
    console.log('--------loading background from: ' + background_file + '-----------------');
    var background = document.getElementById('background');
    background.style.backgroundImage = 'url(' + background_file + ')';
    console.log('set background image of div#background to: ' + background_file);

    if (service_undefined) {
      // if the service has not yet been chosen, open the services tab
      sendClick(ts[0]);
    } else if (THIS.viewModel.recent.recent().length === 0) {
      // if there is no recent, open the new tab
      sendClick(ts[1]);
    } else {
      // else open the recent tab
      sendClick(ts[2]);
    }
    return false;
  } // apply

  // returns detailed service data
  function detailDiscovery(data, callback){
    console.log("detailDiscovery: " + JSON.stringify(data));
    if (data.services.length === 0) {
      callback(data);
    } else {
      var serviceArray = [];
      var i = 0;
      var len = data.services.length;
      data.services.forEach(function(serviceData){
        console.log("discovering " + JSON.stringify(serviceData));
        getData(serviceData.url,function(details){
          if(details===null){
            console.error("impossible to discover " + serviceData.url + " !");
            details = { };
            details.active = false;
            details.dead = true;
            details.service_uuid = serviceData.service_uuid;
            details.url = serviceData.url;
            details.info_url = '';
            details.name = "unknown";
            details.description = '';
            details.color = "#000000";
          } else {
            console.log("Adding service status: "+serviceData.status);
            if (serviceData.status=="alive"){
              details.dead = false;
              // candidate = i;
            } else {
              details.dead = true;
            }
          }
          if (!details.active) {
            details.active = false;
          }
          details.last_used = i;
          serviceArray.push(details);
          i++;
          if(i>=len){
            callback({"services" : serviceArray});
          }
        });
      });
    } // if data services is empty
  } // detailDiscovery

  function saveToLocal(initial_services, services_key, callback) {
    console.log('saveToLocal with services_key = ' + services_key);
    try {
      localStorage.setItem(services_key, JSON.stringify(initial_services));
      service_undefined = true;
    } catch (e) {
      if (e == "QUOTA_EXCEEDED_ERR") {
        console.log('Web Storage quota exceeded');
      }
    }
    callback();
  }

  function downloadAssets(services, callback) {
    console.log('downloadAssets ' + JSON.stringify(services));
    if (services.length === 0) {
      toDownload = 1;
      callback();
    } else {
      var done = false;
      services.forEach(function(service) {
        if (!service.dead) {
          toDownload += 5;
          done = true;

          console.log('about to download for ' + service.service_uuid + ' toDownload = ' + toDownload);

          var enumUrl = service.url + 'enumerators';
          downloadFile(enumUrl, service.service_uuid, 'enumerators.json', callback);

          var typesUrl = service.url + 'types';
          downloadFile(typesUrl, service.service_uuid, 'types.json', callback);

          var iconUrl = service.url + 'icon';
          downloadFile(iconUrl, service.service_uuid, 'icon.svg', callback); //icon

          var backgroundUrl = service.url + 'background/' + Math.max(window.innerHeight, window.innerWidth);
          downloadFile(backgroundUrl, service.service_uuid, 'background.jpg', callback);

          var assetsUrl = service.url + 'assets';
          getData(assetsUrl, function(data) {
            toDownload += data.assets.length - 1;
            data.assets.forEach(
              function(svg) {
                var filename = svg.substring(svg.lastIndexOf('/')+1);
                downloadFile(svg, service.service_uuid, filename, callback);
              }
            );
          });
        } // service is active
      }); // for each service
      if (!done) {
        toDownload = 1;
        callback();
      }
    } // if services is empty
    console.log("downloadAssets done");
} // downloadAssets

  // http://stackoverflow.com/questions/8673928/adding-properties-to-the-view-model-created-by-using-the-knockout-js-mapping-plu
  var mappingServices = {
    // customize at the root level.
    create : function(options) {
      // console.log("creating services with data = " + options.data);
      // first map the vm like normal
      var vm = ko.mapping.fromJS(options.data);
      // now manipulate the returned vm in any way that you like

      // from http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
      // identify the first matching item by name
      vm.activeService = ko.computed(function() {
        return ko.utils.arrayFirst(vm.services(), function(item) {
          return item.active();
        });
      });

      vm.aliveService = ko.computed(function() {
        return ko.utils.arrayFirst(vm.services(), function(item) {
          return !item.dead();
        });
      });

      // return our vm that has been mapped and tweaked
      return vm;
    }
  };

  function loadFromLocal(services_key, update, callback) {
    downloaded += 1;
    console.log('loadFromLocal downloaded = ' + downloaded + ' toDownload = ' + toDownload);
    if (downloaded == toDownload) {
      console.log('================================================================================');
      console.log('done downloading assets');

      window.requestFileSystem(
        LocalFileSystem.PERSISTENT,
        0,
        onRequestFileSystemSuccess,
        fail
      );
    } // all required files have arrived

    function onRequestFileSystemSuccess(fileSystem) {
      var prefix = fileSystem.root.toURL();
      console.log("prefix = " + prefix);
      THIS.viewModel.prefix(prefix);

      // load value from local storage
      var services_json = localStorage.getItem(services_key);
      // parse JSON to javascript object
      var services = JSON.parse(services_json);
      
      if (update)
        ko.mapping.fromJS(services, mappingRecent, THIS.viewModel.services);
      else
        THIS.viewModel.services = ko.mapping.fromJS(services, mappingServices);
      THIS.viewModel.services.services().sort(function(left, right) {
        return left.last_used() == right.last_used() ? 0 : (left.last_used() > right.last_used() ? -1 : 1);
      });

      updateEnumerators(update, callback);
    }
  } // loadFromLocal

  function type_used(type_name) {
    var len = types_used.length, i;
    for ( i = 0; i < len; i++) {
      if (types_used[i].name == type_name)
        return types_used[i].last_used;
    }
    return 0;
  }

  function set_type_used(type_name, value) {
    var len = types_used.length, i, found = false;
    for ( i = 0; i < len; i++) {
      if (types_used[i].name == type_name) {
        types_used[i].last_used = value;
        found = true;
      }
    }
    if (!found)
      types_used.push({
        "name" : type_name,
        "last_used" : value
      });

    var types_used_key = "types_used.json";
    var types_used_json = JSON.stringify(types_used);
    // update value to local storage
    localStorage.setItem(types_used_key, types_used_json);
  }

}); // Landing namespace
