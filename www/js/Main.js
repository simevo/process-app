// configuration for jshint 
/* jshint browser: true, devel: true, strict: true */
/* global ko */

var Main = (function() {
  "use strict";
  
  console.log("loading Main");

  // private variables
  var first = true;
  var db;
  var children;
  var inputs;
  var outputs;
  var messages;
  var tag;
  var viewModelChildren = { };
  var viewModelInputs = { };
  var viewModelInputsFiltered = { };
  var viewModelOutputs = { };
  var viewModelOutputsFiltered = { };
  var viewModelMessages = { };
  var viewModel = { };
  var type_property;
  
  // public variables
  this.case_uuid = '';

  // public functions
  this.init = function(activeService, caseUuid, typeProperty) {
    if (first) {
      first = false;

      console.log("initializing Main");

      type_property = typeProperty;
      this.case_uuid = caseUuid;

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

      // initialize messages view-model and view
      messages = {
        "messages": [
          {
            "fulltag": "FC",
            "message_text": "fuel inlet too low",
            "type": "warning"
          },
          {
            "fulltag": "FC:stacks",
            "message_text": "maximum temperature too high",
            "type": "error"
          },
          {
            "fulltag": "FC:BLOWER",
            "message_text": "surge limit approaching",
            "type": "warning"
          },
          {
            "fulltag": "C101:S01:Tphase",
            "message_text": "zero total flow",
            "type": "warning"
          }
        ]
      };
      viewModelMessages = ko.mapping.fromJS(messages, mapping);

      // initialize input view-model and view with empty data; these will be actually filled by change_node
      inputs = {
        "inputs" : []
      };
      viewModelInputs = ko.mapping.fromJS(inputs, mapping);
      viewModelInputsFiltered = new ViewModelInputsFiltered();
      viewModelInputsFiltered.inputs = viewModelInputs.inputs.filter(function(i) {
        var q = viewModelInputsFiltered.query_lowercase();
        return ((i.fulltag().toLowerCase().search(q) >= 0) || (i.description().toLowerCase().search(q) >= 0));
      });

      // initialize output view-model and view with empty data; these will be actually filled by change_node
      outputs = {
        "outputs" : []
      };
      viewModelOutputs = ko.mapping.fromJS(outputs, mapping);
      viewModelOutputsFiltered = new ViewModelOutputsFiltered();
      viewModelOutputsFiltered.outputs = viewModelOutputs.outputs.filter(function(i) {
        var q = viewModelOutputsFiltered.query_lowercase();
        return ((i.fulltag().toLowerCase().search(q) >= 0) || (i.description().toLowerCase().search(q) >= 0));
      });
      // initialize children view-model and view with empty data; these will be actually filled by change_node
      children = {
        "children" : []
      };
      viewModelChildren = ko.mapping.fromJS(children, mapping);

      // sqlite database connection
      if (window.openDatabase) {
        db = openDatabase(this.case_uuid + '/persistency.db', '1.0', 'persistency database', 2 * 1024 * 1024);
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

      viewModel = {
        hasChildren: ko.observable(false),
        Tag: ko.observable(''),
        homeText: ko.observable('Home'),
        action: ko.observable(-1),
        service_color : ko.observable(activeService.color())
      };

      apply();
    } else {
      console.log("updating Main");
    }
    // point to the node with database N.ID == 0 and load all data
    this.change_node(0);
  }; // init

  // private functions
  function apply() {
    console.log("applying Main");

    var messages_list = document.getElementById('messages-list');
    ko.applyBindings(viewModelMessages, messages_list);

    var input_container = document.getElementById('input-container');
    ko.applyBindings(viewModelInputsFiltered, input_container);

    var output_container = document.getElementById('output-container');
    ko.applyBindings(viewModelOutputsFiltered, output_container);

    var children_list = document.getElementById('children-list');
    ko.applyBindings(viewModelChildren, children_list);

    // apply bindings for info-toggle button
    var navigation = document.getElementById('navigation');
    ko.applyBindings(viewModel, navigation);
    var toolbar = document.getElementById('toolbar');
    ko.applyBindings(viewModel, toolbar);
    
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
  } // apply
  
  var MyChildrenModel = function(data) {
    ko.mapping.fromJS(data, {}, this);
    this.icon = ko.computed(function() {
      return type_property(this.type(), "icon", "images/unit.svg");
    }, this);
    this.type_description = ko.computed(function() {
      return type_property(this.type(), "description", "");
    }, this);
  };
  
  var mapping = {
    'children' : {
      create : function(options) {
        return new MyChildrenModel(options.data);
      }
    },
    'inputs' : {
      create : function(options) {
        return new MyInputModel(options.data);
      }
    }
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

  var MyInputModel = function(data) {
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

  this.action = function() {
    return viewModel.action();
  }; // action
  
  this.change_node = function(targetid) {
    console.log("switching to node " + targetid);
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
            viewModel.hasChildren(true);
          } else {
            viewModel.hasChildren(false);
            //TODO rimuovere patch
            hideChildren();
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
            viewModel.action(item.ID);
            viewModel.homeText(item.TAG);
            viewModel.Tag(item.CurrTAG);
          }, null);
        });
      } else {
        db.readTransaction(function(tx) {
          tx.executeSql('SELECT TAG FROM N WHERE ID =' + targetid, [], function(tx, results) {
            viewModel.Tag(results.rows.item(0).TAG);
          }, null);
        });
        viewModel.action(-1);
        viewModel.homeText('Home');
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

    change_svg(targetid);
  }; // change_node

  // stop event propagation
  function dummy(e) {
    if (!e)
      e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation)
      e.stopPropagation();
  }

  function updateRange() {
    document.getElementById('range').value = 50;
    var div = this.parentNode.parentNode;
    div.getElementsByTagName('span')[2].innerHTML = this.value;
  }

  function updateNumber() {
    var ib = this.parentNode;
    var div = ib.parentNode;
    if (div.getElementsByTagName('span')[2].innerHTML === 0.0)
      ib.getElementsByTagName('input')[0].value = this.value / 50.0 - 1.0;
    else
      ib.getElementsByTagName('input')[0].value = div.getElementsByTagName('span')[2].innerHTML * this.value / 50.0;
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

}); // Main namespace
