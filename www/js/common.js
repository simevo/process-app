"use strict";
// jshint trick:
// var window, document, console, ko, localStorage, UndoManager;

function init() {
  // define a knockout binding handler to get the selectedIndex property of the select element
  // i.e. to find out the index of the currently selected option
  // http://stackoverflow.com/questions/16136552/get-the-id-of-the-selected-value-in-combobox-with-knockout
  // http://www.knockmeout.net/2011/07/another-look-at-custom-bindings-for.html
  ko.bindingHandlers.selectedIndex = {
    init : function(element, valueAccessor) {
      // This will be called when the binding is first applied to an element
      // Set up any initial state, event handlers, etc. here

      ko.utils.registerEventHandler(element, "change", function() {
        var observable = valueAccessor();
        console.log("set observable to " + element.selectedIndex);
        observable(element.selectedIndex);
      });
    },
    update : function(element, valueAccessor) {
      // This will be called once when the binding is first applied to an element,
      // and again whenever any observables/computeds that are accessed change
      // Update the DOM element based on the supplied values here.

      // First get the latest data that we're bound to
      var observable = valueAccessor();
      // Next, whether or not the supplied model property is observable, get its current value
      var value = ko.unwrap(observable);
      // Now manipulate the DOM element
      console.log("set DOM to " + value);
      element.selectedIndex = value;
    }
  };

  // refresh servers, types and recent lists
  updateServers(false);
  updateEnumerators(false);
  updateTypes(false);
  updateRecent(false);

  // assign onclick events
  var ts = document.getElementsByClassName("tab");
  for (var x = 0; x < ts.length; x++) {
    ts[x].onclick = toggleTab;
  }
  var recent_search_clearer = document.getElementById('recent-search-clearer');
  recent_search_clearer.onclick = function() {
    clear_field('recent-search');
  };
  var tag_clearer = document.getElementById('tag-clearer');
  tag_clearer.onclick = function() {
    viewModelConfigure.configure().instance_tag('');
  };
  var description_clearer = document.getElementById('description-clearer');
  description_clearer.onclick = function() {
    viewModelConfigure.configure().instance_description('');
  };
  var landing = document.getElementById('landing-page');
  ko.applyBindings(viewModel, landing);

  // if there is no recent, open the new tab
  if (viewModel.recent.recent().length === 0) {
    sendClick(ts[1]);
  }
  var main = document.getElementById('main-page');
  main.style.display = 'none';
  var configurePage = document.getElementById('configure-page');
  configurePage.style.display = 'none';

  xmlhttp.open("GET", "b14d48e0-1285-11e4-9191-0800200c9a66/0.svg", false);
  xmlhttp.send();
  var svg = xmlhttp.responseText;
  document.getElementById('svg-container').innerHTML = svg;

  overrideXlinks();

  // former initMain stuff

  // sqlite database connection
  if (window.openDatabase) {
    db = openDatabase(current_case + '/persistency.db', '1.0', 'persistency database', 2 * 1024 * 1024);
    db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM N', [], function(tx, results) {
        var len = results.rows.length, i;
        for ( i = 0; i < len; i++) {
          console.log(results.rows.item(i).FULLTAG);
        }
      }, null);
    });
  } else {
    console.log('Database connection failed');
  }

  // initialize configure master view model and view
  viewModelConfigure = {
    configure : ko.observable(null),
    server_uuid : ko.observable(viewModel.servers.activeServer().uuid())
  };
  ko.applyBindings(viewModelConfigure, configurePage);

  // apply bindings for info-toggle button
  var toggleButton = document.getElementById('info-toggle');
  tag = {
    "Tag" : ""
  };
  viewModelToggleButtons = ko.mapping.fromJS(tag);
  ko.applyBindings(viewModelToggleButtons, toggleButton);

  // bindings to inactive/activate children-toggle button
  var childrenToggleButton = document.getElementById('children-toggle');
  viewModelChildrenToggle = ko.mapping.fromJS({
    "hasChildren" : false
  });
  ko.applyBindings(viewModelChildrenToggle, childrenToggleButton);

  // bindings for main button
  var openMainButton = document.getElementById('parent-open-main');
  viewModelOpenMain = {
    homeText : ko.observable('Home'),
    action : ko.observable(-1),
    clickAction : function() {
      if (this.action > -1) {
        change_node(this.action);
      } else {
        openLandingPageFromMain();
      }
    }
  };
  ko.applyBindings(viewModelOpenMain, openMainButton);

  // initialize messages view-model and view
  xmlhttp.open("GET", "messages.json", false);
  xmlhttp.send();
  messages = JSON.parse(xmlhttp.responseText);
  var viewModelMessages = ko.mapping.fromJS(messages, mapping);
  var messages_list = document.getElementById('messages-list');
  ko.applyBindings(viewModelMessages, messages_list);

  // initialize input view-model and view with empty data; these will be actually filled by change_node
  inputs = {
    "inputs" : []
  };
  viewModelInputs = ko.mapping.fromJS(inputs, mapping);
  var input_container = document.getElementById('input-container');
  viewModelInputsFiltered = new ViewModelInputsFiltered();
  viewModelInputsFiltered.inputs = viewModelInputs.inputs.filter(function(i) {
    var q = viewModelInputsFiltered.query_lowercase();
    return ((i.fulltag().toLowerCase().search(q) >= 0) || (i.description().toLowerCase().search(q) >= 0));
  });
  ko.applyBindings(viewModelInputsFiltered, input_container);

  // initialize output view-model and view with empty data; these will be actually filled by change_node
  outputs = {
    "outputs" : []
  };
  viewModelOutputs = ko.mapping.fromJS(outputs, mapping);
  var output_container = document.getElementById('output-container');
  var viewModelOutputsFiltered = new ViewModelOutputsFiltered();
  viewModelOutputsFiltered.outputs = viewModelOutputs.outputs.filter(function(i) {
    var q = viewModelOutputsFiltered.query_lowercase();
    return ((i.fulltag().toLowerCase().search(q) >= 0) || (i.description().toLowerCase().search(q) >= 0));
  });
  ko.applyBindings(viewModelOutputsFiltered, output_container);

  // initialize children view-model and view with empty data; these will be actually filled by change_node
  children = {
    "children" : []
  };
  viewModelChildren = ko.mapping.fromJS(children, mapping);
  var children_list = document.getElementById('children-list');
  ko.applyBindings(viewModelChildren, children_list);

  // assign onclick events
  document.getElementById('input-box').onclick = dummy;
  document.getElementById("number").onchange = updateRange;
  document.getElementById("range").onchange = updateNumber;
  document.getElementById("children-toggle").onclick = toggleChildren;
  var input_search_clearer = document.getElementById('input-search-clearer');
  input_search_clearer.onclick = function() {
    clear_field('input-search');
  };
  var output_search_clearer = document.getElementById('output-search-clearer');
  output_search_clearer.onclick = function() {
    clear_field('output-search');
  };

  // point to the node with database N.ID == 0 and load all data
  change_node(0);
}

