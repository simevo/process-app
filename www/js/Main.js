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
  // provide access to the function-scope this object in the private functions
  var THIS = this;

  // public variables
  this.case_uuid = '';
  this.initialized = false;

  // public functions
  this.init = function(activeService, caseUuid, typeProperty) {
    if (first) {
      first = false;

      console.log("initializing Main with service_uuid = " + activeService.service_uuid() + " and case_uuid = " + caseUuid);

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
      var sqlFile = this.case_uuid + '/persistency.sql';

      getFileEntry(this.case_uuid, '/persistency.sql', function(fileEntry) {

        console.log('--------loading sql from: ' + fileEntry.toURL() + '-----------------');
        fileEntry.file(function(file) {
          var reader = new FileReader();

          console.log('-------- opening database: ' + THIS.case_uuid + ' -----------------');
          db = window.sqlitePlugin.openDatabase({name: THIS.case_uuid });

          reader.onloadend = function (e) {
            console.log('onreadend');
            var sql = this.result;

            db.transaction(function(tx) {
              console.log('start N transaction');
              tx.executeSql('DROP TABLE IF EXISTS N');
              tx.executeSql('CREATE TABLE IF NOT EXISTS N (' +
                            'ID                      integer PRIMARY KEY,' +
                            'TAG                     character (50),' +
                            'DESCRIPTION             character (255),' +
                            'TYPE                    character (50),' +
                            'FULLTAG                 character (255),' +
                            'UUID                    character (36),' +
                            'CREATED_AT              datetime,' +
                            'UPDATED_AT              datetime,' +
                            'LOCKED_BY               character (50),' +
                            'LOCKED_UNTIL            datetime,' +
                            'PARENT                  integer REFERENCES N (ID),' +
                            'ROOT                    integer REFERENCES N (ID),' +
                            'RANGE                   integer);');
              console.log('end N transaction');
              }, function(e) {
                console.log("DB ERROR: " + e.message);
            }); // transaction

            db.transaction(function(tx) {
              console.log('start I/Q/S transaction');
              tx.executeSql('DROP TABLE IF EXISTS I');
              tx.executeSql('DROP TABLE IF EXISTS Q');
              tx.executeSql('DROP TABLE IF EXISTS S');
              tx.executeSql('CREATE TABLE IF NOT EXISTS I (' +
                            'ID                      integer PRIMARY KEY,' +
                            'NID                     integer REFERENCES N (ID),' +
                            'TAG                     character (50),' +
                            'DESCRIPTION             character (255),' +
                            'VALUE                   integer);');
              tx.executeSql('CREATE TABLE IF NOT EXISTS Q (' +
                            'ID                      integer PRIMARY KEY,' +
                            'NID                     integer REFERENCES N (ID),' +
                            'TAG                     character (50),' +
                            'DESCRIPTION             character (255),' +
                            'VALUE                   double precision,' +
                            'UNIT                    character (50),' +
                            'INPUT                   boolean,' +
                            'OUTPUT                  boolean);');
              tx.executeSql('CREATE TABLE IF NOT EXISTS S (' +
                            'ID                      integer PRIMARY KEY,' +
                            'NID                     integer REFERENCES N (ID),' +
                            'TAG                     character (50),' +
                            'DESCRIPTION             character (255),' +
                            'VALUE                   character (255))');
              console.log('end I/Q/S transaction');
              }, function(e) {
                console.log("DB ERROR: " + e.message);
            }); // transaction

            db.transaction(function(tx) {
              console.log('start table fill transaction');
            
              var lines = sql.split('\n');
              for (var i = 0; i < lines.length; i++){
                if (lines[i].lastIndexOf("INSERT", 0) === 0) {
                  console.log("executing SQL statement: " + lines[i]);
                  tx.executeSql(lines[i]);
                }
              }
              console.log('end table fill transaction');
            }, function(e) {
              console.log("DB ERROR in table fill: " + e.message);
            }); // transaction

            THIS.initialized = true;
        
            viewModel = {
              hasChildren: ko.observable(false),
              Tag: ko.observable(''),
              homeText: ko.observable('Home'),
              action: ko.observable(-1),
              service_color : ko.observable(activeService.color())
            };
        
            // point to the node with database N.ID == 0 and load all data
            THIS.change_node(0);
        
            apply();
          }; // onloadend

          reader.readAsText(file);
        }); // fileEntry
      }); // gotFileEntry

    } else {
      console.log("updating Main");
    }
  }; // init

  function errorCB(err) {
    alert("Error processing SQL: "+err);
  }

  function successCB() {
    alert("success!");
  }

  this.setVariable = function(id, val) {
    viewModelInputsFiltered.inputs()[id].value(val);
  }; // setVariable

  // update the db
  this.updateValue = function(target, newValue) {
    var updatedField = ko.mapping.toJS(target);
    db.transaction(function(tx) {
      tx.executeSql('UPDATE Q set VALUE = ' + newValue + ' WHERE ID = ' + updatedField.dbid, [], function(tx, results) {
        console.log('db updated with new value for ' + updatedField.description);
      }, null);
    });
  }; // updateValue
  
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
      console.log('fillInputs');
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
          // console.log('parsed input ' + JSON.stringify(obj)); 
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
      console.log('fillOutputs');
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
          // console.log('parsed output ' + JSON.stringify(obj)); 
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

  function change_svg(id) {
    console.log('change_svg(' + id + ')');
    var svgName = "/" + id + ".svg";
    console.log('opening file: ' + main.case_uuid + svgName );
    getFileEntry(main.case_uuid, svgName, function(fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
          var svg = this.result;
          document.getElementById('image-container').innerHTML = svg;
          overrideXlinks();
        };
        reader.readAsText(file);
      }); // file
    }); // getFileEntry
  } // change_svg

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

}); // Main namespace
