//Copyright (c) 2015 Multiplicom NV
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software
//and associated documentation files (the "Software"), to deal in the Software without restriction,
//including without limitation the rights to use, copy, modify, merge, publish, distribute,
//sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
//is furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
//PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
//ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

define([
        "require", "jquery", "_",
        "AXM/AXMUtils", "AXM/DOM", "AXM/Msg"],
    function (
        require, $, _,
        AXMUtils, DOM, Msg) {


        /**
         * Module encapsulating a base class for a panel. a panel is a client area containing a specific type of content (e.g. a table view)
         * @type {{}}
         */
        var Module = {};


        /**
         * Implements a base class for a panel. a panel is a client area containing a specific type of content (e.g. a table view)
         * @param {string} typeId - identifier of the type of panel
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.create = function(typeId) {
            var panel = AXMUtils.object('@Panel');
            panel._id = AXMUtils.getUniqueID();
            panel._typeId = typeId;
            panel._tearDownHanders = [];//List of functions that will be called when the frame isa about to be removed
            panel._listeners = [];

            /**
             * Defines the parent frame containing this panel
             * @param {Object} iFrame - parent frame
             * @private
             */
            panel._setFrame = function(iFrame) {
                AXMUtils.Test.checkIsType(iFrame, '@Frame');
                panel._frame = iFrame;
            };


            /**
             * Returns the unique identifier of this panel
             * @returns {string}
             */
            panel.getId = function() {
                return panel._id;
            };

            /**
             * Returns the identifier of the panel type
             * @returns {string}
             */
            panel.getTypeId = function() {
                return panel._typeId;
            };


            /**
             * Adds a new function that will be called when the frame is about to be removed
             * @param func
             */
            panel.addTearDownHandler = function(func) {
                panel._tearDownHanders.push(func);
            };

            /**
             * Registers a message listening callback handler that lives as long as the popup lives
             * @param msgId
             * @param callbackFunction
             */
            panel.listen = function(msgId, callbackFunction) {
                var eventid = AXMUtils.getUniqueID();
                panel._listeners.push(eventid);
                Msg.listen(eventid, msgId, callbackFunction);
            };


            /**
             * Returns the html implementing the panel (implemented in derived classes)
             * @returns {string}
             */
            panel.createHtml = function() {
                return '';
            };


            /**
             * Resizes the panel (implemented in derived classes)
             * @param {int} xl - new x dimension
             * @param {int} yl - new y dimension
             */
            panel.resize = function(xl, yl) {
            };


            panel._tearDown = function() {
                $.each(panel._listeners, function(idx, eventid) {
                    Msg.delListener(eventid);
                });
                panel._listeners = [];
                $.each(panel._tearDownHanders, function(idx, handler) {
                    handler();
                }) ;
                panel._tearDownHanders = [];
            };

            return panel;
        };

        return Module;
    });

