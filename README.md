simevo process app
==================

The **simevo process app** is a free, open source mobile app to access process simulations hosted in the cloud using **simevo process technology**.

For more informations visit: [http://simevo.com/process/app.html](http://simevo.com/process/app.html)

#License

The simevo process app (C) Copyright 2014-2016 Paolo Greppi [simevo s.r.l.](http://simevo.com).

HTML5/CCS3/Javascript portions by Francesco Perotti.

Javascript portions by Kavinda (vinok88@gmail.com).

Certain icons by Helena Charmer.

**GPLv3 License**:

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.

#Contains code borrowed from:

- Adobe PhoneGap and Apache Cordova

  Apache License, Version 2.0

  [http://phonegap.com/about/license/](http://phonegap.com/about/license/)

- Knockout

  MIT License

  Copyright (c) Steven Sanderson, the Knockout.js team, and other contributors

  [http://knockoutjs.com/](http://knockoutjs.com/)

- Knockout Mapping plugin

  MIT License

  (c) 2013 Steven Sanderson, Roy Jacobs

  [http://knockoutjs.com/documentation/plugins-mapping.html](http://knockoutjs.com/documentation/plugins-mapping.html)

- knockout-projections plugin

  Apache 2.0 License

  Copyright (c) Microsoft Corporation

  [https://github.com/stevesanderson/knockout-projections](https://github.com/stevesanderson/knockout-projections)

- Bootstrap HTML, CSS, and JS framework 

  MIT License

  Copyright (c) 2011-2016 Twitter, Inc.

  [http://getbootstrap.com/](http://getbootstrap.com/)

- JavaScript Undo Manager

  MIT License

  Copyright (c) 2010-2015 Arthur Clemens, arthurclemens@gmail.com

  [https://github.com/ArthurClemens/Javascript-Undo-Manager](https://github.com/ArthurClemens/Javascript-Undo-Manager)

- UNICODE codepoints tables

  Copyright (c) 2002, The Tendra Project, Crown Copyright (c) 1997

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

- CSS3-only spinning loader animation based on "Ajax Loader" by wimlatour:

  [http://one-div.com/pictos/ajax-loader/](http://one-div.com/pictos/ajax-loader/)

  (unspecified license)

#Testing

The following assumes your layout has the repo process-app sitting next to the working directory process-app-local.

Create an empty phonegap app that we will use for the builds using the [CLI](http://docs.phonegap.com/references/phonegap-cli/create/):

    phonegap create process-app-local com.simevo.processapp processapp
    cd process-app-local

Remove the automatically generated www directory and config.xml file:

    rm -rf www
    rm config.xml

Link the www and merges directories from the live repo into the *-local build directory:

    ln -s ../process-app/www .
    ln -s ../process-app/merges .

to do that on Windows, open a CMD as admin, browse to process-app-local and:

    mklink /d www ..\process-app\www
    mklink /d merges ..\process-app\merges

Now install plugins:

    phonegap plugin add cordova-plugin-device
    phonegap plugin add cordova-plugin-whitelist
    phonegap plugin add cordova-plugin-file
    phonegap plugin add cordova-plugin-file-transfer
    phonegap plugin add cordova-plugin-splashscreen
    phonegap plugin add cordova-plugin-statusbar
    phonegap plugin add cordova-sqlite-legacy
    phonegap plugin add cordova-plugin-x-socialsharing

##Testing in the browser

Check the line 187/189 in www/js/Main.js, the window.openDatabase variant should be active.

Now build & serve:

    phonegap platform add browser
    phonegap build browser
    phonegap serve

Then open http://localhost:3000 in Chrome / Chromium.

To access the sandboxed filesystem in Chrome, go to chrome://flags and enable "Enable Developer Tools experiments", then go to the Settings panel, Experiments tab in Developer Tools and turn on "FileSystem Inspection"

##Debugging knockout.js

As per [this stackoverflow thread](http://stackoverflow.com/questions/9261296/how-to-debug-template-binding-errors-for-knockoutjs):

    <div>
      <pre data-bind="text: ko.toJSON($data, null, 2)"></pre>
    </div>

##Testing on emulated deviced

To start the emulator, one of:

    phonegap run android
    phonegap run windows
    phonegap run ios

###Debian Android SDK setup

- Set up Android Studio on Debian 7 (Wheezy( or 8 (Jessie) 64-bit: http://wp.libpf.com/?p=856

- make the Adnroid SDK tools available:

        export PATH="/home/`id -un`/Android/Sdk/tools:$PATH"

- Install Node.js & NPM

  - on Debian 7 (Wheezy) as per http://antler.co.za/2014/04/install-node-js-npm-on-debian-stable-wheezy-7/; in summary:

           sudo apt-get -t wheezy-backports install nodejs nodejs-legacy

  - on Debian 8 (Wheezy):

           sudo apt-get install nodejs nodejs-legacy

- special bit if your run on 32-bit linux: add these to ~/.profile and source ~/.profile:

         export ANDROID_EMULATOR_FORCE_32BIT=true

- enable hardware acceleration for the Android emulator:

         sudo apt-get install qemu-kvm libvirt-bin
         sudo adduser `id -un` libvirt
         newgrp libvirt

  switch to kvm:

         sudo rmmod vboxpci
         sudo rmmod vboxnetadp
         sudo rmmod vboxnetflt
         sudo rmmod vboxdrv

  if you wish to switch back to virtualbox:

         sudo rmmod kvm_intel
         sudo rmmod kvm

###General Android-specific bits:

Looking at the OS console (inclusing the webview console):

    adb logcat

or via android device monitor:

    monitor

Looking at the filesystem:

    adb shell
    run-as com.simevo.processapp
    ls -l /data/data/com.simevo.processapp

Looking at a sqlite3 database; since the sqlite3 executable is not available on non-rooted, user builds, it is necessary to get it from the emulator **with the same ABI** as the device:

    adb -e pull /system/xbin/sqlite3
    adb -d push sqlite3 /mnt/sdcard/.
    adb -d shell
    cd /mnt/sdcard/.
    chmod 777 sqlite3
    run-as com.simevo.processapp
    cd databases
    cat /mnt/sdcard/sqlite3 > sqlite3
    ls -l sqlite3
    ./sqlite3 persistency.db

Note: this does not seem to work ATM.

Installing on device:

    phonegap build android
    /opt/Android/Sdk/platform-tools/adb -d install ./platforms/android/build/outputs/apk/android-debug.apk

###iOS-specific tips:

Build once with phonegap CLI, then open the process-app-local/platforms/ios/process app.xcodeproj with XCode and follow the instructions here to debug the webview with Safari Remote Debugging: https://github.com/phonegap/phonegap/wiki/Debugging-in-PhoneGap:
"If you are doing iOS PhoneGap debugging and have the Safari Develop Menu enabled, you can access the currently active session through the built-in Safari Web Inspector. To activate, go to Develop -> (iPad || iPhone) Simulator (normally, the third menu item) and click the active session you want to connect to. Voila!"

It is easy to loose the early console.log messages because the webkit session is not active and therefore not selectable in the Safari host before the debug session starts; to make sure you get everything, insert a breakpoint in process-app-local/platforms/ios/CordovaLib/Classes/CDVViewController.m in the method webViewDidFinishLoad, then the webkit session is active, you can select it in the Safari host and the web inspector will capture the entire log.

###Windows-specific bits:

The build will succeed but loading to the emulator fails with this error:

    CordovaDeploy.exe not found, attempting to build CordovaDeploy.exe...
    ..\process-app-local\platforms\windows\cordova\lib\deploy.js(96, 5) WshShell.Exec: The system cannot find the file specified.

The solution: open the Visual Studio solution process-app-local\platforms\windows\simevo_process_app.sln then start the debugger in there.

To watch files in the isolated storage, get [Windows Phone Power Tools](http://wptools.codeplex.com/).

To be able to inspect, install [weinre](http://people.apache.org/~pmuellr/weinre/docs/latest/Home.html) by issuing in an administrator command prompt:

    npm -g install weinre

Now start weinre:

    weinre

Then insert this line in index.html:

    <script src="http://localhost:8080/target/target-script-min.js"></script>

and rebuild, reload the app in the emulator. Finally open the address http://localhost:8080/client and select the 1st target then click on "Elements" in the toolbar.

##Debugging Cordova hybrid applications on the Android emulator

On Android 4.4 (kitkat) and later it is possible to debug from the Chrome / Chromium inspector of the host the HTML / javascript contents of Android WebView of a Cordova hybrid application running inside the Android emulator. 

Enable remote debugging as per [this guide](http://www.thedumbterminal.co.uk/?action=showArticle&articleId=180) adding a few lines in the simevoprocessapp.java file located in process-app-local/platforms/android/src/com/simevo/processapp.

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

##Websql tweak

Websql is supported only in google chrome / chromium; for testing, to manually load the database for site http://192.168.0.3:8080, copy persistency.db in:

    /home/paolog/.config/chromium/Default/databases/http_192.168.0.3_8080/

or on Windows:

    c:\Users\username\AppData\Local\Google\Chrome\UserData\Default\databases\http_192.168.0.3_8080\

#Known issues

1. changes to variables whlie editing a case are discarded when closing the case or the app unless they are sent to the server

1. on Android, some graphical asset of the app may become visible in the image gallery

1. only tested on Android 4.4 ATM