function clear_field(control_id) {
  var control = document.getElementById(control_id);
  control.value = '';

  var keyboardEvent = document.createEvent("KeyboardEvent");
  var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";
  keyboardEvent[initMethod]("keyup", // event type : keydown, keyup, keypress
  true, // bubbles
  true, // cancelable
  window, // viewArg: should be window
  false, // ctrlKeyArg
  false, // altKeyArg
  false, // shiftKeyArg
  false, // metaKeyArg
  40, // keyCodeArg : unsigned long the virtual key code, else 0
  0 // charCodeArgs : unsigned long the Unicode character associated with the depressed key, else 0
  );
  control.dispatchEvent(keyboardEvent);
}

function sendClick(control) {
  var clickEvent = document.createEvent("MouseEvent");
  clickEvent.initEvent('click', true, true);
  control.dispatchEvent(clickEvent);
}

function type_property(type_name, property_name, default_value) {
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

// global variables
var db;
//  one view model with child view models
var viewModel = {
  servers : [],
  recent : [],
  types : [],
  enumerators : [],
};
var viewModelConfigure;
var servers;
var types;
var enumerators;
var type_lookup = {};
var enumerator_lookup = {};
var enumerator_default = {};
var recent;
var types_used = [];
var xmlhttp = new XMLHttpRequest();
var btnUndo;
var btnRedo;
var current_case = 'b14d48e0-1285-11e4-9191-0800200c9a66';
var mappingTypes = {
  'types' : {
    create : function(options) {
      return new MyTypesModel(options.data);
    }
  }
};
var mappingStringOptions = {
  'stringOptions' : {
    create : function(options) {
      return new MyStringOptionsModel(options.data);
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
var MyStringOptionsModel = function(data) {
  ko.mapping.fromJS(data, {}, this);
  this.selected = ko.observable(enumerator_default[this.enumerator()]);
  this.selected_description = ko.computed(function() {
    // console.log('looking for the description of option ' + this.selected() + ' in enumerator ' + this.enumerator());
    return enumerator_lookup[this.enumerator()].options[this.selected()].description;
  }, this);
  this.options = ko.computed(function() {
    return enumerator_lookup[this.enumerator()].options;
  }, this);
};

function updateTypes(update) {
  var types_used_key = "types_used.json";
  if (localStorage.getItem(types_used_key) === null) {
    // store initial types_used list in local storage
    try {
      localStorage.setItem(types_used_key, '[]');
    } catch (e) {
      if (e == QUOTA_EXCEEDED_ERR)
        ;
      {
        console.log('Web Storage quota exceeded');
      }
    }
  }
  // load value from local storage
  var types_used_json = localStorage.getItem(types_used_key);
  // parse JSON to javascript object
  types_used = JSON.parse(types_used_json);

  xmlhttp.open("GET", viewModel.servers.activeServer().uuid() + "/types.json", false);
  xmlhttp.send();
  types = JSON.parse(xmlhttp.responseText);
  var types_instantiatable = {
    'types' : []
  };
  for (var x = 0; x < types.types.length; x++) {
    var t = types.types[x];
    if (t.instantiable) {
      types_instantiatable.types.push(t);
    }
    if (t.icon) {
      t.icon = viewModel.servers.activeServer().uuid() + "/" + t.icon;
    } else {
      t.icon = "images/" + t.category + ".png";
    }
  }
  // console.log("types = " + JSON.stringify(types.types));

  for (var i = 0, len = types.types.length; i < len; i++) {
    // alert("adding type_lookup for " + types.types[i].name);
    type_lookup[types.types[i].name] = types.types[i];
  }
  // console.log(JSON.stringify(type_lookup));

  if (update)
    ko.mapping.fromJS(types_instantiatable, mappingTypes, viewModel.types);
  else
    viewModel.types = ko.mapping.fromJS(types_instantiatable, mappingTypes);
  viewModel.types.types.sort(sortFunction);
}// updateTypes

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
  self.default =
  ko.computed(function() {
    return enumerator_default[this.name()];
  }, this);
};
function updateEnumerators(update) {
  xmlhttp.open("GET", viewModel.servers.activeServer().uuid() + "/enumerators.json", false);
  xmlhttp.send();
  enumerators = JSON.parse(xmlhttp.responseText);
  // alert(JSON.stringify(enumerators.enumerators));
  enumerator_lookup = {};
  for (var i = 0, len = enumerators.enumerators.length; i < len; i++) {
    // alert("adding enumerator_lookup for " + enumerators.enumerators[i].name);
    enumerator_lookup[enumerators.enumerators[i].name] = enumerators.enumerators[i];
    for (var j = 0, len1 = enumerators.enumerators[i].options.length; j < len1; j++) {
      if (enumerators.enumerators[i].options[j].default) {
        enumerator_default[enumerators.enumerators[i].name] = j;
      }
    }
  }
  // console.log(JSON.stringify(enumerator_lookup));
  // console.log(JSON.stringify(enumerator_default));
  if (update)
    ko.mapping.fromJS(enumerators, mappingEnumerators, viewModel.enumerators);
  else
    viewModel.enumerators = ko.mapping.fromJS(enumerators, mappingEnumerators);
}// updateEnumerators

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
    return type_property(this.type(), "icon", "images/unit.png");
  }, this);
  this.type_description = ko.computed(function() {
    return type_property(this.type(), "description", "");
  }, this);
};
var sortFunction = function(left, right) {
  return left.last_used() == right.last_used() ? 0 : (left.last_used() > right.last_used() ? -1 : 1);
};
function updateRecent(update) {
  var recent_key = viewModel.servers.activeServer().uuid() + ".recent.json";
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
    ko.mapping.fromJS(recent, mappingRecent, viewModel.recent);
  else
    viewModel.recent = ko.mapping.fromJS(recent, mappingRecent);
  viewModel.recent.recent.sort(sortFunction);
}// updateRecent

