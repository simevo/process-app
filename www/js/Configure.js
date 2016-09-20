// configuration for jshint 
/* jshint browser: true, devel: true, strict: true */
/* global ko */

var Configure = (function() {
  "use strict";

  console.log("loading Configure");

  // private variables
  var first = true;
  // provide access to the function-scope this object in the private functions
  var THIS = this;

  // public variables
  // view model
  THIS.viewModel = { };
  this.initialized = false;
  
  // public functions
  this.init = function(activeService, d) {
    if (first) {
      first = false;

      console.log("initializing Configure");

      this.initialized = true;

      // initialize configure master view model and view
      THIS.viewModel = {
        configuration : ko.observable(null),
        service_uuid : ko.observable(activeService.service_uuid()),
        service_color : ko.observable(activeService.color())
      };
      
      // pass the selected node to the configure form
      THIS.viewModel.configuration(d);

      apply();
    } else {
      console.log("updating Configure");

      THIS.viewModel.configuration(d);
      THIS.viewModel.service_uuid(activeService.service_uuid());
      THIS.viewModel.service_color(activeService.color());
    }

    // activating field clearer
    var tag_clearer = document.getElementById('tag-clearer');
    tag_clearer.onclick = function() {
      console.log('clearing tag');
      THIS.viewModel.configuration().instance_tag('');
    };
    var description_clearer = document.getElementById('description-clearer');
    description_clearer.onclick = function() {
      console.log('clearing description');
      THIS.viewModel.configuration().instance_description('');
    };

    if (cordova.platformId == 'android') {
      // make sure the input fields are visible when the soft keyboard shows
      var inputs = document.querySelectorAll('input');
      var n = inputs.length;
      for (var i = 0; i < n; i++) {
        var input = inputs[i];
        input.addEventListener('click', showMe, true);
      }
    } // android only
  }; // init

  function showMe(e) {
    console.log('showMe');
    setTimeout(function() {
      e.target.scrollIntoView(true);
    }, 500);
  }

  this.configuration = function() {
    return THIS.viewModel.configuration();
  };

  // private stuff
  
  function apply() {
    console.log("applying Configure");
    var configure_page = document.getElementById('configure-page');
    ko.applyBindings(THIS.viewModel, configure_page);
  } // apply

  this.addRecent = function(tag, description, type, handle, created_at, modified_at) {
    var recent_key = THIS.viewModel.service_uuid() + ".recent.json";
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
      "last_used" : Math.round(Date.now() / 1000),
      "description" : description,
      "type" : type,
      "handle" : handle,
      "created_at": created_at,
      "modified_at": modified_at
    };
    console.log(JSON.stringify(new_problem));
    recent.recent.push(new_problem);
    recent_json = JSON.stringify(recent);
    localStorage.setItem(recent_key, recent_json);
  }; // addRecent

}); // Configure namespace
