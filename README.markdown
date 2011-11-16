<img src="http://bimsurfer.org/files/2011/11/bimsurfer-logo-245x85.png" alt="BIMsurfer">

    Copyright 2011, Bimserver.org
    BIMsurfer is licensed under the GNU Affero General Public License, version 3.0. 
    (Please find the license under licenses/LICENSE-bimsurfer-agpl3)
 
## Installation

### BIMsurfer installation

#### To deploy BIMsurfer locally on your machine:

1. Download a release and extract it into a folder somewhere.
2. Open the file `index.html` using a compatible web browser (see below).

#### To deploy BIMsurfer on a web server (e.g. apache):

BIMsurfer is a client-side application. Thus, it is very easy to deploy on a web server.

1. Simply extract the release (e.g. `BIMsurfer_1_0_0.tar.gz`) into a statically accessible directory on your server. 
2. Point a compatible web browser (see below) to the url.

One advantage of deploying BIMsurfer on a web server is that it obviates the need to circumvent certain cross-domain
security policies that crop up when running the application locally.

### BIMserver Installation

In order to load IFC models into BIMsurfer you will first need to export them using the BIMserver software.

For now it is recommended to use the latest version of BIMserver in development. These instructions will change as
soon as the next official version of BIMserver is released.

Please read these instructions for checking out a development version of the BIMserver:
http://code.google.com/p/bimserver/wiki/Eclipse

## Running BIMsurfer locally on your computer

Modern web browsers have security measures built in to prevent applications from accessing your computer. 
For this reason, if you wish to run BIMsurfer locally on your computer you should follow these instructions: 
https://github.com/bimserver/BIMsurfer/wiki/How-to-run-BIMsurfer-on-your-local-computer

## Importing a model

For detailed instructions with screenshots, please see the Wiki: https://github.com/bimserver/BIMsurfer/wiki/Import-IFC-models

(However, if you are not connected to the internet, simply keep reading...)

There are currently two methods for loading IFC models into BIMsurfer, both using the opensource BIMserver project.

### Connecting directly to a BIMserver

1. First, you must have an instance of a BIMserver running somewhere.
   Let's say that you have BIMserver running at `http://localhost:8080`.
2. Open BIMsurfer in your web browser
3. Open the **File** menu in the top left-hand corner and select **BIMserver Project**
4. In the dialog that comes up:
  1. Enter the BIMserver url (e.g. `http://localhost:8080`)
  2. Enter your username (e.g. `admin@bimserver.org`)
  3. Enter your password (e.g. `admin`)
  4. Click on **Login**
5. If you've been succesfully authenticated, a list of available projects will be shown.
  1. Select the project you want to view (e.g. `Vogel-Gesamt`)
  2. Click on **Open**

### Exporting and loading a SceneJS file

1. First, you must have an instance of a BIMserver running somewhere.
   Let's say that you have BIMserver running at `http://localhost:8080`;
2. Point your web browser to the BIMserver application (e.g. `http://localhost:8080`)
3. Login to the BIMserver
4. Create a new project (E.g. `Vogel-Gesamt`)
5. Upload an IFC file to the project (E.g. `Vogel_Gesamt.ifc`)
6. Once the IFC file is completely uploaded, *Refresh the page*...
7. To download the model to your computer:
  1. Select **SceneJS** from the dropdown box
  2. Click on **Download**
  3. Once the raw file is displayed in your web browser, right click and select **Save As...** (or the equivalent command in your web browser)
  4. Select a location on your computer to place the file, and give it a name ending in the `.json` extension.

Now the file is saved to your computer. To open the file in BIMsurfer, follow these steps:

1. Open BIMsurfer in your web browser
2. Open the **File** menu in the top left-hand corner and select **SceneJS File**
4. In the dialog that comes up:
  1. Click on **Choose File**
  2. Select the file you exported previously from BIMserver (e.g. `Vogel-Gesamt.json`)
  3. Click on **Open**

## Embedding BIMsurfer into another web page

* TODO...

## Linking to a BIMsurfer model in another web page

* TODO...

## Compatible web browsers

Currently the folowing browsers are known to work with BIMsurfer.

* Up-to-date versions of Google Chrome.
* Firefox 4.0 or later
* Internet Explorer is supported through the Google Chrome Frame plugin.

Please note all of the browsers above work fine, however we've found that google chrome consistently demonstrates
the best performance and also the fewest bugs. Support for Opera is forth coming...

## Third party libraries and licenses

Third party libraries used in this project:

* jQuery
  Licenses: `licenses/LICENSE-jquery-mit`, `licenses/LICENSE-jquery-gpl`

* jQuery UI
  Licenses: `licenses/LICENSE-jqueryui-mit`, `licenses/LICENSE-jqueryui-gpl`

* SceneJS
  Licenses: `licenses/LICENSE-scenejs-mit`, `licenses/LICENSE-scenejs-gpl`

* glMatrix
  Licenses: See the inline license in `static/lib/scenejs/scenejs.math.js`

## How to report bugs

* TODO...
