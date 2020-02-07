define(["require", "_", "AXM/AXMUtils"], function(require) {
    "use strict";
    var _ = require("_");
    var Utils = require("AXM/AXMUtils");

    /**
     * Constructor function for Control
     */
    function Control() {
        // Mixin properties from Utils.object for Axiom
        _.assign(this, Utils.object("@Control"));
        this._id = "CT" + Utils.getUniqueID();
        this._hasDefaultFocus = false;
        this._notificationHandlers = [];
    }

    Control.prototype._getSubId = function(extension) {
        return this._id + extension;
    };

    /**
     * Returns a jQuery element of a subcomponent
     * @param {string} extension - subcomponent id
     * @returns {jQuer-HTMLElement}
     * @private
     */
    Control.prototype._getSub$El = function(extension) {
        return $("#" + this._getSubId(extension));
    };

    /**
     * Adds a handler function that is called when the status of the control changes
     * @param {function} handlerFunc - callback
     * @returns {Object} - self
     */
    Control.prototype.addNotificationHandler = function(handlerFunc) {
        if (!handlerFunc) debugger;
        this._notificationHandlers.push(handlerFunc);
        return this;
    };

    /**
     * Call this function to assign default focus to the control upon initialisation
     * @returns {Object} - self
     */
    Control.prototype.setHasDefaultFocus = function() {
        this._hasDefaultFocus = true;
        return this;
    };

    /**
     * Empty base class function
     */
    Control.prototype.attachEventHandlers = function() {};

    /**
     * Empty base class function
     */
    Control.prototype.detachEventHandlers = function() {};

    /**
     * Notifies all notification handlers
     * @param {{}} msg - (optional) notification message
     */
    Control.prototype.performNotify = function(msg) {
        $.each(this._notificationHandlers, function(idx, fnc) {
            if (fnc) {
                fnc(msg);
            }
        });
    };

    /**
     * Called by the framework when a control needs to be teared down. To be implemented in derived classes
     */
    Control.prototype.tearDown = function() {};

    return Control;
});
