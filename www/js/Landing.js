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
  var first = false;
  // provide access to the function-scope this object in the private functions
  var THIS = this;

  // public variables
  // view model with child view models
  this.viewModel = {
    prefix : ko.observable(''),
    services : [],
    recent : [],
    types : [],
    enumerators : []
  };

  // public functions
  this.init = function() {
    console.log("initializing Landing");
    // refresh services, types and recent lists
    first = updateServices(false, updateOthers);
  }; // init

  this.update = function() {
    console.log("updating Landing");
    // refresh services, types and recent lists
    first = updateServices(true, updateOthers);
  }; // update

  this.updateRT = function() {
    console.log("updating Landing recent & types");
    // refresh services, types and recent lists
    updateTypes(true, updateRecent);
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
  function updateServices(update, callback) {
    console.log('updateServices');
    // uncomment to force reloading each time
    // localStorage.clear();
    var services_key = "services.json";
    var serviceUrl = "http://simevo.com/api/process.json";
    if (localStorage.getItem(services_key) === null) {
      console.log("need to update from server");
      getDataFromAPI(serviceUrl, function(data){
        if (data===null) {
          console.error("No services to discover !");
          data = { "services" : [ ] };
        }
        detailDiscovery(data, function(detailedServices){
          console.log('detailed services = ' + JSON.stringify(detailedServices));
          saveToLocal(detailedServices,services_key,function(isFirst){
            console.log("calling download assets for ");
            downloadAssets(services_key,function(){
              return loadFromLocal(isFirst,services_key,update,callback);
            });
          });
        });  
      });
    } // services key in localStorage was empty: first app launch 
    else {
      console.log("services already in local");
      return loadFromLocal(false,services_key,update,callback);
    }
  } // updateServices

  function updateOthers(update) {
    updateEnumerators(update, updateTypes, updateRecent);
  } // updateOthers

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

  function updateEnumerators(update, callback1, callback2) {
    console.log('updateEnumerators');

    var uuid = THIS.viewModel.services.activeService().uuid();
    getFileEntry(uuid, '/enumerators.json', function(fileEntry) {
      console.log('--------loading enumerators from: ' + fileEntry.toURL() + '-----------------');
      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
          console.log("raw file enumerators.JSON = " + this.result);
          if (typeof this.result === 'object')
            enumerators = this.result;
          else
            enumerators = JSON.parse(this.result);
          console.log("enumerators = " + JSON.stringify(enumerators.enumerators));

          enumerator_lookup = {};
          for (var i = 0, len = enumerators.enumerators.length; i < len; i++) {
            // console.log("adding enumerator_lookup for " + enumerators.enumerators[i].name);
            enumerator_lookup[enumerators.enumerators[i].name] = enumerators.enumerators[i];
            for (var j = 0, len1 = enumerators.enumerators[i].options.length; j < len1; j++) {
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
          
          callback1(update, callback2);
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
    self.instance_tag = ko.observable();
    self.instance_description = ko.observable();
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
      return enumerator_lookup[this.enumerator()].options[this.selected()].description;
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

    var uuid = THIS.viewModel.services.activeService().uuid();
    getFileEntry(uuid, '/types.json', function(fileEntry) {
      console.log('--------loading types from: ' + fileEntry.toURL() + '-----------------');
      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function (e) {
          if (typeof this.result === 'object')
            types = this.result;
          else
            types = JSON.parse(this.result);
          console.log("types = " + JSON.stringify(types.types));

          var types_instantiatable = {
            'types' : []
          };
          for (var x = 0; x < types.types.length; x++) {
            var t = types.types[x];
            if (t.instantiable) {
              types_instantiatable.types.push(t);
            }
            if (t.icon) {
              t.icon = THIS.viewModel.prefix() + uuid + "/" + t.icon;
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
          
          callback(update);
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

  function updateRecent(update) {
    console.log('updateRecent');
    var recent_key = THIS.viewModel.services.activeService().uuid() + ".recent.json";
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
    if (update)
      ko.mapping.fromJS(recent, mappingRecent, THIS.viewModel.recent);
    else
      THIS.viewModel.recent = ko.mapping.fromJS(recent, mappingRecent);
    THIS.viewModel.recent.recent.sort(sortFunction);
    
    if (!update)
      apply();
  } // updateRecent

  function apply() {
    console.log("applying Landing");
    var landing_page = document.getElementById('landing-page');
    ko.applyBindings(THIS.viewModel, landing_page);

    // assign onclick events
    var ts = document.getElementsByClassName("tab");
    for (var x = 0; x < ts.length; x++) {
      ts[x].onclick = toggleTab;
    }

    if (first) {
      // if the service has not yet been chosen, open the services tab
      sendClick(ts[2]);
    } else if (THIS.viewModel.recent.recent().length === 0) {
      // if there is no recent, open the new tab
      sendClick(ts[1]);
    } else {
      // else open the recent tab
      sendClick(ts[0]);
    }
  } // apply

  function getDataFromAPI(url,callback) {
    console.log('IN GETDATAFROMAPI FUNC');
    //get data from given url
    console.log('connecting to: '+url);
    try {
      var request = new XMLHttpRequest();
      var data;
      request.onload = function() {
        if (request.status >= 200 && request.status < 400){
          console.log("request success"+request.responseText);
          data = JSON.parse(request.responseText);
          callback(data);
        } else {
          console.error('problem in the server: '+url);
          callback(null);
        // We reached our target server, but it returned an error
        }
      };
      request.onerror = function(e) {
        console.error('connection error for URL: '+url + ', error status: ' + e.target.status);
        callback(null);
      };
      request.open('GET', url, true);
      request.send();
    } catch(err){
      console.error('problem in the server: '+err);
    }
  } // getDataFromAPI

  // returns detailed service data
  function detailDiscovery(data, callback){
    console.log("IN DETAIL_DISCOVERY FUNC");
    var serviceArray = [];
    var i=0;
    var len = data.services.length;
    data.services.forEach(function(serviceData){
      console.log("discovering " + JSON.stringify(serviceData));  
      getDataFromAPI(serviceData.url,function(details){
        if(details===null){
          console.error("impossible to discover " + serviceData.url + " !");
          details = { };
          details.active = false;
          details.dead = true;
          details.uuid = serviceData.service_uuid;
          details.server = serviceData.url;
          details.name = "unknown";
          details.description = "";
          details.color = "#000000";
        } else {
          console.log("Adding service status: "+serviceData.status);
          if (serviceData.status=="active"){
            details.active = true;
            details.dead = false;
            console.log("Details active: "+details.active);
          } else {
            details.active = false;
            details.dead = false;
            console.log("Details active: "+details.active);
          }
        }
        details.last_used = i;
        serviceArray.push(details);
        i++;
        if(i>=len){
          callback({"services" : serviceArray});
        }
      });
    });
  } // detailDiscovery

  function saveToLocal(initial_services, services_key,callback){
    console.log('IN SAVE TO LOCAL FUNC');
    first = false;
    try {
      localStorage.setItem(services_key, JSON.stringify(initial_services));
      first = true;
    } catch (e) {
      if (e == "QUOTA_EXCEEDED_ERR") {
        console.log('Web Storage quota exceeded');
      }
    }
    callback(first);
  }

  function downloadAssets(services_key, callback) {
    console.log("IN DOWNLOAD ASSETS FUNC");
    var services_json = localStorage.getItem(services_key);
    services_json = JSON.parse(services_json);
    services_json.services.forEach(function(service) {
      if (service.active) {
        var iconUrl = service.server+'icon';
        downloadFile(iconUrl,service.uuid,"icon.svg");//icon

        var backgroundUrl = service.server+'background/1000';
        downloadFile(backgroundUrl,service.uuid,'background.jpg'); //background file

        var typesUrl = service.server+'types';
        downloadFile(typesUrl,service.uuid,'types.json');

        var enumUrl = service.server+'enumerators';
        downloadFile(enumUrl,service.uuid,'enumerators.json');

        var svgsUrl = service.server+'svgs';
        getDataFromAPI(svgsUrl, function(data){
          data.svgs.forEach(
            function(svg) {
              var filename = svg.substring(svg.lastIndexOf('/')+1);
              downloadFile(svg,service.uuid,filename);
            }
          );
          console.log('================================================================================');
          callback();
        });
      } // service is active
    }); // for each service  
  } // downloadAssets

  function fail(e) {
    console.log("FileSystem Error");
    console.dir(e);
  }

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

      // return our vm that has been mapped and tweaked
      return vm;
    }
  };

  function loadFromLocal(first,services_key,update,callback) {
    console.log('loadFromLocal');

    window.requestFileSystem(
      LocalFileSystem.PERSISTENT,
      0,
      onRequestFileSystemSuccess,
      fail
    );
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

      var uuid = THIS.viewModel.services.activeService().uuid();
      var background_file = THIS.viewModel.prefix() + uuid + '/background.jpg';
      console.log('--------loading background from: ' + background_file + '-----------------');

      var box = document.getElementById('box');
      box.style.backgroundImage = 'url(' + background_file + ')';
      console.log('set background image of div#box to: ' + background_file);

      var background = document.getElementById('background');
      background.style.backgroundImage = 'url(' + background_file + ')';
      console.log('set background image of div#background to: ' + background_file);

      callback(update);
    }

    return first;
  } // loadFromLocal

  function downloadFile(url, dirName, fileName) {
    console.log('downloadFile url = ' + url + " dirName = " + dirName + " fileName = " + fileName);
    var URL = url;
    
    window.requestFileSystem(
      LocalFileSystem.PERSISTENT,
      0,
      onRequestFileSystemSuccess,
      fail
    );

    function onRequestFileSystemSuccess(fileSystem) {
      if (dirName === '') {
        console.log('create ' + fileName + ' in root');
        fileSystem.root.getFile(fileName,
          { create: true, exclusive: false},
          function(fileEntry) {
            var path = fileEntry.toURL();
            onGetFileSuccess(path);
          },
          fail
        );
      } else {
        console.log('create ' + fileName + ' in ' + dirName);
        fileSystem.root.getDirectory(
          dirName,
          { create: true, exclusive: false},
          function(dirEntry) {
            var path = dirEntry.toURL() + fileName;
            onGetFileSuccess(path);
          },
          fail
        );
      }
    }
            
    function onGetFileSuccess(path) {
      console.log("transferring URL " + URL + " to file " + path);
      var fileTransfer = new FileTransfer();
      //fileEntry.remove();

      fileTransfer.download(
        URL,
        path,
        function(file) {
          console.log('download complete: ' + file.toURL());
        },
        function(error) {
          console.log('download error source ' + error.source +' target ' + error.target + ' code ' + error.code);
        }
      );
    }
  } // downloadFile

  function getFileEntry(dirName,fileName,callback){
    // https://developer.mozilla.org/en-US/docs/Web/API/LocalFileSystem#requestFileSystem
    window.requestFileSystem(
      LocalFileSystem.PERSISTENT,
      0,
      onRequestFileSystemSuccess,
      fail
    );
    function onRequestFileSystemSuccess(fileSystem){
      fileSystem.root.getFile(dirName+fileName, null, function(entry){
        console.log('entry = ' + entry.toURL());
        callback(entry);
      }, fail);
    }
  }

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