// http://stackoverflow.com/questions/8673928/adding-properties-to-the-view-model-created-by-using-the-knockout-js-mapping-plu
var mappingServers = {
  // customize at the root level.
  create : function(options) {
    // console.log("creating servers with data = " + options.data);
    // first map the vm like normal
    var vm = ko.mapping.fromJS(options.data);

    // now manipulate the returned vm in any way that you like

    // from http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
    // identify the first matching item by name
    vm.activeServer = ko.computed(function() {
      return ko.utils.arrayFirst(vm.servers(), function(item) {
        return item.active();
      });
    });

    // return our vm that has been mapped and tweaked
    return vm;
  }
};

function updateServers(update) {
  var servers_key = "servers.json";
  if (localStorage.getItem(servers_key) === null) {
    // store initial server list in local storage
    try {
      var initial_servers = {
        "servers" : [{
          "name" : "Pasteurize",
          "active" : true,
          "last_used" : 1,
          "description" : "Process modeling of continuous pasteurization processes",
          "server" : "https://pasteurize.it",
          "uuid" : "62e3a255-c1a0-4dea-a650-05b9a4a33aef"
        }, {
          "name" : "Geometry",
          "active" : false,
          "last_used" : 0,
          "description" : "Surface, volume and partial filling volume of solids",
          "server" : "https://libpf.com/geometry_demo",
          "uuid" : "e912989f-9b8f-4d4a-9bd6-f0c351fd770a"
        }, {
          "name" : "Gasify",
          "active" : false,
          "last_used" : 0,
          "description" : "Process modeling of small-scale biomass gasification plants",
          "server" : "https://jasper.com",
          "uuid" : "1187ffe2-497c-4a5e-b03a-b5f479499c9d"
        }, {
          "name" : "Digest",
          "active" : false,
          "last_used" : 0,
          "description" : "Process modeling of biogas plant from anaerobic digestion",
          "server" : "https://shite.com",
          "uuid" : "f8d83420-08e1-11e4-9191-0800200c9a66"
        }]
      };
      var initial_servers_json = JSON.stringify(initial_servers);
      localStorage.setItem(servers_key, initial_servers_json);
    } catch (e) {
      if (e == QUOTA_EXCEEDED_ERR) {
        console.log('Web Storage quota exceeded');
      }
    }
  }
  // load value from local storage
  var servers_json = localStorage.getItem(servers_key);
  // parse JSON to javascript object
  var servers = JSON.parse(servers_json);
  if (update)
    ko.mapping.fromJS(servers, mappingRecent, viewModel.servers);
  else
    viewModel.servers = ko.mapping.fromJS(servers, mappingServers);
  viewModel.servers.servers().sort(function(left, right) {
    return left.last_used() == right.last_used() ? 0 : (left.last_used() > right.last_used() ? -1 : 1);
  });
  var background = document.getElementById('background');
  var s1 = viewModel.servers;
  var a1 = s1.activeServer();
  var uuid = a1.uuid();
  console.log('UUID = ' + a1.uuid());
  background.style.backgroundImage = 'url(' + uuid + '/background-server.jpg)';
}// updateServers

