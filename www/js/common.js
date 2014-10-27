// configuration for jshint
/* jshint browser: true, devel: true, strict: true */
/* global ko, UndoManager, FileTransfer, LocalFileSystem */

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

function failFS(e) {
  "use strict";
  console.log("FileSystem Error");
  console.dir(e);
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
  lockUI();
  localStorage.clear();
  landing.update();
  sendClick(document.getElementsByClassName("tab")[1]);
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

  hideChildren();
  hideInputContainer();
  hideOutputContainer();
  hideInfoContainer();

  main.init(landing.viewModel.services.activeService(), d.handle(), landing.viewModel.prefix(), landing.type_property);

  // hide landing page
  var landing_page = document.getElementById('landing-page');
  landing_page.style.display = 'none';
  // reveal main page
  var main_page = document.getElementById('main-page');
  main_page.style.display = 'block';
}

function openLandingPageFromConfigure() {
  "use strict";

  // hide configure page
  var configure_page = document.getElementById('configure-page');
  configure_page.style.display = 'none';
  // reveal landing page
  var landing_page = document.getElementById('landing-page');
  landing_page.style.display = 'block';
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
    if (dataFrom===null) {
      console.error("No data received !");
      alert("calculation failed - error 1 ");
      unlockUI();
    } else {
      // TODO get handle from service and check it
      // var handle = dataFrom.case_uuid;
      // if (handle !== main.case_uuid) {
      //   alert("calculation failed - error 2");
      //   unlockUI();
      // }
      // TODO assert handle === case_uuid
      var sqlUrl = url + '/sql';
      downloadFile(sqlUrl, main.case_uuid, 'persistency.sql', function() {
        console.log('================================================================================');
        console.log('done downloading database');
        main.init(landing.viewModel.services.activeService(), main.case_uuid, landing.viewModel.prefix(), landing.type_property);
        unlockUI();
      }); // downloadCaseAssets
    } // received data
  }); // postDataToAPI

  lockUI();
  return false;
} // launch_calculation

function unlockUI() {
  "use strict";
  console.log("unlock UI");
  var box2 = document.getElementById('box2');
  box2.style.display = 'none';
}

function lockUI() {
  "use strict";
  console.log("lock UI");
  var box2 = document.getElementById('box2');
  box2.style.display = 'block';
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
  console.log(ko.toJSON(configure.configuration(), null, 2));
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
    dataTo.stringOptions[stringOptions[i].name()] = stringOptions[i].options()[stringOptions[i].selected()].name;
  }
  for (var j = 0, intlen = integerOptions.length; j < intlen; j++) {
    dataTo.integerOptions[integerOptions[j].name()] = integerOptions[j].value();
  }

  var url = landing.viewModel.services.activeService().url() + 'cases';
  console.log('will connect to URL ' + url + ' with with verb POST and this JSON in the request: ' + JSON.stringify(dataTo));

  postDataToAPI(url, JSON.stringify(dataTo), function(dataFrom){
    if (dataFrom===null) {
      console.error("No data received !");
      alert("case creation failed");
      unlockUI();
    } else {
      var handle = dataFrom.case_uuid;
      var last_used = Math.round(Date.now() / 1000);
      configure.addRecent(tag, last_used, description, name, handle);
      downloaded = 0; // reset counter !
      toDownload = 2; // database and assets
      downloadCaseAssets(url, handle, function() {
        downloaded += 1;
        if (downloaded >= toDownload) {
          console.log('================================================================================');
          console.log('done downloading case assets');

          main.init(landing.viewModel.services.activeService(), handle, landing.viewModel.prefix(), landing.type_property);

          // hide configure page
          var configure_page = document.getElementById('configure-page');
          configure_page.style.display = 'none';
          // reveal main page
          var main_page = document.getElementById('main-page');
          main_page.style.display = 'block';

          unlockUI();
        } // downloaded all files
      }); // downloadCaseAssets
    } // received data
  }); // postDataToAPI

  lockUI();
} // openMainPageFromConfigure

function downloadCaseAssets(url, handle, callback) {
  "use strict";
  console.log("IN DOWNLOAD CASE ASSETS FUNC");

  var sqlUrl = url + '/' + handle + '/sql';
  downloadFile(sqlUrl, handle, 'persistency.sql', callback);

  var assetsUrl = url + '/' + handle + '/assets';
  getDataFromAPI(assetsUrl, function(data) {
    toDownload += data.assets.length - 1;
    data.assets.forEach(
      function(svg) {
        var filename = svg.substring(svg.lastIndexOf('/')+1);
        downloadFile(svg, handle, filename, callback);
      }
    );
  });
} // downloadCaseAssets

function downloadFile(url, dirName, fileName, callback1) {
  "use strict";
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
        if (callback1)
          callback1();
      },
      function(error) {
        console.log('download failure for file ' + path + ': ' + JSON.stringify(error));
      }
    );
  }
} // downloadFile

function fail(e) {
  "use strict";
  console.log("FileSystem Error");
  console.dir(e);
}

function getDataFromAPI(url, callback) {
  "use strict";
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
        console.error('problem in the service: ' + url);
        callback(null);
      // We reached our target service, but it returned an error
      }
    };
    request.onerror = function(e) {
      console.error('connection error for URL: '+url + ', error status: ' + e.target.status);
      callback(null);
    };
    request.open('GET', url, true);
    request.send();
  } catch(err){
    console.error('problem in the service: ' + err);
  }
} // getDataFromAPI

function getFileEntry(dirName, fileName, callback) {
  "use strict";
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
} // getFileEntry

function onClickXref() {
  "use strict";
  var target_id = this.getAttribute("xlink:href").slice(-30, -5);
  main.change_node(target_id);
  return false;
}

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

function postDataToAPI(url, dataTo, callback) {
  "use strict";
  console.log('IN POSTDATATOAPI FUNC');
  // put dataTo to a given url
  console.log('connecting to: '+url);
  try {
    var request = new XMLHttpRequest();
    var dataFrom;
    request.onload = function() {
      if (request.status >= 200 && request.status < 400){
        console.log("request success"+request.responseText);
        dataFrom = JSON.parse(request.responseText);
        callback(dataFrom);
      } else {
        console.error('problem in the service: ' + url);
        callback(null);
      // We reached our target service, but it returned an error
      }
    };
    request.onerror = function(e) {
      console.error('connection error for URL: '+url + ', error status: ' + e.target.status);
      callback(null);
    };
    request.open('POST', url);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(dataTo);
  } catch(err){
    console.error('problem in the service: ' + err);
  }
} // postDataToAPI

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
  var url = 'http://simevo.com/api/process/pasteurize/cases/' + main.case_uuid + '/html';
  console.log("sharing link: " + url);
  var message = "simevo process model - " + main.viewModel.Type() + " - " + main.viewModel.typeDescription() + "; " + main.viewModel.Tag() + " - " + main.viewModel.Description() + "; created: " + main.viewModel.createdAt() + " modified: " + main.viewModel.modifiedAt();
  // Message and link
  window.plugins.socialsharing.share(message, null, null, url);
  // Message, subject, image and link
  // var subject = "simevo process model - " + main.viewModel.Type() + " - " + main.viewModel.typeDescription();
  // window.plugins.socialsharing.share(message, subject, 'http://simevo.com/img/logo64.png', url);
}
