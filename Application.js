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
        "AXM/AXMUtils", "AXM/Test", "AXM/Windows/RootWindow", "AXM/Msg", "AXM/Color"
    ],
    function (
        require, $, _,
        AXMUtils, Test, RootWindow, Msg, Color
    ) {


        /**
         * A global object containing some basic styling data such as colours
         */
        AXMBaseStyling = {
            color1: Color.Color(0, 138/255.0, 150/255.0)
        };

        /**
         * Module encapsulating the one and only global application object
         * @type {{}}
         */
        var Module = {};

        /**
         * The one and only global application object
         * @type {{}}
         */
        var theApp = {};

        /**
         * Sets the one and only root frame for the app window
         * @param {AXM.Panels.Frame} iRootFrame - frame object
         */
        theApp.setRootFrame = function(iRootFrame) {
            Test.checkIsType(iRootFrame, "@Frame");
            theApp._rootFrame = iRootFrame;
        };


        /**
         * Returns the one and only application root frame
         * @returns {AXM.Panels.Frame}
         */
        theApp.getRootFrame = function() {
            return theApp._rootFrame;
        };


        /**
         * Handles the html event associated with closing the app
         * @param ev
         * @returns {*}
         */
        theApp.confirmExit = function(ev) {
            var confirmMessage = null;
            var results = Msg.broadcast('ConfirmExit');
            $.each(results, function(idx, msg) {
                if (msg)
                    confirmMessage = msg;
            });
            if (confirmMessage)
                return confirmMessage;
            else {
                Msg.broadcast('ExecuteExit');
                theApp._rootFrame.detachEventHandlers();
                theApp._rootFrame.informWillClose();
            }
        };

        /**
         * Initialises the app
         */
        theApp.init = function() {
            Test.checkDefined(theApp._rootFrame, "No root frame defined. Call Application.setRootFrame first.");
            theApp._rootWindow = RootWindow.create(theApp._rootFrame);
            theApp._rootWindow.render();

            window.onbeforeunload = theApp.confirmExit;

            //Prevent drag & drop to app area
            window.addEventListener("dragover",function(e){
                e = e || event;
                e.preventDefault();
            },false);
            window.addEventListener("drop",function(e){
                e = e || event;
                e.preventDefault();
            },false);

            //$(document).mouseup(function(e) {
            //    console.log("mouseup");
            //    //var container = $("YOUR CONTAINER SELECTOR");
            //    //
            //    //if (!container.is(e.target) // if the target of the click isn't the container...
            //    //    && container.has(e.target).length === 0) // ... nor a descendant of the container
            //    //{
            //    //    container.hide();
            //    //}
            //});

        };

        /**
         * Returns the one and only app instance
         * @returns {{}}
         */
        Module.get = function() {
            return theApp;
        };

        return Module;
    });