function openServer(uuid) {
  var servers_key = "servers.json";
  // load value from local storage
  var servers_json = localStorage.getItem(servers_key);
  // parse JSON to javascript object
  var servers = JSON.parse(servers_json);
  for (var i = 0, len = servers.servers.length; i < len; i++) {
    var server = servers.servers[i];
    if (server.uuid == uuid) {
      server.active = true;
      server.last_used = Math.round(Date.now() / 1000);
    } else {
      server.active = false;
    }
  }
  servers_json = JSON.stringify(servers);
  localStorage.setItem(servers_key, servers_json);
  // trick
  viewModelConfigure.server_uuid(uuid);
}// openServer

// main-specific code
function hide(thing, thing1) {
  var t = document.getElementById(thing);
  t.style.display = 'none';
  var t1 = document.getElementById(thing1);
  t1.style.display = 'block';
  var t2 = document.getElementById('center');
  t2.className = 'col-xs-12 col-sm-12 no-padding';
  document.getElementById('svg-container').style.zIndex = 1;
}

function show(thing, thing1) {
  var t = document.getElementById(thing);
  t.style.display = 'block';
  var t1 = document.getElementById(thing1);
  t1.style.display = 'none';
  var t2 = document.getElementById('center');
  t2.className = 'col-xs-2 col-sm-7 no-padding';
  document.getElementById('svg-container').style.zIndex = 0;
}

function hideOutputContainer() {
  hide('output-container', 'output-open');
}

function showOutputContainer() {
  hideChildren();
  hideInputContainer();
  hideInfoContainer();

  show('output-container', 'output-open');
  var gd = document.getElementById('gl-children');
  gd.className = "glyphicon glyphicon-chevron-down";
}

function hideInputContainer() {
  hide('input-container', 'input-open');
  var ib = document.getElementById('input-box');
   if (ib.parentNode.tagName.toUpperCase() == 'LI') {
    var v = ib.parentNode.id;
    close(document.getElementById(v));
  }
}

function showInputContainer() {
  hideOutputContainer();
  hideChildren();
  hideInfoContainer();
  show('input-container', 'input-open');
  var gd = document.getElementById('gl-children');
  gd.className = "glyphicon glyphicon-chevron-down";
}

function hideChildren() {
  var t = document.getElementById('children');
  t.style.display = 'none';
  document.getElementById('svg-container').style.zIndex = 1;
}

function toggleChildren() {
  // Recupero l'elemento dall'Id
  var e = document.getElementById('children');
  var gd = document.getElementById('gl-children');
  if (!e.style.display || e.style.display == 'none') {
    // Se e e' nascosto lo visualizzo
    hideOutputContainer();
    hideInputContainer();
    hideInfoContainer();
    e.style.display = "block";
    gd.className = "glyphicon glyphicon-chevron-up";
    document.getElementById('svg-container').style.zIndex = 0;
  } else {
    // Altrimenti lo nascondo
    e.style.display = 'none';
    gd.className = "glyphicon glyphicon-chevron-down";
    document.getElementById('svg-container').style.zIndex = 1;
  }
}

