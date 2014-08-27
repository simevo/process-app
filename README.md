simevo Process App
==================

The **simevo Process App (SPA)** is an open source mobile app to access process simulations hosted in the cloud using **simevo process technology**.

For more informations visit: [http://simevo.com](http://simevo.com)

#License

Copyright (C) simevo 2014 [http://simevo.com](http://simevo.com)

Javascript portions by Kavinda (vinok88@gmail.com).

Some icons by Helena Charmer.

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

#LINK SERVER

#TODO

##ASAP:

1. Al primo avvio dell'app anzichè aprire su New, si aprirà su Services che sarà vuoto

1. A ogni apertura dell'app essa effettua la discovery e aggiorna l'elenco dei servizi

1. Possibilità di inserire un nuovo servizio manualmente e di rimuovere i servizi

1. Possibilità di rimuovere un caso dai recent

1. fare le traduzioni

1. http://validator.w3.org/check

1. applicare velatura div scelta server su iOS

1. inserire icone svg nuove

1. creare un div opaco da mettere sotto l'icona nel div della scelta del service

##HARD

1. rendere l'undo stack persistente: se io inizio a modificare delle variabili poi chiudo l'app, alla riapertura non posso più annullare le modfiche fatte nella sessione precedente; questo oltre ad essere limitante è un problema grave nel momento in cui quando l'utente richiede un calcolo, devo iniviare al server le modifiche fatte !

1. aggiungere la possibilità di fornire un valore di difetto per una specfica opzione stringa, diversa dal valore di difetto per l'enumeratore corrispondente; in questo caso la prima prenderà il soppravvento

##Fase post freelancer:

1. chiudere e resettare valori nel div input quando si crea un nuovo tipo

##Fase post-Phonegap:

1. Attivare plugin device, farci dare il valore di device.platform e in base a quel valore caricare un css a secondo che ci si trovi su WP, Android, iOS

1. Solo per android non ci deve essere la toolbar in basso e i bottoni vanno in alto a dx nella navigation ed eventualmente raggruppati in un unico pulsante

##MaybeDO:

1. Gestione tasto back

1. Rimuovere tasto back per Android e Windows Phone

1. Unificare tutti e 7 i viewModel della mainPage e rimuovere la patch

1. Una volta unificati i 7 viewModel, rimuovere la patch

1. Quando ci sono input/output-container e clicco sullo sfondo si deve poter chiudere

1. Differenziazione per piattaforma

1. Windows Phone scorrimento orizzontale anzichè la tab-list

##Open questions:

1. Dare un feedback all'undo/redo quando li effettuo?

1. Può esser utile una tabella riassuntiva di tutte le modifiche?
