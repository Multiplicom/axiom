define(["require", "_", "AXM/AXMUtils"], function(require) {
    "use strict";
    var _ = require("_");
    var Utils = require("AXM/AXMUtils");

    const {Component} = require("../Component");

    /**
     * Constructor function for Control
     */
    class Control extends Component {
        constructor(props, children) {
            super(props, children);

            // Mixin properties from Utils.object for Axiom
            _.assign(this, Utils.object("@Control"));
            this._id = "CT" + Utils.getUniqueID();
            this._hasDefaultFocus = false;
            this._notificationHandlers = [];
        }

        _getSubId(extension) {
            return this._id + extension;
        }

        /**
         * Returns a jQuery element of a subcomponent
         * @param {string} extension - subcomponent id
         * @returns {jQuer-HTMLElement}
         * @private
         */
        _getSub$El(extension) {
            return $("#" + this._getSubId(extension));
        }
        /**
         * Adds a handler function that is called when the status of the control changes
         * @param {function} handlerFunc - callback
         * @returns {Object} - self
         */
        addNotificationHandler(handlerFunc) {
            if (!handlerFunc)
                debugger;
            this._notificationHandlers.push(handlerFunc);
            return this;
        }
        /**
         * Call this function to assign default focus to the control upon initialisation
         * @returns {Object} - self
         */
        setHasDefaultFocus() {
            this._hasDefaultFocus = true;
            return this;
        }
        /**
         * Empty base class function
         */
        attachEventHandlers() { }
        /**
         * Empty base class function
         */
        detachEventHandlers() { }
        /**
         * Notifies all notification handlers
         * @param {{}} msg - (optional) notification message
         */
        performNotify(msg) {
            $.each(this._notificationHandlers, function (idx, fnc) {
                if (fnc) {
                    fnc(msg);
                }
            });
        }
        /**
         * Called by the framework when a control needs to be teared down. To be implemented in derived classes
         */
        tearDown() { }
    }

    return Control;
});
