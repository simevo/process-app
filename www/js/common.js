// configuration for jshint
/* jshint browser: true, devel: true, strict: true */
/* global ko, UndoManager, FileTransfer, LocalFileSystem */

function onDeviceReady() {
  "use strict";
  console.info("Device ready"  + device.platform);
}

var landing = { };
var configure = { };
var main = { };

function init() {
  "use strict";
  
  console.info("initting");
  
  // import Landing module
  Landing.call(landing);
  
  // import Configure module
  Configure.call(configure);

  // import Main module
  Main.call(main);

  var main_page = document.getElementById('main-page');
  main_page.style.display = 'none';

  var configure_page = document.getElementById('configure-page');
  configure_page.style.display = 'none';
  
  landing.init();
} // init

function clickAction() {
  "use strict";
  if (main.action() > -1) {
    main.change_node(main.action());
  } else {
    openLandingPageFromMain();
  }
}

function change_svg(id) {
  "use strict";
  var file_svg = "b14d48e0-1285-11e4-9191-0800200c9a66/" + id + ".svg";
  xmlhttp.open("GET", file_svg, false);
  xmlhttp.send();
  var svg = xmlhttp.responseText;
  document.getElementById('image-container').innerHTML = svg;
  overrideXlinks();
}

function clear_field(control_id) {
  "use strict";
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
  "use strict";
  var clickEvent = document.createEvent("MouseEvent");
  clickEvent.initEvent('click', true, true);
  control.dispatchEvent(clickEvent);
}

// global variables
var xmlhttp = new XMLHttpRequest();
var btnUndo;
var btnRedo;

function openService(uuid) {
  "use strict";
  var services_key = "services.json";
  // load value from local storage
  var services_json = localStorage.getItem(services_key);
  // parse JSON to javascript uuid
  var services = JSON.parse(services_json);
  var color;
  for (var i = 0, len = services.services.length; i < len; i++) {
    var service = services.services[i];
    if (service.uuid == uuid) {
      color = service.color;
      service.active = true;
      service.last_used = Math.round(Date.now() / 1000);
    } else {
      service.active = false;
    }
  }
  services_json = JSON.stringify(services);
  localStorage.setItem(services_key, services_json);
  
  // trick
  configure.viewModel.service_uuid(uuid);
  configure.viewModel.service_color(color);
  main.viewModel.service_color(color);
} // openService

// TODO: delete
// used for testing
function pause(ms) {
  "use strict";
  ms += Date.now();
  while (Date.now() < ms) {
  }
}

// index-specific code
function reset_local_storage() {
  "use strict";
  localStorage.clear();
  landing.update();
  sendClick(document.getElementsByClassName("tab")[1]);
}// reset

function show_local_storage() {
  "use strict";
  console.log(localStorage.getItem('services.json'));
  var recent_key = landing.viewModel.services.activeService().uuid() + ".recent.json";
  console.log(localStorage.getItem(recent_key));
  var types_used_key = "types_used.json";
  console.log(localStorage.getItem(types_used_key));
}// show

function openMainPageFromLanding() {
  "use strict";

  hideChildren();
  hideInputContainer();
  hideOutputContainer();
  hideInfoContainer();

  main.init(landing.viewModel.services.activeService(), landing.type_property);

  // hide landing page
  var landing_page = document.getElementById('landing-page');
  landing_page.style.display = 'none';
  // reveal main page
  var main_page = document.getElementById('main-page');
  main_page.style.display = 'block';
}

function openLandingPageFromMain() {
  "use strict";

  // to make the last-used case appear in the recent list and to update the ordering of the types
  landing.updateRT();

  // hide main page
  var main_page = document.getElementById('main-page');
  main_page.style.display = 'none';
  // reveal landing page
  var landing_page = document.getElementById('landing-page');
  landing_page.style.display = 'block';
}

function openConfigurePageFromLanding(d, e) {
  "use strict";
  
  // update last_used field for the selected type so that it is pushed up in the new-list
  d.last_used(Math.round(Date.now() / 1000));
  // reset the fields in the configure form
  d.instance_tag('');
  d.instance_description('');

  // initialize configure with the current service
  configure.init(landing.viewModel.services.activeService(), d);
  
  // reveal the configure page
  var configure_page = document.getElementById('configure-page');
  configure_page.style.display = 'block';
  // hide the landing page
  var landing_page = document.getElementById('landing-page');
  landing_page.style.display = 'none';
}

function toggleTab() {
  "use strict";
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
} // toggleTab

function switchService(data, event) {
  "use strict";
  var current = landing.viewModel.services.activeService();
  var uuid = event.currentTarget.id;
  console.log("uuid = " + uuid);
  openService(uuid);
  landing.update();
} // switchService

// funzioni del main.html
var undoManager = new UndoManager();
var changes = { };
function change_object(variable, start, end) {
  "use strict";
  this.variable = variable;
  this.start = start;
  this.end = end;
}

var addChange = function(change_id, ch) {
  "use strict";
  console.log("adding change @" + change_id);
  changes[change_id] = ch;
};

var removeChange = function(change_id) {
  "use strict";
  console.log("removing change @" + change_id);
  delete changes[change_id];
};

var page_start = Date.now();

