simevo process app
==================

The **simevo process app** is a free, open source mobile app to access process simulations hosted in the cloud using **simevo process technology**.

For more information visit: [http://simevo.com/process/app.html](http://simevo.com/process/app.html)

#License

The simevo process app (C) Copyright 2014-2018 Paolo Greppi [simevo s.r.l.](http://simevo.com).

**GPLv3 License**:

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.

#Credits

##Code

HTML5/CCS3/Javascript portions by Francesco Perotti.

Javascript portions by Kavinda (vinok88@gmail.com).

Contains code borrowed from:

- Adobe PhoneGap and Apache Cordova

  Apache License, Version 2.0

  [https://phonegap.com/about/license/](https://phonegap.com/about/license/)

- Knockout

  MIT License

  Copyright (c) Steven Sanderson, the Knockout.js team, and other contributors

  [https://knockoutjs.com/](https://knockoutjs.com/)

- Knockout Mapping plugin

  MIT License

  (c) 2013 Steven Sanderson, Roy Jacobs

  [https://knockoutjs.com/documentation/plugins-mapping.html](https://knockoutjs.com/documentation/plugins-mapping.html)

- knockout-projections plugin

  Apache 2.0 License

  Copyright (c) Microsoft Corporation

  [https://github.com/stevesanderson/knockout-projections](https://github.com/stevesanderson/knockout-projections)

- Bootstrap HTML, CSS, and JS framework

  MIT License

  Copyright (c) 2011-2018 Twitter, Inc.

  [https://getbootstrap.com/](https://getbootstrap.com/)

- JavaScript Undo Manager

  MIT License

  Copyright (c) 2010-2015 Arthur Clemens, arthurclemens@gmail.com

  [https://github.com/ArthurClemens/Javascript-Undo-Manager](https://github.com/ArthurClemens/Javascript-Undo-Manager)

- UNICODE codepoints tables

  Copyright (c) 2002, The Tendra Project, Crown Copyright (c) 1997

##Assets

Certain icons by Helena Charmer.

Contains graphic elements and artwork from:

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

#Generate icons and splashes

See:

- http://docs.phonegap.com/phonegap-build/configuring/icons-and-splash/

- https://github.com/apache/cordova-plugin-splashscreen

```
grep ios config.xml  | grep icon | sed 's/ *<icon src="\([^"]*\)" platform="ios" width="\([^"]*\)".*/convert -sample \2x\2 icon.png \1/g' > q.sh
grep android config.xml  | grep icon | sed 's/ *<icon qualifier=".*dpi" src="\(res.icon.android.icon-\)\([^-]*\)\(-.*dpi.png\)".*/convert -sample \2x\2 icon.png \1\2\3/g' >> q.sh
chmod u+x q.sh
mkdir -p res/icon/ios
mkdir -p res/icon/android
./q.sh

mkdir -p res/screen/ios
convert -sample 2732x2732 splash.png res/screen/ios/Default@2x~universal~anyany.png
mkdir -p res/screen/android
convert -sample 320x200 splash.png res/screen/android/splash-land-ldpi.png
convert -sample 480x320 splash.png res/screen/android/splash-land-mdpi.png
convert -sample 800x480 splash.png res/screen/android/splash-land-hdpi.png
convert -sample 1280x720 splash.png res/screen/android/splash-land-xhdpi.png
convert -sample 1600x960 splash.png res/screen/android/splash-land-xxhdpi.png
convert -sample 1920x1280 splash.png res/screen/android/splash-land-xxxhdpi.png
convert -sample 200x320 splash.png res/screen/android/splash-port-ldpi.png
convert -sample 320x480 splash.png res/screen/android/splash-port-mdpi.png
convert -sample 480x800 splash.png res/screen/android/splash-port-hdpi.png
convert -sample 720x1280 splash.png res/screen/android/splash-port-xhdpi.png
convert -sample 960x1600 splash.png res/screen/android/splash-port-xxhdpi.png
convert -sample 1280x1920 splash.png res/screen/android/splash-port-xxxhdpi.png
```

#Testing

Install the [phonegap CLI](http://docs.phonegap.com/getting-started/1-install-phonegap/cli/):

    sudo npm install -g phonegap@latest

then clean the working directory:

    rm -rf platforms plugins

##In the browser

Build & serve:

    phonegap platform add browser
    phonegap build browser
    phonegap serve

Then open http://192.168.1.179:3000 in your favorite browser or with the PhoneGap Developer app.

NOTE: To debug issues related to knockout.js, as per [this stackoverflow thread](http://stackoverflow.com/questions/9261296/how-to-debug-template-binding-errors-for-knockoutjs), add this to your html:

    <div>
      <pre data-bind="text: ko.toJSON($data, null, 2)"></pre>
    </div>

##On emulated devices

##Android

Build & run:

    phonegap platform add android
    phonegap build android
    phonegap run android

To install on the device:

    phonegap build android
    /opt/Android/Sdk/platform-tools/adb -d install ./platforms/android/build/outputs/apk/android-debug.apk

Looking at the OS console (inclusing the webview console):

    adb logcat

or via android device monitor:

    monitor

Looking at the filesystem:

    adb shell
    run-as com.simevo.processapp
    ls -l /data/data/com.simevo.processapp

###Debian Android SDK setup

- Set up Android Studio on Debian 10 (buster) 64-bit: http://wp.libpf.com/?p=856

- make the Android SDK tools available:

        export PATH="/home/`id -un`/Android/Sdk/tools:$PATH"

- Install Node.js & NPM

        sudo apt-get install nodejs

- update node packages just in case (https://docs.npmjs.com/cli/update):

        sudo npm update -g

- special bit if your run on 32-bit linux: add these to ~/.profile and source ~/.profile:

        export ANDROID_EMULATOR_FORCE_32BIT=true

- enable hardware acceleration for the Android emulator:

        sudo apt-get install qemu-kvm libvirt-bin
        sudo adduser `id -un` libvirt
        newgrp libvirt

  in case you had previously used virtualbox, switch to kvm:

        sudo rmmod vboxpci
        sudo rmmod vboxnetadp
        sudo rmmod vboxnetflt
        sudo rmmod vboxdrv

  then start the emulator like this:

        emulator -avd NexusS_23 -qemu -enable-kvm

  or:

        ANDROID_EMULATOR_USE_SYSTEM_LIBS=1 /opt/Android/Sdk/tools/emulator -avd nougat -qemu -enable-kvm

- if you wish to switch back to virtualbox:

        sudo rmmod kvm_intel
        sudo rmmod kvm

NOTE: The HAXM driver does not support emulating a 64 bit system image on Intel systems based on Core microarchitecture (Core, Core2 Duo etc.). All systems based on Nehalem and beyond are supported. (Core i3, Core i5 and Core i7 machines).

###Inspecting with Chrome / Chromium

On Android 4.4 (kitkat) and later it is possible to debug from the Chrome / Chromium inspector of the host the HTML / javascript contents of Android WebView of a Cordova hybrid application running inside the Android emulator or in the device.

This should be enabled by default.

Just follow [this guide](https://developer.chrome.com/devtools/docs/remote-debugging) but skipping the USB part:

- open Chrome / Chromium in the host

- Go to chrome://inspect to get a list of debuggable WebViews

- Click inspect on the WebView you wish to debug and use the inspector as you would for a remote browser tab.

NOTE: To access the sandboxed filesystem in Chrome, go to chrome://flags and enable "Enable Developer Tools experiments", then go to the Settings panel, Experiments tab in Developer Tools and turn on "FileSystem Inspection"

This is currently unavailable (chromium 53) https://bugs.chromium.org/p/chromium/issues/detail?id=256067

As a workaround you can use the "HTML5 FileSystem Explorer Extended" extension: https://chrome.google.com/webstore/detail/html5-filesystem-explorer/chkmbbajnboncdmkigkgpjdhppcjhlcc

##iOS

Build once with phonegap CLI:

    phonegap platform add ios
    phonegap build ios
    phonegap run ios

then open the `platforms/ios/simevo process app.xcodeproj` project with XCode and follow the instructions here to debug the webview with Safari Remote Debugging: https://github.com/phonegap/phonegap/wiki/Debugging-in-PhoneGap:
"If you are doing iOS PhoneGap debugging and have the Safari Develop Menu enabled, you can access the currently active session through the built-in Safari Web Inspector. To activate, go to Develop -> (iPad || iPhone) Simulator (normally, the third menu item) and click the active session you want to connect to. Voila!"

It is easy to loose the early console.log messages because the webkit session is not active and therefore not selectable in the Safari host before the debug session starts; to make sure you get everything, insert a breakpoint in `platforms/ios/CordovaLib/Classes/Public/CDVViewController.m` in the method webViewDidFinishLoad, then the webkit session is active, you can select it in the Safari host and the web inspector will capture the entire log.

#Known issues

1. changes to variables whlie editing a case are discarded when closing the case or the app unless they are sent to the server

1. on Android, some graphical asset of the app may become visible in the image gallery
