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
        "AXM/AXMUtils", "AXM/Msg", "AXM/Panels/Frame", "AXM/DOM", "AXM/Events"
    ],
    function (
        require, $, _,
        AXMUtils, Msg, Frame
    ) {
        var DOM = require("AXM/DOM"),
            EventPool = require("AXM/Events");

        /**
         * Module encapsulating the functionality for the one and only Axiom window that represents the full web app client area
         * @type {{}}
         */
        var Module = {};

        /**
         * Creates the root window
         * @param {AXM.Panels.Frame} iFrameRoot - root frame to be placed in the root window
         * @returns {{}} - root window object
         * @constructor
         */
        Module.create = function(iFrameRoot) {
            var rootWindow = {};
            rootWindow._rootFrame = iFrameRoot;

            rootWindow.render = function() {
                var rootElement = DOM.Create();
                rootElement.addElem(rootWindow._rootFrame.htmlElement());
                
                var axiomNode = document.querySelector(".AXMContainer");
                axiomNode.appendChild(rootElement.node$);
                EventPool.attach();
                
                rootWindow._rootFrame.attachEventHandlers();
                rootWindow._monitorResize();
            };


            rootWindow._prevSizeX = 0;
            rootWindow._prevSizeY = 0;
            rootWindow._monitorResize = function () {
                var myparent = $('#' + rootWindow._rootFrame.getId()).parent();
                var sizeX = myparent.innerWidth();
                var sizeY = myparent.innerHeight();
                if ((sizeX!=rootWindow._prevSizeX) || (sizeY!=rootWindow._prevSizeY)) {
                    rootWindow._doResize(sizeX, sizeY, {});
                    rootWindow._prevSizeX = sizeX;
                    rootWindow._prevSizeY = sizeY;
                    Msg.broadcast('MsgBrowserResized', {sizeX: sizeX, sizeY: sizeY})
                }
                setTimeout(rootWindow._monitorResize, 100);
            };

            rootWindow.forceResize = function() {
                var myparent = $('#' + rootWindow._rootFrame.getId()).parent();
                var sizeX = myparent.innerWidth();
                var sizeY = myparent.innerHeight();
                rootWindow._doResize(sizeX, sizeY, {});
                rootWindow._prevSizeX = sizeX;
                rootWindow._prevSizeY = sizeY;
                Msg.broadcast('MsgBrowserResized', {sizeX: sizeX, sizeY: sizeY})
            };


            rootWindow._doResize = function (sizeX, sizeY, params) {
                //var myparent = $('#' + rootWindow._rootFrame.getId()).parent();
                //var sizeX = myparent.innerWidth();
                //var sizeY = myparent.innerHeight();
                rootWindow._rootFrame.setPosition(0, 0, sizeX, sizeY, params);
            };


            return rootWindow;
        };


        return Module;
    });

