<img src="https://raw.github.com/opensourceBIM/BIMsurfer/master/static/images/main-menu-logo.png" alt="BIMsurfer">

    Copyright 2013, Bimsurfer.org
    Bimsurfer is licensed under the GNU Affero General Public License, version 3.0. 
    (Please find the license under licenses/LICENSE-bimsurfer-agpl3)

## New version 2012-08
A new version of Bimsurfer is developed by the Netherlands organisation for applied scientific research TNO.

### New features
This new version will give developers an API to build their own viewers.

### Roadmap
Work will continue on:
- timeslider for older revisions
- integrating BCF support for issue management
- integrate with other projects from the open source BIM collective (opensourcebim.org)

	
## Installation

### BIMsurfer installation

#### To deploy BIMsurfer locally on your machine:

1. Download a release and extract it into a folder somewhere.
2. Open the file `index.html` using a compatible web browser (see below).

#### To deploy BIMsurfer on a web server (e.g. apache):

BIMsurfer is a client-side application. Thus, it is very easy to deploy on a web server.

1. Simply extract the release (e.g. `BIMsurfer_x_x_x.tar.gz`) into a statically accessible directory on your server. 
2. Point a compatible web browser (see below) to the url.

One advantage of deploying BIMsurfer on a web server is that it obviates the need to circumvent certain cross-domain
security policies that crop up when running the application locally.


## Running BIMsurfer locally on your computer

Modern web browsers have security measures built in to prevent applications from accessing your computer. 
For this reason, if you wish to run BIMsurfer locally on your computer you should follow these instructions: 
https://github.com/bimserver/BIMsurfer/wiki/How-to-run-BIMsurfer-on-your-local-computer

## Viewing/opening a model

BIM Surfer has implemented the BIMSie standard API for BIM in the cloud. 
Therefore you can connect to any online service that is compliant with BIMSie to open models.

## Compatible web browsers

Currently the folowing browsers are known to work with BIMsurfer.

* Up-to-date versions of Google Chrome.
* Firefox 4.0 or later
* Internet Explorer depending on the MS releases

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