function hideInfoContainer() {
  var t = document.getElementById('info-container');
  t.style.display = 'none';
  document.getElementById('svg-container').style.zIndex = 1;
}

function toggleInfoContainer() {
  // Recupero l'elemento dall'Id
  var e = document.getElementById('info-container');

  // Se e e' nascosto lo visualizzo
  if (!e.style.display || e.style.display == 'none') {
    hideOutputContainer();
    hideInputContainer();
    hideChildren();
    e.style.display = 'block';
    var gd = document.getElementById('gl-children');
    gd.className = "glyphicon glyphicon-chevron-down";
    document.getElementById('svg-container').style.zIndex = 0;
  }
  // Altrimenti lo nascondo
  else {
    document.getElementById('svg-container').style.zIndex = 1;
    e.style.display = 'none';
  }
}

function close(variabile) {
  var ib = document.getElementById('input-box');
  // ricopiare il valore dell'input-box nel view-model
  var id = variabile.id;
  // console.log("id = " + id);
  viewModelInputsFiltered.inputs()[id].value(ib.getElementsByTagName('input')[0].value);
  // nascondere input-box
  ib.style.display = 'none';
  // appiccicare input-box da qualche altra parte
  variabile.parentNode.appendChild(ib);
  // rivelare il div contenuto nella variabile
  var div = variabile.getElementsByTagName('div')[0];
  div.style.display = 'block';
  // ripristino undo e redo e chiama updateUI
  updateUI();
  // riattivo input-search dopo esser tornato sul campo da modificare
  var is = document.getElementById('input-search');
  is.disabled = false;
}

function open1(variabile) {
  // nascondere il div contenuto nella variabile
  var div = variabile.getElementsByTagName('div')[0];
  div.style.display = 'none';
  // rivelare input-box
  var ib = document.getElementById('input-box');
  ib.style.display = 'block';
  // appiccicare input-box dentro a variabile
  variabile.appendChild(ib);
  // impostare il valore dell'input-box
  ib.getElementsByTagName('input')[0].value = div.getElementsByTagName('span')[0].innerHTML;
  // impostare l'unità di misura
  ib.getElementsByTagName('span')[0].innerHTML = div.getElementsByTagName('span')[1].innerHTML;
  // impostare il range al 50%
  ib.getElementsByTagName('input')[1].value = 50;
  // disabilita undo e redo
  btnUndo = document.getElementById('btnUndo');
  btnUndo.disabled = true;
  btnRedo = document.getElementById('btnRedo');
  btnRedo.disabled = true;
  // disattivo input-search quando faccio una modifica
  var is = document.getElementById('input-search');
  is.disabled = true;
}

function toggleInputContainer(data, event) {
  var e = document.getElementById('input-box');
  var div = event.currentTarget.getElementsByTagName('div')[1];
  if (div && div.id == 'input-box') {
    close(event.currentTarget);
  } else if (!e.style.display || e.style.display == 'none') {
    open1(event.currentTarget);
  } else {
    close(e.parentNode);
    open1(event.currentTarget);
  }
}

function updateRange() {
  document.getElementById('range').value = 50;
  var div = this.parentNode.parentNode;
  div.getElementsByTagName('span')[2].innerHTML = this.value;
}

function updateNumber() {
  var ib = this.parentNode;
  var div = ib.parentNode;
  if (div.getElementsByTagName('span')[2].innerHTML === 0)
    ib.getElementsByTagName('input')[0].value = this.value / 50.0 - 1.0;
  else
    ib.getElementsByTagName('input')[0].value = div.getElementsByTagName('span')[2].innerHTML * this.value / 50.0;
}

// TODO: delete
// used for testing
function pause(ms) {
  ms += Date.now();
  while (Date.now() < ms) {
  }
}

// stop event propagation
function dummy(e) {
  if (!e)
    e = window.event;
  e.cancelBubble = true;
  if (e.stopPropagation)
    e.stopPropagation();
}

// index-specific code
function reset_local_storage() {
  localStorage.clear();
  updateServers(true);
  updateEnumerators(true);
  updateTypes(true);
  updateRecent(true);
  sendClick(document.getElementsByClassName("tab")[1]);
}// reset

function show_local_storage() {
  alert(localStorage.getItem('servers.json'));
  var recent_key = viewModel.servers.activeServer().uuid() + ".recent.json";
  alert(localStorage.getItem(recent_key));
  var types_used_key = "types_used.json";
  alert(localStorage.getItem(types_used_key));
}// show

