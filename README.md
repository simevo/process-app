simevo process app
==================

The **simevo process app** is a free, open source mobile app to access process simulations hosted in the cloud using **simevo process technology**.

For more informations visit: [http://simevo.com/process/app.html](http://simevo.com/process/app.html)

#License

Copyright (C) simevo 2014 [http://simevo.com](http://simevo.com)

HTML5/CCS3/Javascript portions by Francesco Perotti.

Javascript portions by Kavinda (vinok88@gmail.com).

Certain icons by Helena Charmer.

**GPLv3 License**:

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.

#Testing with phonegap developer

work round issue https://github.com/phonegap/phonegap-app-developer/issues/187 !

added an empty the file www/__api__/register with an empty json document:

    {}

now move to repo with the terminal and type:

    cordova serve

the app is accessible from: http://localhost:8000/android/www/

#Debugging knockout.js

http://stackoverflow.com/questions/9261296/how-to-debug-template-binding-errors-for-knockoutjs

    <div>
      <pre data-bind="text: ko.toJSON($data, null, 2)"></pre>
    </div>

#Contains code borrowed from:

- Adobe PhoneGap and Apache Cordova

  Apache License, Version 2.0

  [http://phonegap.com/about/license/](http://phonegap.com/about/license/)

- Knockout

  MIT License

  Copyright (c) Steven Sanderson, the Knockout.js team, and other contributors

  [http://knockoutjs.com/](http://knockoutjs.com/)

- Bootstrap HTML, CSS, and JS framework 

  MIT License

  Copyright 2011-2014 Twitter, Inc.

  [http://getbootstrap.com/](http://getbootstrap.com/)

- JavaScript Undo Manager

  MIT License

  Copyright (c) 2010-2014 Arthur Clemens, arthurclemens@gmail.com

  [https://github.com/ArthurClemens/Javascript-Undo-Manager](https://github.com/ArthurClemens/Javascript-Undo-Manager)

#Contains graphic elements and artwork from:

- Biogas fermenter dome icon based on Biogas-Anlage icon Copyright (C) 2014 - Agentur für Erneuerbare Energien

  [http://www.unendlich-viel-energie.de/](http://www.unendlich-viel-energie.de/)

- Pasteurization icon adapted from from "Explain that Stuff"

  Creative Commons NC-SA license

  [http://www.explainthatstuff.com/pasteurization.html](http://www.explainthatstuff.com/pasteurization.html)

- Following the edges of the icosidodecahedron by fdecomite

  Creative Commons Attribution 2.0 Generic (CC BY 2.0)

  [https://www.flickr.com/photos/fdecomite/5267221562](https://www.flickr.com/photos/fdecomite/5267221562)

- P8140170 by Philip Sheldrake

  Creative Commons Attribution-ShareAlike 2.0 Generic (CC BY-SA 2.0) 

  [https://www.flickr.com/photos/philip_sheldrake/109364052](https://www.flickr.com/photos/philip_sheldrake/109364052)

- Inauguració-Reivindicació Planta Biogàs Torregrossa, Lleida by Som Energia Cooperativa

  Creative Commons Attribution 2.0 Generic (CC BY 2.0)

  [https://www.flickr.com/photos/somenergia/13165947773](https://www.flickr.com/photos/somenergia/13165947773)

- Undo icon designed by Sergey Furtaev from the Noun Project

  Creative Commons Attribution 3.0 US (CC BY 3.0 US)

  [http://thenounproject.com/term/undo/14157/](http://thenounproject.com/term/undo/14157/)

#Device emulation

Testing the app on the device emulators.

Create an empty phonegap app that we will use for the builds using the [CLI](http://docs.phonegap.com/en/3.0.0/guide_cli_index.md.html#The%20Command-line%20Interface):

    phonegap create process-app-local com.simevo.process-app ProcessApp
    cd process-app-local

Remove the automatically generated www directory:

    rm -rf www

Link the www directory from the live repo into the *-local build directory:

    ln -s ../process-app-private/www .

on windows, open a CMD as admin, browse to process-app-local and:

    mklink /d www ..\process-app-private\www

Now install plugins & build:

    phonegap local plugin add org.apache.cordova.device
    phonegap local plugin add org.apache.cordova.file
    phonegap local plugin add org.apache.cordova.file-transfer
    phonegap local plugin add org.apache.cordova.splashscreen

Now start the emulator, one of:

    phonegap local run android
    phonegap local run wp8
    phonegap local run ios

Looking at the OS console (inclusing the webview console):

    adb logcat

or via android device monitor:

    monitor

#Debugging Cordova hybrid applications on the Android emulator

On Android 4.4 (kitkat) and later it is possible to debug from the Chrome / Chromium inspector of the host the HTML / javascript contents of Android WebView of a Cordova hybrid application running inside the Android emulator. 

Enable remote debugging as per [this guide](http://www.thedumbterminal.co.uk/?action=showArticle&articleId=180) adding a few lines in the simevoProcessApp.java file located in process-app-local/platforms/android/src/com/simevo/process_app.

This is the modified file:

    package com.simevo.process_app;

    import android.os.Bundle;
    import org.apache.cordova.*;

    // !! start
    import android.os.Build;
    import android.util.Log;
    import android.content.pm.ApplicationInfo;
    import android.webkit.WebView;
    // !! end

    public class simevoProcessApp extends CordovaActivity 
    {
        @Override
        public void onCreate(Bundle savedInstanceState)
        {
            super.onCreate(savedInstanceState);
            // !! start: enable Debugging Android WebViews in Cordova hybrid application running on kitkat
            if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT){
              if (0 != (getApplicationInfo().flags = ApplicationInfo.FLAG_DEBUGGABLE)) {
              Log.i("Your app", "Enabling web debugging");
              WebView.setWebContentsDebuggingEnabled(true);
              }
            }
            // !! end
            super.init();
            // Set by <content src="index.html" /> in config.xml
            super.loadUrl(Config.getStartUrl());
            //super.loadUrl("file:///android_asset/www/index.html");
        }
    }

Then do: 

    cordova -d build android
    cordova -d run android
    
Then follow [this guide](https://developer.chrome.com/devtools/docs/remote-debugging) but skipping the USB part:

- open Chrome / Chromium in the host 

- Go to chrome://inspect to get a list of debuggable WebViews

- Click inspect on the WebView you wish to debug and use the inspector as you would for a remote browser tab.

#Ripple Emulation

To use Ripple on Google Chrome or Firefox we have followed this procedure:

We have changed this tag into the body of index.html:

    <script type="text/javascript" src="phonegap.js"></script>

changing phonegap.js with cordova.js

    <script type="text/javascript" src="cordova.js"></script>

After this, we have followed the [instructions on Raymond Camden's blog](http://www.raymondcamden.com/2013/11/5/Ripple-is-Reborn). To be more precise we have typed these commands into console:

    npm install -g ripple-emulator
    cordova plugin add org.apache.cordova.device org.apache.cordova.file org.apache.cordova.splashscreen
    cordova platform add android
    cordova prepare
    mkdir -p platforms/android/assets/www/platforms

Each time the app source code is changed restart the emulator:

    ripple emulate --path platforms/android/assets/www

At launch of this last command, your Google Chrome should open with Ripple at the last version of Cordova (3.0.0) giving no errors when you open console with your inspector / firebug.

#Websql tweak

Websql is supported only in google chrome / chromium; for testing, to manually load the database for site http://192.168.0.3:8080, copy persistency.db in:

    /home/paolog/.config/chromium/Default/databases/http_192.168.0.3_8080/

or on Windows:

    c:\Users\username\AppData\Local\Google\Chrome\UserData\Default\databases\http_192.168.0.3_8080\
