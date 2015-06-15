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

        var Module = {};

        Module.create = function(id, settings) {
            var panel = PanelBase.create(id);
            panel._rootControl = null;
            panel._scrollY = false;
            panel._scrollX = false;
            if (settings) {
                panel._autoScrollY = settings.autoScrollY;
                panel._scrollY = settings.scrollY;
                panel._scrollX = settings.scrollX;
            }


            panel.setRootControl = function(ctrl) {
                AXMUtils.Test.checkIsType(ctrl, '@Control');
                panel._rootControl = ctrl;
            };

            panel.createHtml = function() {
                var rootDiv = DOM.Div({id: 'frm' + panel._id});
                rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', '100%');
                rootDiv.addStyle('overflow-y', (panel._scrollY)?'scroll':'hidden');
                rootDiv.addStyle('overflow-x', (panel._scrollX)?'scroll':'hidden');
                if (panel._autoScrollY)
                    rootDiv.addStyle('overflow-y', 'auto');
                if (panel._rootControl)
                    rootDiv.addElem(panel._rootControl.createHtml());
                return rootDiv.toString();
            };

            panel.attachEventHandlers = function() {
                if (panel._rootControl)
                    return panel._rootControl.attachEventHandlers();
            };

            panel.reCreate = function() {
                if (panel._rootControl)
                    $('#frm'+panel._id).html(panel._rootControl.createHtml());
                panel.attachEventHandlers();
            };


            panel.resize = function(xl, yl) {
            };

            return panel;
        } ;

        return Module;
    });