function openMainPageFromLanding() {
  var landing = document.getElementById('landing-page');
  landing.style.display = 'none';
  var main = document.getElementById('main-page');
  main.style.display = 'block';
}

function openLandingPageFromMain() {
  var main = document.getElementById('main-page');
  main.style.display = 'none';
  updateRecent(true);
  // to make the last-used case appear in the recent list
  updateTypes(true);
  // to update the ordering
  var landing = document.getElementById('landing-page');
  landing.style.display = 'block';
}

function openConfigurePageFromLanding(d, e) {
  // update last_used field for the selected type so that it is pushed up in the new-list
  d.last_used(Math.round(Date.now() / 1000));
  // reset the fields in the configure form
  d.instance_tag('');
  d.instance_description('');
  // reveal the configure page
  var configure = document.getElementById('configure-page');
  configure.style.display = 'block';
  // hide the landing page
  var landing = document.getElementById('landing-page');
  landing.style.display = 'none';
  // pass the selected node to the configure form
  viewModelConfigure.configure(d);
}

function toggleTab() {
  var ts = document.getElementsByClassName("tab");
  var rns = document.getElementsByClassName("rns-container");
  var pos = this.id.indexOf("-");
  if (pos > 0) {
    var dest = this.id.substring(0, pos).concat('-container');
    for (var x = 0; x < ts.length; x++) {
      if (rns[x].id == dest) {
        rns[x].style.display = 'block';
      } else {
        rns[x].style.display = 'none';
      }
      if (ts[x] != this) {
        ts[x].parentNode.className = '';
      } else {
        ts[x].parentNode.className = 'active';
      }
    }
  }
}// toggleTab

function switchServer(data, event) {
  var current = viewModel.servers.activeServer();
  var uuid = event.currentTarget.id;
  console.log("uuid = " + uuid);
  openServer(uuid);
  updateServers(true);
  updateEnumerators(true);
  updateTypes(true);
  updateRecent(true);
}// switchServer

// configure-specific code

// funzioni del main.html
var undoManager = new UndoManager();
var changes = { };
function change_object(variable, start, end) {
  this.variable = variable;
  this.start = start;
  this.end = end;
}

var addChange = function(change_id, ch) {
  console.log("adding change @" + change_id);
  changes[change_id] = ch;
};
var removeChange = function(change_id) {
  console.log("removing change @" + change_id);
  delete changes[change_id];
};
var page_start = Date.now();
function change(variable, start, end) {
  // save in database
  updateValue(variable, end);
  var change_id = Date.now() - page_start;
  // initial storage
  var ch = new change_object(variable, start, end);
  addChange(change_id, ch);
  // make undo-able
  undoManager.add({
    undo : function() {
      var ch = changes[change_id];
      console.log("undoing change @" + change_id + " = { fulltag: " + variable.fulltag() + ", start: " + start + ", end: " + end + "}");
      // undo in view
      variable.value(ch.start);
      // undo in database
      updateValue(variable, ch.start);
      // update undo stack
      removeChange(change_id);
    },
    redo : function() {
      var ch = new change_object(variable, start, end);
      console.log("redoing change @" + change_id + " = { fulltag: " + variable.fulltag() + ", start: " + start + ", end: " + end + "}");
      // redo in view
      variable.value(ch.end);
      // redo in database
      updateValue(variable, ch.end);
      // update undo stack
      addChange(change_id, ch);
    },
    data : {
      "variable" : variable.fulltag(),
      "end" : end
    }
  });
}

// search variable in controlled array
function controlled_variable(controlled, variable) {
  var len = controlled.controlled.length, i;
  for ( i = 0; i < len; i++) {
    if (controlled.controlled[i].variable == variable)
      return controlled.controlled[i];
  }
  controlled.controlled.push({
    "variable" : variable,
    "end" : 0.0
  });
  return controlled.controlled[len];
}

// { "controlled": [{ "variable": "feed", "end": 3000.0 }, { "variable": "coolT", "end": 300.0 } ] }
function launch_calculation() {
  var controlled = {
    "controlled" : []
  };
  var undoCommands = undoManager.getCommands();
  var len = undoCommands.length, i;
  for ( i = 0; i < len; i++) {
    var variable_fulltag = undoCommands[i].data.variable;
    var variable = controlled_variable(controlled, variable_fulltag);
    variable.end = undoCommands[i].data.end;
  }
  alert('will connect to address http://localhost:8080/cases/0/calculate with with verb POST and this JSON in the response: ' + JSON.stringify(controlled));
  return false;
}// launch_calculation

