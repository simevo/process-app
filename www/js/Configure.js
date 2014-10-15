// configuration for jshint 
/* jshint browser: true, devel: true, strict: true */
/* global ko */

var Configure = (function() {
  "use strict";

  console.info("loading Configure");

  // private variables
  var first = true;
  // provide access to the function-scope this object in the private functions
  var THIS = this;

  // public variables
  // view model
  this.viewModel = { };

  // public functions
  this.init = function(activeService, d) {
    if (first) {
      first = false;

      console.info("initializing Configure");

      // initialize configure master view model and view
      this.viewModel = {
        configuration : ko.observable(null),
        service_uuid : ko.observable(activeService.uuid()),
        service_color : ko.observable(activeService.color())
      };
      
      // pass the selected node to the configure form
      this.viewModel.configuration(d);

      apply();
    } else {
      console.info("updating Configure");

      this.viewModel.configuration(d);
      this.viewModel.service_uuid(activeService.uuid()),
      this.viewModel.service_color(activeService.color())
    }
  }; // init
  
  this.configuration = function() {
    return this.viewModel.configuration();
  };

  // private stuff
  
  function apply() {
    console.info("applying Configure");

    var recent_search_clearer = document.getElementById('recent-search-clearer');
    recent_search_clearer.onclick = function() {
      clear_field('recent-search');
    };

    var tag_clearer = document.getElementById('tag-clearer');
    tag_clearer.onclick = function() {
      THIS.viewModel.configuration().instance_tag('');
    };
    var description_clearer = document.getElementById('description-clearer');
    description_clearer.onclick = function() {
      THIS.viewModel.configuration().instance_description('');
    };

    var configure_page = document.getElementById('configure-page');
    ko.applyBindings(THIS.viewModel, configure_page);
  } // apply
  
  this.addRecent = function(tag, last_used, description, type, handle) {
    var recent_key = this.viewModel.service_uuid() + ".recent.json";
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
  }; // addRecent

}); // Configure namespace
