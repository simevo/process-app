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
  var tag;
  var viewModelChildren = { };
  var viewModelInputs = { };
  var viewModelInputsFiltered = { };
  var viewModelOutputs = { };
  var viewModelOutputsFiltered = { };
  var type_property;
  var service_uuid = '';
  var prefix = '';
  // provide access to the function-scope this object in the private functions
  var THIS = this;

  // public variables
  this.case_uuid = "";
  this.initialized = false;
  this.viewModel = { };

  // public functions
  this.init = function(activeService, case_uuid_, created_at, modified_at, prefix_, typeProperty) {
    type_property = typeProperty;
    this.prefix = prefix_;

    var createdAt = format_date(created_at);
    var modifiedAt = format_date(modified_at);
    this.case_uuid = case_uuid_;
    this.service_uuid = activeService.service_uuid();
    if (first) {
      console.log("initializing Main with service_uuid = " + this.service_uuid + " and case_uuid = " + case_uuid_);

      first = false;

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
      db = openSql(case_uuid_, function() {
        THIS.initialized = true;

        THIS.viewModel = {
          hasChildren: ko.observable(false),
          Tag: ko.observable(''),
          Tag0: ko.observable(''),
          fullTag: ko.observable(''),
          homeText: ko.observable('Home'),
          action: ko.observable(-1),
          service_color : ko.observable(activeService.color()),
          Description: ko.observable(''),
          Description0: ko.observable(''),
          Type: ko.observable(''),
          Type0: ko.observable(''),
          typeDescription: ko.observable(''),
          typeDescription0: ko.observable(''),
          currentId: ko.observable(''),
          createdAt: ko.observable(createdAt.toString()),
          modifiedAt: ko.observable(modifiedAt.toString()),
          errors: ko.observable(0),
          warnings: ko.observable(0),
          errors0: ko.observable(0), // errors of node 0
          warnings0: ko.observable(0), // warnings of node 0
          warning_messages: ko.observable(''),
          error_messages: ko.observable('')
        };

        // point to the node with database N.ID == 0 and load all data
        THIS.change_node(0);
        apply();
      });
    } else {
      console.log("updating Main with service_uuid = " + this.service_uuid + " and case_uuid = " + case_uuid_);

      // sqlite database connection
      db = openSql(case_uuid_, function() {
        // point to the node with database N.ID == 0 and load all data
        THIS.change_node(0);
        THIS.viewModel.createdAt(createdAt.toString());
        THIS.viewModel.modifiedAt(modifiedAt.toString());
        updateRecent(case_uuid_, created_at, modified_at);
      });
    } // initialized ?
  }; // init

  function updateRecent(handle, created_at, modified_at) {
    console.log("updateRecent: " + handle);
    var recent_key = THIS.service_uuid + ".recent.json";
    if (localStorage.getItem(recent_key) !== null) {
      // load value from local storage
      var recent_json = localStorage.getItem(recent_key);
      // parse JSON to javascript object
      var recent = JSON.parse(recent_json);
      var found = false;
      for (var i = 0, len = recent.recent.length; i < len; i++) {
        var problem = recent.recent[i];
        if (problem.handle == handle) {
          problem.last_used = Math.round(Date.now() / 1000);
          problem.created_at = created_at;
          problem.modified_at = modified_at;
          console.log(JSON.stringify(problem));
          found = true;
        } // found it
      } // for each recent
      if (found) {
        recent_json = JSON.stringify(recent);
        localStorage.setItem(recent_key, recent_json);
      } // found it
    } // key is in local storage
  } // updateRecent

  function openSqlSuccess(db, file, callback) {
    console.log('database successfully opened');
    var reader = new FileReader();
    reader.onloadend = function (e) {
      // console.log('onreadend');
      var sql = this.result;

      db.transaction(function(tx) {
        // console.log('start N transaction');
        tx.executeSql('DROP TABLE IF EXISTS N', [], function(tx, res) {
            // console.log('executeSql DROP N done: ' + JSON.stringify(res));
          });
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
                      'RANGE                   integer);', [], function(tx, res) {
            // console.log('executeSql CREATE N done: ' + JSON.stringify(res));
        });
      }, function(error) {
        console.error("DB ERROR in N transaction: " + error);
      }, function() {
        // console.log('end N transaction');
      }); // N transaction

      db.transaction(function(tx) {
        // console.log('start I/Q/S transaction');
        tx.executeSql('DROP TABLE IF EXISTS I', [], function(tx, res) {
            // console.log('executeSql DROP I done: ' + JSON.stringify(res));
          });
        tx.executeSql('DROP TABLE IF EXISTS Q', [], function(tx, res) {
            // console.log('executeSql DROP Q done: ' + JSON.stringify(res));
          });
        tx.executeSql('DROP TABLE IF EXISTS S', [], function(tx, res) {
            console.log('executeSql DROP S done: ' + JSON.stringify(res));
          });
        tx.executeSql('CREATE TABLE IF NOT EXISTS I (' +
                      'ID                      integer PRIMARY KEY,' +
                      'NID                     integer REFERENCES N (ID),' +
                      'TAG                     character (50),' +
                      'DESCRIPTION             character (255),' +
                      'VALUE                   integer);', [], function(tx, res) {
            // console.log('executeSql CREATE I done: ' + JSON.stringify(res));
          });
        tx.executeSql('CREATE TABLE IF NOT EXISTS Q (' +
                      'ID                      integer PRIMARY KEY,' +
                      'NID                     integer REFERENCES N (ID),' +
                      'TAG                     character (50),' +
                      'DESCRIPTION             character (255),' +
                      'VALUE                   double precision,' +
                      'UNIT                    character (50),' +
                      'INPUT                   boolean,' +
                      'OUTPUT                  boolean);', [], function(tx, res) {
            // console.log('executeSql CREATE Q done: ' + JSON.stringify(res));
          });
        tx.executeSql('CREATE TABLE IF NOT EXISTS S (' +
                      'ID                      integer PRIMARY KEY,' +
                      'NID                     integer REFERENCES N (ID),' +
                      'TAG                     character (50),' +
                      'DESCRIPTION             character (255),' +
                      'VALUE                   character (255))', [], function(tx, res) {
            // console.log('executeSql CREATE S done: ' + JSON.stringify(res));
        });
      }, function(error) {
        console.error("DB ERROR in I/Q/S transaction: " + error);
      }, function() {
        // console.log('end I/Q/S transaction');
      }); // I/Q/S transaction

      db.transaction(function(tx) {
        // console.log('start IV/SV transaction');
        tx.executeSql('DROP TABLE IF EXISTS IV', [], function(tx, res) {
            // console.log('executeSql DROP IV done: ' + JSON.stringify(res));
          });
        tx.executeSql('DROP TABLE IF EXISTS IVV', [], function(tx, res) {
            // console.log('executeSql DROP IVV done: ' + JSON.stringify(res));
          });
        tx.executeSql('DROP TABLE IF EXISTS SV', [], function(tx, res) {
            // console.log('executeSql DROP SV done: ' + JSON.stringify(res));
          });
        tx.executeSql('DROP TABLE IF EXISTS SVV', [], function(tx, res) {
            // console.log('executeSql DROP SVV done: ' + JSON.stringify(res));
          });
        tx.executeSql('CREATE TABLE IF NOT EXISTS IV (' +
                      'ID                      integer PRIMARY KEY,' +
                      'NID                     integer REFERENCES N (ID),' +
                      'TAG                     character (50),' +
                      'DESCRIPTION             character (255));', [], function(tx, res) {
            // console.log('executeSql CREATE IV done: ' + JSON.stringify(res));
          });
        tx.executeSql('CREATE TABLE IF NOT EXISTS IVV (' +
                      'ID                      integer PRIMARY KEY,' +
                      'VID                     integer REFERENCES IV (ID),' +
                      'VALUE                   integer);', [], function(tx, res) {
            // console.log('executeSql CREATE IV done: ' + JSON.stringify(res));
          });
        tx.executeSql('CREATE TABLE IF NOT EXISTS SV (' +
                      'ID                      integer PRIMARY KEY,' +
                      'NID                     integer REFERENCES N (ID),' +
                      'TAG                     character (50),' +
                      'DESCRIPTION             character (255));', [], function(tx, res) {
            // console.log('executeSql CREATE SV done: ' + JSON.stringify(res));
          });
        tx.executeSql('CREATE TABLE IF NOT EXISTS SVV (' +
                      'ID                      integer PRIMARY KEY,' +
                      'VID                     integer REFERENCES SV (ID),' +
                      'VALUE                   character (255));', [], function(tx, res) {
            // console.log('executeSql CREATE SVV done: ' + JSON.stringify(res));
          });
      }, function(error) {
        console.error("DB ERROR in IV/SV transaction: " + error);
      }, function() {
        // console.log('end IV/SV transaction');
      }); // IV/SV transaction

      db.transaction(function(tx) {
        console.log('start table fill transaction');

        var lines = sql.split('\n');
        for (var i = 0; i < lines.length; i++){
          if (lines[i].lastIndexOf("INSERT", 0) === 0) {
            // console.log("executing SQL statement: " + lines[i]);
            tx.executeSql(lines[i]);
          }
        }
      }, function(error) {
        console.error("DB ERROR in fill transaction: " + error);
      }, function() {
        console.log('end table fill transaction');
      }); // transaction

      console.log('-------- call back ! -----------------');
      callback();
    }; // onloadend
    reader.readAsText(file);
  } // openSqlSuccess

  function openSqlError(error) {
    console.error("DB ERROR while opening database: " + error);
  }

  function openSql(caseUuid, callback) {
    var sqlFile = caseUuid + '/persistency.sql';
    console.log('--------loading sql from: ' + sqlFile + '-----------------');
    getFileEntry(caseUuid, '/persistency.sql', function(fileEntry) {

      fileEntry.file(function (file) {
        var sqliteFile = THIS.case_uuid + '.db';
        console.log('cordova.platformId = ' + cordova.platformId);
        console.log('-------- opening database: ' + sqliteFile + ' -----------------');
        if (cordova.platformId == 'browser') {
          db = window.openDatabase(sqliteFile, '', '', 5*1024*1024);
          openSqlSuccess(db, file, callback);
        } else {
          db = window.sqlitePlugin.openDatabase({name: sqliteFile, location: 1},
                                   function(db) { openSqlSuccess(db, file, callback); },
                                   openSqlError);
        }
      }); // fileEntry
    }); // gotFileEntry

  } // openSql

  // update the db
  this.updateValue = function(target, newValue) {
    var updatedField = ko.mapping.toJS(target);
    db.transaction(function(tx) {
      tx.executeSql('UPDATE Q set VALUE = ' + newValue + ' WHERE ID = ' + updatedField.dbid, [], function(tx, results) {
        // console.log('db updated with new value for ' + updatedField.description);
      }, null);
    });
  }; // updateValue

  // private functions
  function apply() {
    console.log("applying Main");

    var input_container = document.getElementById('input-container');
    ko.applyBindings(viewModelInputsFiltered, input_container);

    var output_container = document.getElementById('output-container');
    ko.applyBindings(viewModelOutputsFiltered, output_container);

    var children_list = document.getElementById('children-list');
    ko.applyBindings(viewModelChildren, children_list);

    // apply bindings for info-toggle button
    var navigation = document.getElementById('navigation');
    ko.applyBindings(THIS.viewModel, navigation);
    var toolbar = document.getElementById('toolbar');
    ko.applyBindings(THIS.viewModel, toolbar);
    var info_container = document.getElementById('info-container');
    ko.applyBindings(THIS.viewModel, info_container);

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
    return THIS.viewModel.action();
  }; // action

  this.change_node = function(targetid) {
    console.log("switching to node " + targetid);
    var todo = 9;
    // update main list of children nodes, update toggle button
    var childArray = [];
    var warningMessagesArray = [];
    var errorMessagesArray = [];
    THIS.viewModel.currentId(targetid);
    if (db) {
      db.readTransaction(function(tx) {
        tx.executeSql('SELECT TAG, DESCRIPTION, TYPE, ID FROM N WHERE PARENT =' + targetid + ' AND ID <>' + targetid, [], function(tx, results) {
          var len = results.rows.length, i;
          for ( i = 0; i < len; i++) {
            var item = results.rows.item(i);
            if ( (item.TAG.toLowerCase() !== 'source') && (item.TAG.toLowerCase() !== 'sink') ) {
              var obj = {
                "tag" : item.TAG,
                "description" : item.DESCRIPTION,
                "type" : item.TYPE,
                "id" : item.ID
              };
              childArray.push(obj);
            } // if not source or sink
          } // for each row
          if (len > 0) {
            THIS.viewModel.hasChildren(true);
            childArray.sort(function (a, b) {
              if (a.tag > b.tag) {
                return 1;
              } else if (a.tag < b.tag) {
                return -1;
              } else {
                return 0;
              }
            });
          } else {
            THIS.viewModel.hasChildren(false);
            //TODO rimuovere patch
            hideChildren();
          }
          children = {
            "children" : childArray
          };
          ko.mapping.fromJS(children, mapping, viewModelChildren);
          if (--todo === 0) unlockUI("children transaction in change_node");
          else console.log("todo = " + todo + " from: children transaction in change_node");
        }, null);
      });

      // fill inputs and outputs
      db.readTransaction(function(tx) {
        tx.executeSql('SELECT FULLTAG,RANGE FROM N WHERE ID=' + targetid, [], function(tx, results) {
          var range = results.rows.item(0).RANGE;
          var tag0Length = results.rows.item(0).FULLTAG.indexOf(":");
          tag0Length = tag0Length >= 0 ? tag0Length : results.rows.item(0).FULLTAG.length;
          // show variables for the current node and all its descendants
          // var query = 'SELECT N.FULLTAG||\'.\'||Q.TAG AS FULLTAG, Q.VALUE, Q.UNIT, Q.DESCRIPTION, Q.ID, Q.DESCRIPTION FROM N JOIN Q ON N.ID = Q.NID WHERE N.ID >=' + targetid + ' AND N.ID < ' + (targetid + range) + ' AND';
          // only show variables for the current node:
          var query = 'SELECT N.FULLTAG||\'.\'||Q.TAG AS FULLTAG, Q.VALUE, Q.UNIT, Q.DESCRIPTION, Q.ID, Q.DESCRIPTION FROM N JOIN Q ON N.ID = Q.NID WHERE N.ID =' + targetid + ' AND';
          fillInputs(tx, tag0Length, query + ' Q.INPUT=' + 1);
          fillOutputs(tx, tag0Length, query + ' Q.OUTPUT=' + 1);
          if (--todo === 0) unlockUI("inputs / outputs transaction in change_node");
          else console.log("todo = " + todo + " from: inputs / outputs transaction in change_node");
        }, null);

        tx.executeSql('SELECT sv.tag as type, svv.value as message_text from svv inner join sv on sv.id = svv.vid where sv.nid = ' + targetid, [], function(tx, results) {
          var len = results.rows.length, i;
          for ( i = 0; i < len; i++) {
            var item = results.rows.item(i);
            if (item.type === 'errors')
              errorMessagesArray.push(item.message_text);
            else
              warningMessagesArray.push(item.message_text);
          } // for each row
          ko.mapping.fromJS(errorMessagesArray, mapping, THIS.viewModel.error_messages);
          ko.mapping.fromJS(warningMessagesArray, mapping, THIS.viewModel.warning_messages);
          if (--todo === 0) unlockUI("messages transaction in change_node");
          else console.log("todo = " + todo + " from: messages transaction in change_node");
        }, null);
      });

      // update viewModel
      db.readTransaction(function(tx) {
        tx.executeSql('SELECT C.TAG as CurrTAG,C.FULLTAG as CurrFULLTAG,C.DESCRIPTION as CurrDESCRIPTION,C.TYPE as CurrTYPE,P.TAG,P.ID FROM N AS C, N AS P WHERE C.ID= ' + targetid + ' AND C.PARENT=P.ID;', [], function(tx, results) {
          var item = results.rows.item(0);
          if (targetid === 0) {
            THIS.viewModel.action(-1);
            THIS.viewModel.homeText('Home');
            THIS.viewModel.Tag0(item.CurrTAG);
            THIS.viewModel.Description0(item.CurrDESCRIPTION);
            THIS.viewModel.Type0(item.CurrTYPE);
            THIS.viewModel.typeDescription0(type_property(item.CurrTYPE, "description", ""));
          } else {
            THIS.viewModel.action(item.ID);
            THIS.viewModel.homeText(item.TAG);
          }
          THIS.viewModel.Tag(item.CurrTAG);
          THIS.viewModel.fullTag(item.CurrFULLTAG);
          THIS.viewModel.Description(item.CurrDESCRIPTION);
          THIS.viewModel.Type(item.CurrTYPE);
          THIS.viewModel.typeDescription(type_property(item.CurrTYPE, "description", ""));
          if (--todo === 0) unlockUI("main viewModel transaction in change_node");
          else console.log("todo = " + todo + " from: main viewModel transaction in change_node");
        }, null);
      });
      db.readTransaction(function(tx) {
        tx.executeSql('select count(*) as count from svv inner join sv on sv.id = svv.vid where sv.nid=' + targetid + ' and sv.tag=\'errors\';', [], function(tx, results) {
          var item = results.rows.item(0);
          THIS.viewModel.errors(item.count);
          if (targetid === 0) {
            THIS.viewModel.errors0(item.count);
          } // if node 0
          if (--todo === 0) unlockUI("error count transaction in change_node");
          else console.log("todo = " + todo + " from: error count transaction in change_node");
        }, null);
      });
      db.readTransaction(function(tx) {
        tx.executeSql('select count(*) as count from svv inner join sv on sv.id = svv.vid where sv.nid=' + targetid + ' and sv.tag=\'warnings\';', [], function(tx, results) {
          var item = results.rows.item(0);
          THIS.viewModel.warnings(item.count);
          if (targetid === 0) {
            THIS.viewModel.warnings0(item.count);
          } // if node 0
          if (--todo === 0) unlockUI("warning count transaction in change_node");
          else console.log("todo = " + todo + " from: warning count transaction in change_node");
        }, null);
      });
    } // if there is a database connection

    var inputsArray = [];
    function fillInputs(tx, tag0Length, query) {
      console.log('fillInputs query = ' + query);
      tx.executeSql(query, [], function(tx, results) {
        var len = results.rows.length, i;
        for ( i = 0; i < len; i++) {
          var item = results.rows.item(i);
          var obj = {
            "fulltag" : item.FULLTAG.substring(tag0Length + 1),
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
        if (--todo === 0) unlockUI("fillInputs");
        else console.log("todo = " + todo + " from: fillInputs");
      }, null);
    } // fillInputs

    var outputsArray = [];
    function fillOutputs(tx, tag0Length, query) {
      console.log('fillOutputs query = ' + query);
      tx.executeSql(query, [], function(tx, results) {
        var len = results.rows.length, i;
        for ( i = 0; i < len; i++) {
          var item = results.rows.item(i);
          var obj = {
            "fulltag" : item.FULLTAG.substring(tag0Length + 1),
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
        if (--todo === 0) unlockUI("fillOutputs");
        else console.log("todo = " + todo + " from: fillOutputs");
      }, null);
    } // fillOutputs

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
            document.getElementById('image-container').firstElementChild.setAttribute("class", "vcenter");
            overrideXlinks();
          };
          reader.readAsText(file);
          if (--todo === 0) unlockUI("change_svg");
          else console.log("todo = " + todo + " from: change_svg");
        }); // file
      }); // getFileEntry
    } // change_svg


    change_svg(targetid);
  }; // change_node

  function overrideXlinks() {
    // rewire onclick events for xlink:href anchors in the image-container
    var as = document.getElementById('image-container').getElementsByTagName("a");
    for (var a = 0; a < as.length; a++) {
      if (as[a].hasAttribute('xlink:href')) {
        as[a].onclick = onClickXref;
      }
    } // for each anchor
    // change IRI (Internationalized Resource Identifier) references for all image elements to point to the current service's cache directory
    var is = document.getElementById('image-container').getElementsByTagName("image");
    for (var i = 0; i < is.length; i++) {
      var url = is[i].getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      var newurl = THIS.prefix + THIS.service_uuid + '/' + url;
      console.log('rewiring [' + url + '] to [' + newurl + ']');
      is[i].setAttributeNS('http://www.w3.org/1999/xlink', 'href', newurl); 
    } // for each image
  } // overrideXlinks

  // stop event propagation
  function dummy(e) {
    if (!e)
      e = window.event;
    e.cancelBubble = true;
    if (e.stopPropagation)
      e.stopPropagation();
  }

  function updateRange() {
    /* jshint validthis: true */
    document.getElementById('range').value = 50;
    var div = this.parentNode.parentNode;
    div.getElementsByTagName('span')[3].innerHTML = this.value;
  }

  function updateNumber() {
    /* jshint validthis: true, -W041: false */
    var ib = this.parentNode;
    var div = ib.parentNode;
    if (div.getElementsByTagName('span')[3].innerHTML == 0.0) // do not compare with === !
      ib.getElementsByTagName('input')[0].value = this.value / 50.0 - 1.0;
    else
      ib.getElementsByTagName('input')[0].value = div.getElementsByTagName('span')[3].innerHTML * this.value / 50.0;
  }

}); // Main namespace