function updateUI() {
  btnUndo = document.getElementById('btnUndo');
  btnUndo.disabled = !undoManager.hasUndo();
  btnRedo = document.getElementById('btnRedo');
  btnRedo.disabled = !undoManager.hasRedo();
  var btnCalculate = document.getElementById('calculate');
  btnCalculate.disabled = !undoManager.hasUndo();
}

undoManager.setCallback(updateUI);

var children;
var inputs;
var outputs;
var messages;
var tag;
var viewModelChildren;
var viewModelInputs;
var viewModelInputsFiltered;
var viewModelOutputs;
var viewModelToggleButtons;
var viewModelChildrenToggle;
var viewModelOpenMain;

var myChildrenModel = function(data) {
  ko.mapping.fromJS(data, {}, this);
  this.icon = ko.computed(function() {
    return type_property(this.type(), "icon", "images/unit.png");
  }, this);
  this.type_description = ko.computed(function() {
    return type_property(this.type(), "description", "");
  }, this);
};

ko.subscribable.fn.subscribeChanged = function(callback, callbackTarget, event) {
  var oldValue;
  this.subscribe(function(_oldValue) {
    oldValue = _oldValue;
  }, this, 'beforeChange');

  this.subscribe(function(newValue) {
    callback(newValue, oldValue, callbackTarget);
  });
  return this;
  //support chaining
};

var myInputModel = function(data) {
  ko.mapping.fromJS(data, {}, this);
  this.value.subscribeChanged(function(newValue, oldValue, target) {
    if (oldValue != newValue)
      change(target, oldValue, newValue);
  }, this);
};
// update the db
function updateValue(target, newValue) {
  var updatedField = ko.mapping.toJS(target);
  db.transaction(function(tx) {
    tx.executeSql('UPDATE Q set VALUE = ' + newValue + ' WHERE ID = ' + updatedField.dbid, [], function(tx, results) {
      console.log('db updated with new value for ' + updatedField.description);
    }, null);
  });
}

function ViewModelInputsFiltered() {
  this.query = ko.observable('');
  this.query_lowercase = ko.computed(function() {
    return this.query().toLowerCase();
  }, this);
  this.inputs = ko.observableArray([]);
}

function ViewModelOutputsFiltered() {
  this.query = ko.observable('');
  this.query_lowercase = ko.computed(function() {
    return this.query().toLowerCase();
  }, this);
  this.outputs = ko.observableArray([]);
}

var mapping = {
  'children' : {
    create : function(options) {
      return new myChildrenModel(options.data);
    }
  },
  'inputs' : {
    create : function(options) {
      return new myInputModel(options.data);
    }
  }
};

function change_node(targetid) {
  // update main list of children nodes, update toggle button
  var childArray = [];
  if (db) {
    db.readTransaction(function(tx) {
      tx.executeSql('SELECT TAG, DESCRIPTION, TYPE, ID FROM N WHERE PARENT =' + targetid + ' AND ID <>' + targetid, [], function(tx, results) {
        var len = results.rows.length, i;
        for ( i = 0; i < len; i++) {
          var item = results.rows.item(i);
          var obj = {
            "tag" : item.TAG,
            "description" : item.DESCRIPTION,
            "type" : item.TYPE,
            "id" : item.ID
          };
          childArray.push(obj);
        }
        if (len > 0) {
          ko.mapping.fromJS({
            "hasChildren" : true
          }, {}, viewModelChildrenToggle);
        } else {
          ko.mapping.fromJS({
            "hasChildren" : false
          }, {}, viewModelChildrenToggle);
        }
        children = {
          "children" : childArray
        };
        ko.mapping.fromJS(children, mapping, viewModelChildren);
      }, null);
    });

    // fill inputs and outputs
    db.readTransaction(function(tx) {
      tx.executeSql('SELECT FULLTAG,RANGE FROM N WHERE ID=' + targetid, [], function(tx, results) {
        var range = results.rows.item(0).RANGE;
        var fullTagLength = results.rows.item(0).FULLTAG.length;
        var query = 'SELECT N.FULLTAG||\'.\'||Q.TAG AS FULLTAG, Q.VALUE, Q.UNIT, Q.DESCRIPTION, Q.ID, Q.DESCRIPTION FROM N JOIN Q ON N.ID = Q.NID WHERE N.ID >=' + targetid + ' AND N.ID < ' + (targetid + range) + ' AND';
        fillInputs(tx, fullTagLength, query + ' Q.INPUT=' + 1);
        fillOutputs(tx, fullTagLength, query + ' Q.OUTPUT=' + 1);
      }, null);
    });

    // change open main button
    if (targetid > 0) {
      db.readTransaction(function(tx) {
        tx.executeSql('SELECT C.TAG as CurrTAG, P.TAG,P.ID FROM N AS C, N AS P WHERE C.ID= ' + targetid + ' AND C.PARENT=P.ID;', [], function(tx, results) {
          var item = results.rows.item(0);
          viewModelOpenMain.action = item.ID;
          viewModelOpenMain.homeText(item.TAG);
          updateToggleButton(item.CurrTAG);
        }, null);
      });
    } else {
      db.readTransaction(function(tx) {
        tx.executeSql('SELECT TAG FROM N WHERE ID =' + targetid, [], function(tx, results) {
          updateToggleButton(results.rows.item(0).TAG);
        }, null);
      });
      viewModelOpenMain.action = -1;
      viewModelOpenMain.homeText('Home');
    }
  }// if there is a database connection

  var inputsArray = [];
  function fillInputs(tx, fullTagLength, query) {
    tx.executeSql(query, [], function(tx, results) {
      var len = results.rows.length, i;
      for ( i = 0; i < len; i++) {
        var item = results.rows.item(i);
        var obj = {
          "fulltag" : item.FULLTAG.substring(fullTagLength + 1),
          "value" : item.VALUE,
          "units" : item.UNIT,
          "description" : item.DESCRIPTION,
          "dbid" : item.ID
        };
        inputsArray.push(obj);
      }
      inputs = {
        "inputs" : inputsArray
      };
      ko.mapping.fromJS(inputs, mapping, viewModelInputs);
    }, null);
  }

  var outputsArray = [];
  function fillOutputs(tx, fullTagLength, query) {
    tx.executeSql(query, [], function(tx, results) {
      var len = results.rows.length, i;
      for ( i = 0; i < len; i++) {
        var item = results.rows.item(i);
        var obj = {
          "fulltag" : item.FULLTAG.substring(fullTagLength + 1),
          "value" : item.VALUE,
          "units" : item.UNIT,
          "description" : item.DESCRIPTION
        };
        outputsArray.push(obj);
      }
      outputs = {
        "outputs" : outputsArray
      };
      ko.mapping.fromJS(outputs, mapping, viewModelOutputs);
    }, null);
  }

  // update the toggle button text
  function updateToggleButton(CurrTAG) {
    var tag = {
      "Tag" : CurrTAG
    };
    ko.mapping.fromJS(tag, {}, viewModelToggleButtons);
  }

}// change_node

