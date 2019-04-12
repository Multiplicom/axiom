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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Panels/PanelBase"],
    function (
        require, $, _,
        AXMUtils, DOM, PanelBase) {

        /**
         * Module encapsulating a panel that contains a form, containing a (set of) control(s)
        * @type {{}}
         */
        var Module = {};

        /**
         * Implements a panel that contains a form, containing a (set of) control(s)
         * @param {string} id - panel type id
         * @param {{}} settings - panel settings
         * @param {boolean} settings.scrollX - form has a horizontal scroll bar
         * @param {boolean} settings.scrollY - form has a vertical scroll bar
         * @param {boolean} settings.autoScrollY - form has an automatic vertical scroll bar
         * @param {boolean} settings.alignVerticalCenter - form components are vertically aligned
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.create = function(id, settings) {
            var panel = PanelBase.create(id);
            panel._rootControl = null;
            panel._scrollY = false;
            panel._scrollX = false;
            panel._alignVerticalCenter = false;
            if (settings) {
                panel._autoScrollX = settings.autoScrollX;
                panel._autoScrollY = settings.autoScrollY;
                panel._scrollY = settings.scrollY;
                panel._scrollX = settings.scrollX;
                panel._alignVerticalCenter = settings.alignVerticalCenter;
            }


            /**
             * Sets the single root control that appears on the form (note: this may be a compound control)
             * @param {{}} ctrl - root control
             */
            panel.setRootControl = function(ctrl) {
                AXMUtils.Test.checkIsType(ctrl, '@Control');
                panel._rootControl = ctrl;
            };


            /**
             * Returns the html implementing this panel
             * @returns {string}
             */
            panel.createHtml = function() {
                var rootDiv = DOM.Div({id: 'frm' + panel._id});
                rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', '100%');
                rootDiv.addStyle('overflow-y', (panel._scrollY)?'scroll':'hidden');
                rootDiv.addStyle('overflow-x', (panel._scrollX)?'scroll':'hidden');
                if (panel._autoScrollX)
                    rootDiv.addStyle('overflow-x', 'auto');
                if (panel._autoScrollY)
                    rootDiv.addStyle('overflow-y', 'auto');
                if (panel._rootControl)
                    rootDiv.addElem(panel._rootControl.createHtml());
                if(panel._alignVerticalCenter){
                    rootDiv.addStyle('display', 'flex');
                    rootDiv.addStyle('align-items', 'center');
                }
                return rootDiv;
            };


            /**
             * Attaches the html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function() {
                if (panel._rootControl)
                    return panel._rootControl.attachEventHandlers();
            };

            /**
             * Detaches the html event handlers
             */
            panel.detachEventHandlers = function() {
                if (panel && panel._rootControl)
                    return panel._rootControl.detachEventHandlers();
            };


            /**
             * Re-creates the html to reflect a change in the control(s)
             */
            panel.reCreate = function() {
                if (panel._rootControl)
                    $('#frm'+panel._id).html(panel._rootControl.createHtml());
                panel.attachEventHandlers();
            };


            panel.resize = function(xl, yl) {
            };

            panel.addTearDownHandler(function() {
                if (panel._rootControl)
                    panel._rootControl.tearDown();
            });

            return panel;
        } ;

        return Module;
    });

