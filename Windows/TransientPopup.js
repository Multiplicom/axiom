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
        "AXM/AXMUtils", "AXM/Msg", "AXM/DOM", "AXM/Icon"],
    function (
        require, $, _,
        AXMUtils, Msg, DOM, Icon) {

        /**
         * Module encapsulating a class that creates a transient popup window in the web application's client area that is automatically closed when the user clicks outside of it
         * @type {{}}
         */
        var Module = {};

        Module._current = null;

        /**
         * Creates a transient popup window
         * @param {{}} settings
         * @param {{}} settings.event - (optional) mouse click event that created this popup
         * @param {{}} settings.point - (optional) {x, y} pointer position of the transient popup
         * @returns {{}} - popup window instance
         */
        Module.create = function(settings) {
            _AXM_CloseTransientPopups();
            var window = {_id: AXMUtils.getUniqueID()};
            window.zIndex = AXMUtils.getNextZIndex();
            window._tearDownHanders = [];//List of functions that will be called when the window is about to be removed

            window.offsetX = 30;
            window.offsetY = 30;
            if (settings.event) {
                window.offsetX = settings.event.pageX;
                window.offsetY = settings.event.pageY;
            }
            if (settings.point) {
                window.offsetX = settings.point.x;
                window.offsetY = settings.point.y;
            }


            /**
             * Defines the root control to be displayed in the popup
             * @param iControl
             */
            window.setRootControl = function(iControl) {
                window._rootControl = iControl;
            };

            /**
             * Adds a new function that will be called when the window is about to be removed
             * @param func
             */
            window.addTearDownHandler = function(func) {
                window._tearDownHanders.push(func);
            };

            /**
             * Starts the popup, making it visible in the application
             */
            window.start = function() {


                var rootDiv = DOM.Div({id: window._id});
                rootDiv.addStyle('z-index', window.zIndex);
                //rootDiv.addStyle('top', window.offsetY + "px");
                //rootDiv.addStyle('left', window.offsetX + "px");
                rootDiv.addCssClass('AXMTransientContainer');


                var browserSize = AXMUtils.getBrowserSize();


                var divClient = DOM.Div({parent: rootDiv}).addCssClass('AXMTransientClient');
                if (window._rootControl)
                    divClient.addElem(window._rootControl.createHtml());

                var arrow = DOM.Div({parent: rootDiv});
                arrow.addCssClass('AXMTransientContainerArrow');
                arrow.addCssClass('AXMTransientContainerArrowTop');

                divClient.addElem('<span class="SWXTransientCloseBox"><i class="fa fa-times-circle"></i></span>');


                $('.AXMContainer').append(rootDiv.toString());
                window._$ElContainer = $('#' + window._id);

                if (window._rootControl)
                    window._rootControl.attachEventHandlers();



                var windowSizeX = window._$ElContainer.width();
                var windowSizeY = window._$ElContainer.height();

                if (window.offsetX + windowSizeX < browserSize.sizeX) {
                    window._$ElContainer
                        .css('left', window.offsetX-26);
                    window._$ElContainer.find(".AXMTransientContainerArrow").css("left", 16);
                }
                else {
                    var leftX = browserSize.sizeX-windowSizeX-20;
                    window._$ElContainer
                        .css('left', leftX);
                    window._$ElContainer.find(".AXMTransientContainerArrow").css("left", window.offsetX-leftX-10);
                }


                if (window.offsetY + windowSizeY < browserSize.sizeY-10) {
                    window._$ElContainer
                        .css('top', window.offsetY + 14);
                }
                else {
                    window._$ElContainer
                        .css('top', window.offsetY - windowSizeY-14);
                    window._$ElContainer.find(".AXMTransientContainerArrow").removeClass("AXMTransientContainerArrowTop").addClass("AXMTransientContainerArrowBottom");

                }

                window._$ElContainer.find('.SWXTransientCloseBox').click(function() {
                    window.close();
                });


                $(document).bind("mouseup.transientpopup", window._onDocClicked);

            };

            window._onDocClicked = function(ev) {
                if (ev.target) {
                    var clicked$El = $(ev.target);
                    if (clicked$El.length < 1)
                        return;
                    if ((window._$ElContainer[0]!=clicked$El[0]) && (!$.contains(window._$ElContainer[0], clicked$El[0]))) {
                        window.close();
                    }

                }
            };

            window.close = function() {
                $.each(window._tearDownHanders, function(idx, handler) {
                    handler();
                }) ;
                window._tearDownHanders = [];
                if (window._rootControl)
                    window._rootControl.detachEventHandlers();
                window._$ElContainer.remove();
                $(document).unbind("mouseup.transientpopup");
                Module._current = null
            };


            Module._current = window;
            return window;
        };


        _AXM_CloseTransientPopups = function() {
            if (Module._current)
                Module._current.close();
        };

        _AXM_HasTransientPopups = function() {
            return Module._current;
        };

        return Module;
    });