function openChild() {
  console.log("opening child with id = " + this.id());
  change_node(this.id());
}

// funzioni configure.html
function addRecent(tag, last_used, description, type, handle) {
  var recent_key = viewModel.servers.activeServer().uuid() + ".recent.json";
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
  var new_problem = {
    "tag" : tag,
    "last_used" : last_used,
    "description" : description,
    "type" : type,
    "handle" : handle
  };
  console.log(JSON.stringify(new_problem));
  recent.recent.push(new_problem);
  recent_json = JSON.stringify(recent);
  localStorage.setItem(recent_key, recent_json);
}// addRecent

function openMainPageFromConfigure() {
  var name = viewModelConfigure.configure().name();
  var tag = viewModelConfigure.configure().instance_tag();
  var description = viewModelConfigure.configure().instance_description();
  var stringOptions = viewModelConfigure.configure().stringOptions();
  var integerOptions = viewModelConfigure.configure().integerOptions();
  var data = {
    "type" : name,
    "tag" : tag,
    "description" : description,
    "stringOptions" : { },
    "integerOptions" : { }
  };
  for (var i = 0, stringlen = stringOptions.length; i < stringlen; i++) {
    data.stringOptions[stringOptions[i].name()] = stringOptions[i].options()[stringOptions[i].selected()].name;
  }
  for (var j = 0, intlen = integerOptions.length; j < intlen; j++) {
    data.integerOptions[integerOptions[j].name()] = integerOptions[j].value();
  }

  // TODO: connect to server, create case there and get handle
  alert('will connect to address http://localhost:8080/cases with with verb POST and this JSON in the response: ' + JSON.stringify(data));

  var handle = "550e8400-e29b-41d4-a716-446655440000";
  var last_used = Math.round(Date.now() / 1000);

  addRecent(tag, last_used, description, name, handle);
  var configure = document.getElementById('configure-page');
  configure.style.display = 'none';
  var main = document.getElementById('main-page');
  main.style.display = 'block';
}// openMainPageFromConfigure

function overrideXlinks() {
  // rewire onclick events for xlink:href anchors in the svg-container
  var as = document.getElementById('svg-container').getElementsByTagName("a");
  for (var a = 0; a < as.length; a++) {
    if (as[a].hasAttribute('xlink:href')) {
      as[a].onclick = function() {
        var target_id = this.getAttribute("xlink:href").slice(-30, -5);
        alert('open_child(' + target_id + ')');
        return false;
      }
    }
  } // for each anchor
} // overrideXlinks
