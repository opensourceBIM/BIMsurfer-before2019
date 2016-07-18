define(function () {

    "use strict";

    /**
     Custom xeoEngine component that represents a BIMSurfer model within a xeoEngine scene.

     @class BIMModel
     @module XEO
     @constructor
     @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
     @param [cfg] {*} Configs
     @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
     @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this XEO.BIMModel.
     @extends Component
     */
    XEO.BIMModel = XEO.Component.extend({

        // JavaScript class name for this XEO.BIMModel.
        type: "XEO.BIMModel",

        // Constructor
        _init: function (cfg) {
            this.collection = this.create(XEO.Collection, { // http://xeoengine.org/docs/classes/Collection.html
            });
        },

        // Adds a BIMObject to this BIMModel
        addObject: function (object) {
            this.collection.add(object);
        }
    });
});
