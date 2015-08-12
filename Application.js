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
        "AXM/AXMUtils", "AXM/Test", "AXM/Windows/RootWindow", "AXM/Msg"
    ],
    function (
        require, $, _,
        AXMUtils, Test, RootWindow, Msg
    ) {

        var Module = {};

        var theApp = {};

        // Sets the one and only root frame for the app window
        theApp.setRootFrame = function(iRootFrame) {
            Test.checkIsType(iRootFrame, "@Frame");
            theApp._rootFrame = iRootFrame;
        };

        theApp.getRootFrame = function() {
            return theApp._rootFrame;
        };

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
            }
        };

        // Intialises the app
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

        }

        // Returns the one and only app instance
        Module.get = function() {
            return theApp;
        }

        return Module;
    });