function change(variable, start, end) {
  "use strict";
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
  "use strict";
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
  "use strict";
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
  console.log('will connect to address http://localhost:8080/cases/0/calculate with with verb POST and this JSON in the response: ' + JSON.stringify(controlled));
  return false;
}// launch_calculation

function updateUI() {
  "use strict";
  btnUndo = document.getElementById('btnUndo');
  btnUndo.disabled = !undoManager.hasUndo();
  btnRedo = document.getElementById('btnRedo');
  btnRedo.disabled = !undoManager.hasRedo();
  var btnCalculate = document.getElementById('calculate');
  btnCalculate.disabled = !undoManager.hasUndo();
}

undoManager.setCallback(updateUI);

function openMainPageFromConfigure() {
  "use strict";
  console.log(ko.toJSON(configure.configuration(), null, 2));
  var name = configure.configuration().name();
  var tag = configure.configuration().instance_tag();
  var description = configure.configuration().instance_description();
  var stringOptions = configure.configuration().stringOptions();
  var integerOptions = configure.configuration().integerOptions();
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

  // TODO: connect to service, create case there and get handle
  console.log('will connect to address http://localhost:8080/cases with with verb POST and this JSON in the response: ' + JSON.stringify(data));

  var handle = "550e8400-e29b-41d4-a716-446655440000";
  var last_used = Math.round(Date.now() / 1000);

  configure.addRecent(tag, last_used, description, name, handle);

  main.init(landing.viewModel.services.activeService());

  // hide configure page
  var configure_page = document.getElementById('configure-page');
  configure_page.style.display = 'none';
  // reveal main page
  var main_page = document.getElementById('main-page');
  main_page.style.display = 'block';
} // openMainPageFromConfigure

function onClickXref() {
  "use strict";
  var target_id = this.getAttribute("xlink:href").slice(-30, -5);
  main.change_node(target_id);
  return false;
}

function overrideXlinks() {
  "use strict";
  // rewire onclick events for xlink:href anchors in the image-container
  var as = document.getElementById('image-container').getElementsByTagName("a");
  for (var a = 0; a < as.length; a++) {
    if (as[a].hasAttribute('xlink:href')) {
      as[a].onclick = onClickXref;
    }
  } // for each anchor
} // overrideXlinks

// onclick functions for main
function hide(thing, thing1) {
  "use strict";
  var t = document.getElementById(thing);
  t.style.display = 'none';
  var t1 = document.getElementById(thing1);
  t1.style.display = 'block';
  var t2 = document.getElementById('center');
  t2.className = 'col-xs-12 col-sm-12 no-padding';
  document.getElementById('image-container').style.zIndex = 1;
}

function show(thing, thing1) {
  "use strict";
  var t = document.getElementById(thing);
  t.style.display = 'block';
  var t1 = document.getElementById(thing1);
  t1.style.display = 'none';
  var t2 = document.getElementById('center');
  t2.className = 'col-xs-2 col-sm-7 no-padding';
  document.getElementById('image-container').style.zIndex = 0;
}

function hideOutputContainer() {
  "use strict";
  hide('output-container', 'output-open');
}

function showOutputContainer() {
  "use strict";
  hideChildren();
  hideInputContainer();
  hideInfoContainer();

  show('output-container', 'output-open');
  var gd = document.getElementById('gl-children');
  gd.className = "glyphicon glyphicon-chevron-down";
}

function hideInputContainer() {
  "use strict";
  hide('input-container', 'input-open');
  var ib = document.getElementById('input-box');
  if (ib.parentNode.tagName.toUpperCase() == 'LI') {
    var v = ib.parentNode.id;
    close(document.getElementById(v));
  }
}

function showInputContainer() {
  "use strict";
  hideOutputContainer();
  hideChildren();
  hideInfoContainer();
  show('input-container', 'input-open');
  var gd = document.getElementById('gl-children');
  gd.className = "glyphicon glyphicon-chevron-down";
}

function hideChildren() {
  "use strict";
  var gd = document.getElementById('gl-children');
  var t = document.getElementById('children');
  t.style.display = 'none';
  document.getElementById('image-container').style.zIndex = 1;
  gd.className = "glyphicon glyphicon-chevron-down";

}

function toggleChildren() {
  "use strict";
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
    document.getElementById('image-container').style.zIndex = 0;
  } else {
    // Altrimenti lo nascondo
    hideChildren();
  }
}

function hideInfoContainer() {
  "use strict";
  var t = document.getElementById('info-container');
  t.style.display = 'none';
  document.getElementById('image-container').style.zIndex = 1;
}

function toggleInfoContainer() {
  "use strict";
  // Recupero l'elemento dall'Id
  var e = document.getElementById('info-container');

  // Se e e' nascosto lo visualizzo
  if (!e.style.display || e.style.display == 'none') {
    hideOutputContainer();
    hideInputContainer();
    hideChildren();
    e.style.display = 'block';
    document.getElementById('image-container').style.zIndex = 0;
  }
  // Altrimenti lo nascondo
  else {
    document.getElementById('image-container').style.zIndex = 1;
    e.style.display = 'none';
  }
}

function openChild() {
  "use strict";
  console.log("opening child with id = " + this.id());
  main.change_node(this.id());
}

