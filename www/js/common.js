// configuration for jshint
/* jshint browser: false, devel: true, strict: true */
/* global FileTransfer, LocalFileSystem */

// this module has the auxiliary functions for Landing, Configure and Main
// it should not directly use the DOM

function format_date(timestamp) {
  "use strict";
  var date = new Date(timestamp * 1000.0);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

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
  
  // https://developer.mozilla.org/en-US/docs/Web/API/LocalFileSystem#requestFileSystem
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
    // fileEntry.remove();

    fileTransfer.download(
      URL,
      path,
      function(file) {
        console.log('download complete: ' + file.toURL());
        if (callback1)
          callback1();
      },
      function(error) {
        console.error('download failure for file ' + path + ': ' + JSON.stringify(error));
      }
    );
  }
} // downloadFile

function fail(e) {
  "use strict";
  console.error("FileSystem Error");
  console.dir(e);
}

function getDataFromAPI(url, callback) {
  "use strict";
  console.log('IN GETDATAFROMAPI FUNC');
  // get data from given url
  console.log('connecting to: '+url);
  try {
    var request = new XMLHttpRequest();
    var dataFrom;
    request.onload = function() {
      if (request.status >= 200 && request.status < 400){
        console.log("request success" + request.responseText);
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
    request.open('GET', url, true);
    request.send();
    console.log('LEAVING GETDATAFROMAPI FUNC');
  } catch(err){
    console.error('problem in the service: ' + err);
  }
} // getDataFromAPI

function getFileEntry(dirName, fileName, callback) {
  "use strict";
  console.log('IN GETFILEENTRY FUNC');
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
        console.log("request success" + request.responseText);
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
