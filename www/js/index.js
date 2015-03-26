// configuration for jshint
/* jshint browser: true, devel: true, strict: true */
/* global UndoManager */

function onDeviceReady() {
  "use strict";
  console.log("Device ready, platform = " + device.platform);
  init();
}

document.addEventListener ("deviceready", onDeviceReady, false);

var landing = { };
var configure = { };
var main = { };

function init() {
  "use strict";
  
  console.log("initting");
  StatusBar.overlaysWebView(false);
  StatusBar.backgroundColorByName("black");

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
  
  landing.init(function() { console.log("initted"); });
} // init

function clickAction() {
  "use strict";
  if (main.action() > -1) {
    main.change_node(main.action());
  } else {
    openLandingPageFromMain();
  }
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
var btnUndo;
var btnRedo;

function openService(service_uuid) {
  "use strict";
  var services_key = "services.json";
  // load value from local storage
  var services_json = localStorage.getItem(services_key);
  // parse JSON to javascript service_uuid
  var services = JSON.parse(services_json);
  var color;
  for (var i = 0, len = services.services.length; i < len; i++) {
    var service = services.services[i];
    if (service.service_uuid == service_uuid) {
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
  if (configure.initialized) {
    configure.viewModel.service_uuid(service_uuid);
    configure.viewModel.service_color(color);
  }
  if (main.initialized) {
    main.viewModel.service_color(color);
  }
} // openService

function removeService(service_uuid, name) {
  "use strict";
  var yes = window.confirm("Remove service " + name + " ?");
  if (yes === true) {
    var services_key = "services.json";
    // load value from local storage
    var services_json = localStorage.getItem(services_key);
    // parse JSON to javascript service_uuid
    var services = JSON.parse(services_json);
    for (var i = 0, len = services.services.length; i < len; i++) {
      var service = services.services[i];
      if (service.service_uuid == service_uuid) {
        console.log("removing service " + i);
        services.services.splice(i, 1);
        services_json = JSON.stringify(services);
        localStorage.setItem(services_key, services_json);
        landing.update();
        return;
      }
    }
    console.error("service " + service_uuid + " not found");
  }
} // removeService

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
  var yes = window.confirm("Reset app ? This will refresh the services list and clear all locally saved data !");
  if (yes === true) {
    lockUI("reset_local_storage");
    localStorage.clear();
    landing.update();
    sendClick(document.getElementsByClassName("tab")[1]);
  }
}// reset

function show_local_storage() {
  "use strict";
  console.log(localStorage.getItem('services.json'));
  var recent_key = landing.viewModel.services.activeService().service_uuid() + ".recent.json";
  console.log(localStorage.getItem(recent_key));
  var types_used_key = "types_used.json";
  console.log(localStorage.getItem(types_used_key));
}// show

function openMainPageFromLanding(d, e) {
  "use strict";

  console.log('openMainPageFromLanding');

  if (d.handle() != main.case_uuid) {
    lockUIfast("openMainPageFromLanding");
    main.init(landing.viewModel.services.activeService(), d.handle(), d.created_at(), d.modified_at(), landing.viewModel.prefix(), landing.type_property);
  }

  // hide landing page
  var landing_page = document.getElementById('landing-page');
  landing_page.style.display = 'none';
  // reveal main page
  var main_page = document.getElementById('main-page');
  main_page.style.display = 'block';
}

function openLandingPageFromConfigure() {
  "use strict";

  console.log('openLandingPageFromConfigure');

  // hide configure page
  var configure_page = document.getElementById('configure-page');
  configure_page.style.display = 'none';
  // reveal landing page
  var landing_page = document.getElementById('landing-page');
  landing_page.style.display = 'block';
}

function hideAll() {
  "use strict";
  hideChildren();
  hideInputContainer();
  hideOutputContainer();
  hideInfoContainer();
}

function openLandingPageFromMain() {
  "use strict";

  console.log('openLandingPageFromMain');
  hideAll();
  
  // TODO rather than reset all uncommitted changes, persist them to local storage
  undoManager.undoAll();

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
  
  console.log('openConfigurePageFromLanding(' + JSON.stringify(d) + ')');

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
   /* jshint validthis: true */
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
  var service_uuid = event.currentTarget.id;
  console.log("service_uuid = " + service_uuid);
  openService(service_uuid);
  landing.update();
} // switchService

// funzioni del main.html
var undoManager = new UndoManager();
var changes = { };
function change_object(variable, start, end) {
  "use strict";
   /* jshint validthis: true */
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
  main.updateValue(variable, end);
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
      main.updateValue(variable, ch.start);
      // update undo stack
      removeChange(change_id);
    },
    redo : function() {
      var ch = new change_object(variable, start, end);
      console.log("redoing change @" + change_id + " = { fulltag: " + variable.fulltag() + ", start: " + start + ", end: " + end + "}");
      // redo in view
      variable.value(ch.end);
      // redo in database
      main.updateValue(variable, ch.end);
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
    variable.end = parseFloat(undoCommands[i].data.end);
  }
  var dataTo = JSON.stringify(controlled);

  var url = landing.viewModel.services.activeService().url() + 'cases/' + main.case_uuid;
  console.log('will connect to URL ' + url + ' with with verb POST and this JSON in the request: ' + dataTo);

  postDataToAPI(url, dataTo, function(dataFrom){
    if (dataFrom === null) {
      console.error("No data received !");
      alert("Service error: calculation failed");
      unlockUI("failed postDataToAPI in launch_calculation");
    } else {
      var handle = dataFrom.case_uuid;
      var created_at = dataFrom.created_at;
      var modified_at = dataFrom.modified_at;
      // TODO check handle from service
      // if (handle !== main.case_uuid) {
      //   console.error("Inconsistent case_uuid received );
      //   alert("Service error: internal error");
      //   unlockUI("internal error in launch_calculation");
      // }
      var sqlUrl = url + '/sql';
      downloadFile(sqlUrl, main.case_uuid, 'persistency.sql', function() {
        console.log('================================================================================');
        console.log('done downloading database');
        main.init(landing.viewModel.services.activeService(), main.case_uuid, created_at, modified_at, landing.viewModel.prefix(), landing.type_property);
        undoManager.clear();
        lockUIfast("launch_calculation");
      }); // downloadCaseAssets
    } // received data
  }); // postDataToAPI

  lockUI("launch_calculation");
  return false;
} // launch_calculation

function unlockUI(from) {
  "use strict";
  console.log("unlock UI from: " + from);
  var lock_ui_slow = document.getElementById('lock-ui-slow');
  lock_ui_slow.style.display = 'none';
  var lock_ui_fast = document.getElementById('lock-ui-fast');
  lock_ui_fast.style.display = 'none';
}

function lockUI(from) {
  "use strict";
  console.log("lock UI from: " + from);
  var lock_ui_slow = document.getElementById('lock-ui-slow');
  lock_ui_slow.style.display = 'block';
}

function lockUIfast(from) {
  "use strict";
  console.log("lock UI fast from: " + from);
  var lock_ui_slow = document.getElementById('lock-ui-slow');
  lock_ui_slow.style.display = 'none';
  var lock_ui_fast = document.getElementById('lock-ui-fast');
  lock_ui_fast.style.display = 'block';
}

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

// number of downloaded files
var downloaded = 0;
// number of files to download
var toDownload = 4;

var counter = 0;

function openMainPageFromConfigure() {
  "use strict";
  var name = configure.configuration().name();
  var tag = configure.configuration().instance_tag();
  if (tag === "") {
    tag = "Case " + counter++;
  }
  var description = configure.configuration().instance_description();
  var stringOptions = configure.configuration().stringOptions();
  var integerOptions = configure.configuration().integerOptions();
  var dataTo = {
    "type" : name,
    "tag" : tag,
    "description" : description,
    "stringOptions" : { },
    "integerOptions" : { }
  };
  for (var i = 0, stringlen = stringOptions.length; i < stringlen; i++) {
    dataTo.stringOptions[stringOptions[i].name()] = stringOptions[i].selected();
  }
  for (var j = 0, intlen = integerOptions.length; j < intlen; j++) {
    dataTo.integerOptions[integerOptions[j].name()] = integerOptions[j].value();
  }

  var url = landing.viewModel.services.activeService().url() + 'cases';
  console.log('will connect to URL ' + url + ' with with verb POST and this JSON in the request: ' + JSON.stringify(dataTo));

  postDataToAPI(url, JSON.stringify(dataTo), function(dataFrom){
    if (dataFrom===null) {
      console.error("No data received !");
      alert("Service error: case creation failed");
      unlockUI("failed postDataToAPI in openMainPageFromConfigure");
    } else {
      var handle = dataFrom.case_uuid;
      var created_at = dataFrom.created_at;
      var modified_at = dataFrom.modified_at;
      configure.addRecent(tag, description, name, handle, created_at, modified_at);
      downloaded = 0; // reset counter !
      toDownload = 2; // database and assets
      downloadCaseAssets(url, handle, function() {
        downloaded += 1;
        if (downloaded >= toDownload) {
          console.log('================================================================================');
          console.log('done downloading case assets');

          main.init(landing.viewModel.services.activeService(), handle, created_at, modified_at, landing.viewModel.prefix(), landing.type_property);

          // hide configure page
          var configure_page = document.getElementById('configure-page');
          configure_page.style.display = 'none';
          // reveal main page
          var main_page = document.getElementById('main-page');
          main_page.style.display = 'block';

          lockUIfast("openMainPageFromConfigure");
        } // downloaded all files
      }); // downloadCaseAssets
    } // received data
  }); // postDataToAPI

  lockUI("openMainPageFromConfigure");
} // openMainPageFromConfigure

function onClickXref() {
  "use strict";
   /* jshint validthis: true */
  var target_id = this.getAttribute("xlink:href").slice(-30, -5);
  main.change_node(target_id);
  return false;
}

// onclick functions for main
function hide(thing, thing1, thing2) {
  "use strict";
  var t3 = document.getElementById(thing2);
  t3.scrollTop = 0;
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
  hide('output-container', 'output-open', 'output-list');
}

function showOutputContainer(event) {
  "use strict";
  hideChildren();
  hideInputContainer();
  hideInfoContainer();
  show('output-container', 'output-open');
  var gd = document.getElementById('gl-children');
  gd.className = "glyphicon glyphicon-chevron-down";
  event = event || window.event; // cross-browser event
  event.stopPropagation();
}

function hideInputContainer() {
  "use strict";
  hide('input-container', 'input-open', 'input-list');
  var ib = document.getElementById('input-box');
  if (ib) {
    if (ib.parentNode) {
      if (ib.parentNode.tagName.toUpperCase() == 'LI') {
        var v = ib.parentNode.id;
        close(document.getElementById(v));
      }
    }
  }
}

function showInputContainer(event) {
  "use strict";
  hideOutputContainer();
  hideChildren();
  hideInfoContainer();
  show('input-container', 'input-open');
  var gd = document.getElementById('gl-children');
  gd.className = "glyphicon glyphicon-chevron-down";
  event = event || window.event; // cross-browser event
  event.stopPropagation();
}

function hideChildren() {
  "use strict";
  var gd = document.getElementById('gl-children');
  var t = document.getElementById('children');
  t.scrollTop = 0;
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
  t.scrollTop = 0;
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
   /* jshint validthis: true */
  console.log("opening child with id = " + this.id());
  main.change_node(this.id());
}

function toggleInputContainer(data, event) {
  "use strict";
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

function close(variabile) {
  "use strict";
  var ib = document.getElementById('input-box');
  // ricopiare il valore dell'input-box nel view-model
  var id = variabile.id;
  // console.log("id = " + id);
  main.setVariable(id, ib.getElementsByTagName('input')[0].value);
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
  "use strict";
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

function socialShare() {
  "use strict";
  var url = landing.viewModel.services.activeService().url() + 'cases/' + main.case_uuid + '/html';
  console.log("sharing link: " + url);
  var message = "simevo process model - " + main.viewModel.Type() + " - " + main.viewModel.typeDescription() + "; " + main.viewModel.Tag() + " - " + main.viewModel.Description() + "; created: " + main.viewModel.createdAt() + " modified: " + main.viewModel.modifiedAt();
  // Message and link
  window.plugins.socialsharing.share(message, null, null, url);
  // Message, subject, image and link
  // var subject = "simevo process model - " + main.viewModel.Type() + " - " + main.viewModel.typeDescription();
  // window.plugins.socialsharing.share(message, subject, 'http://simevo.com/img/logo64.png', url);
}

var alpha_range = [
  /* Latin */
  ["\u0041", "\u005a"], ["\u0061", "\u007a"], ["\u00c0", "\u00d6"],
  ["\u00d8", "\u00f6"], ["\u00f8", "\u01f5"], ["\u01fa", "\u0217"],
  ["\u0250", "\u02a8"],

  /* Greek */
  ["\u0384", "\u0384"], ["\u0388", "\u038a"], ["\u038c", "\u038c"],
  ["\u038e", "\u03a1"], ["\u03a3", "\u03ce"], ["\u03d0", "\u03d6"],
  ["\u03da", "\u03da"], ["\u03dc", "\u03dc"], ["\u03de", "\u03de"],
  ["\u03e0", "\u03e0"], ["\u03e2", "\u03f3"],

  /* Cyrilic */
  ["\u0401", "\u040d"], ["\u040f", "\u044f"], ["\u0451", "\u045c"],
  ["\u045e", "\u0481"], ["\u0490", "\u04c4"], ["\u04c7", "\u04c8"],
  ["\u04cb", "\u04cc"], ["\u04d0", "\u04eb"], ["\u04ee", "\u04f5"],
  ["\u04f8", "\u04f9"],

  /* Armenian */
  ["\u0531", "\u0556"], ["\u0561", "\u0587"],

  /* Hebrew */
  ["\u05d0", "\u05ea"], ["\u05f0", "\u05f4"],

  /* Arabic */
  ["\u0621", "\u063a"], ["\u0640", "\u0652"], ["\u0670", "\u06b7"],
  ["\u06ba", "\u06be"], ["\u06c0", "\u06ce"], ["\u06e5", "\u06e7"],

  /* Devanagari */
  ["\u0905", "\u0939"], ["\u0958", "\u0962"],

  /* Bengali */
  ["\u0985", "\u098c"], ["\u098f", "\u0990"], ["\u0993", "\u09a8"],
  ["\u09aa", "\u09b0"], ["\u09b2", "\u09b2"], ["\u09b6", "\u09b9"],
  ["\u09dc", "\u09dd"], ["\u09df", "\u09e1"], ["\u09f0", "\u09f1"],

  /* Gurmukhi */
  ["\u0a05", "\u0a0a"], ["\u0a0f", "\u0a10"], ["\u0a13", "\u0a28"],
  ["\u0a2a", "\u0a30"], ["\u0a32", "\u0a33"], ["\u0a35", "\u0a36"],
  ["\u0a38", "\u0a39"], ["\u0a59", "\u0a5c"], ["\u0a5e", "\u0a5e"],

  /* Gujarati */
  ["\u0a85", "\u0a8b"], ["\u0a8d", "\u0a8d"], ["\u0a8f", "\u0a91"],
  ["\u0a93", "\u0aa8"], ["\u0aaa", "\u0ab0"], ["\u0ab2", "\u0ab3"],
  ["\u0ab5", "\u0ab9"], ["\u0ae0", "\u0ae0"],

  /* Oriya */
  ["\u0b05", "\u0b0c"], ["\u0b0f", "\u0b10"], ["\u0b13", "\u0b28"],
  ["\u0b2a", "\u0b30"], ["\u0b32", "\u0b33"], ["\u0b36", "\u0b39"],
  ["\u0b5c", "\u0b5d"], ["\u0b5f", "\u0b61"],

  /* Tamil */
  ["\u0b85", "\u0b8a"], ["\u0b8e", "\u0b90"], ["\u0b92", "\u0b95"],
  ["\u0b99", "\u0b9a"], ["\u0b9c", "\u0b9c"], ["\u0b9e", "\u0b9f"],
  ["\u0ba3", "\u0ba4"], ["\u0ba8", "\u0baa"], ["\u0bae", "\u0bb5"],
  ["\u0bb7", "\u0bb9"],

  /* Telugu */
  ["\u0c05", "\u0c0c"], ["\u0c0e", "\u0c10"], ["\u0c12", "\u0c28"],
  ["\u0c2a", "\u0c33"], ["\u0c35", "\u0c39"], ["\u0c60", "\u0c61"],

  /* Kannada */
  ["\u0c85", "\u0c8c"], ["\u0c8e", "\u0c90"], ["\u0c92", "\u0ca8"],
  ["\u0caa", "\u0cb3"], ["\u0cb5", "\u0cb9"], ["\u0ce0", "\u0ce1"],

  /* Malayalam */
  ["\u0d05", "\u0d0c"], ["\u0d0e", "\u0d10"], ["\u0d12", "\u0d28"],
  ["\u0d2a", "\u0d39"], ["\u0d60", "\u0d61"],

  /* Thai */
  ["\u0e01", "\u0e30"], ["\u0e32", "\u0e33"], ["\u0e40", "\u0e46"],
  ["\u0e4f", "\u0e5b"],

  /* Lao */
  ["\u0e81", "\u0e82"], ["\u0e84", "\u0e84"], ["\u0e87", "\u0e87"],
  ["\u0e88", "\u0e88"], ["\u0e8a", "\u0e8a"], ["\u0e8d", "\u0e8d"],
  ["\u0e94", "\u0e97"], ["\u0e99", "\u0e9f"], ["\u0ea1", "\u0ea3"],
  ["\u0ea5", "\u0ea5"], ["\u0ea7", "\u0ea7"], ["\u0eaa", "\u0eaa"],
  ["\u0eab", "\u0eab"], ["\u0ead", "\u0eb0"], ["\u0eb2", "\u0eb2"],
  ["\u0eb3", "\u0eb3"], ["\u0ebd", "\u0ebd"], ["\u0ec0", "\u0ec4"],
  ["\u0ec6", "\u0ec6"],

  /* Georgian */
  ["\u10a0", "\u10c5"], ["\u10d0", "\u10f6"],

  /* Hangul Jamo */
  ["\u1100", "\u1159"], ["\u1161", "\u11a2"], ["\u11a8", "\u11f9"],

  /* Latin (continued) */
  ["\u1e00", "\u1e9a"], ["\u1ea0", "\u1ef9"],

  /* Greek (continued) */
  ["\u1f00", "\u1f15"], ["\u1f18", "\u1f1d"], ["\u1f20", "\u1f45"],
  ["\u1f48", "\u1f4d"], ["\u1f50", "\u1f57"], ["\u1f59", "\u1f59"],
  ["\u1f5b", "\u1f5b"], ["\u1f5d", "\u1f5d"], ["\u1f5f", "\u1f7d"],
  ["\u1f80", "\u1fb4"], ["\u1fb6", "\u1fbc"], ["\u1fc2", "\u1fc4"],
  ["\u1fc6", "\u1fcc"], ["\u1fd0", "\u1fd3"], ["\u1fd6", "\u1fdb"],
  ["\u1fe0", "\u1fec"], ["\u1ff2", "\u1ff4"], ["\u1ff6", "\u1ffc"],

  /* Hiragana */
  ["\u3041", "\u3094"], ["\u309b", "\u309e"],

  /* Katakana */
  ["\u30a1", "\u30fe"],

  /* Bopomofo */
  ["\u3105", "\u312c"],

  /* CJK Unified Ideographs */
  ["\u4e00UL", "\u9fa5UL"],

  /* Hangul Syllables */
  ["\uAC00", "\uD7A3"],
];

// only works for codepoints within the BMP
function alphabetic(codepoint) {
  "use strict";
  for (var i=0; i<alpha_range.length; ++i) {
    if (codepoint < alpha_range[i][0].charCodeAt(0))
      return false;
    else if (codepoint <= alpha_range[i][1].charCodeAt(0))
      return true;
  }
  return false;
}

function alphanumeric(codepoint) {
  "use strict";
  if (alphabetic(codepoint))
    return true;
  else if (codepoint < "\u0030".charCodeAt(0))
    return false;
  else if (codepoint <= "\u0039".charCodeAt(0))
    return true;
  else
    return false;
}

// based on: http://jsfiddle.net/rniemeyer/p7kxw/
ko.extenders.valid = function(target, validNonAlpha) {
  "use strict";
  // add some sub-observables to our observable
  target.isValid = ko.observable();
  target.validationMessage = ko.observable();
  
  // define a function to do validation
  function validate(newValue) {
    if (!newValue) {
      target.isValid(true);
      target.validationMessage("");
    } else if (!alphabetic(newValue.charCodeAt(0))) {
      target.isValid(false);
      target.validationMessage("invalid first character, must be alphabetic");
    } else {
      var count = 0;
      for (var offset = 0; offset < newValue.length; ) {
        var codepoint = newValue.charCodeAt(offset);
        var char = String.fromCharCode(codepoint);
        console.log("looking at " + char);
        if (!alphanumeric(codepoint) && (validNonAlpha.indexOf(char) == -1)) {
          target.isValid(false);
          target.validationMessage("invalid " + (count + 1) + "-th character [" + String.fromCharCode(codepoint) + "]: must be alphanumeric, space or one of" + validNonAlpha);
          return;
        }
        offset += char.length;
        count += 1;
      }
      target.isValid(true);
      target.validationMessage("");
    }
  }
  
  // initial validation
  validate(target());

  // validate whenever the value changes
  target.subscribe(validate);
  
  //return the original observable
  return target;
};
