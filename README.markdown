
    Copyright 2014, Bimsurfer.org
    Bimsurfer is licensed under the GNU Affero General Public License, version 3.0. 

## New version 2014-03
A new version of Bimsurfer is developed to make BIM Surfer a module that can be integrated in 3th party applications. 

### Demo
Because the new BIM Surfer is a module that has to be configured there is not real one demo. And because the API documention is not finished yet, you have to know a bit about javascript to understand how you can use the current version of BIM Surfer.  
There are two example implementation thought: Have a look at example1.html in the repository, or at the way the BCF Forum project used BIM Surfer: https://github.com/opensourceBIM/BimConsiderationForum-BcfServer/blob/master/consideration-forum/js/bimsurfer.js  
  
###Featues:
There ar not a lot of new features. The most important change is that BIM Surfer can now be used as a module. This enhances integration with you own applications.

## Installation

### BIM Surfer installation

#### To deploy BIM Surfer locally on your machine:

1. Download a release and extract it into a folder somewhere.
2. Open one of the exammples using a WebGL compatible web browser.

#### To deploy BIM Surfer on a web server (e.g. apache):

BIM Surfer is a client-side application. Thus, it is very easy to deploy on a web server.

1. Simply place the code into a statically accessible directory on your server. 
2. Point a compatible web browser (see below) to the url.

One advantage of deploying BIM Surfer on a web server is that it obviates the need to circumvent certain cross-domain
security policies that crop up when running the application locally.

### BIMserver Installation

In order to load IFC models into BIM Surfer you will first need to connect to a running BIMserver.
For now it is recommended to use the latest version of BIMserver in development.

## Running BIMsurfer locally on your computer

Modern web browsers have security measures built in to prevent applications from accessing your computer. 
Google for some answers.

## Embedding BIMsurfer into another web page
BIM Surfer now has an API to embed a viewer for your needs in one of your applications. When you are a developer it should be easy to read the source and find our how it works. 


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

