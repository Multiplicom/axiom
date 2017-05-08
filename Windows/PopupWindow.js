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
         * Module encapsulating a class that creates a popup window in the web application's client area
         * @type {{}}
         */
        var Module = {};

        /**
         * Size of the resizing grip
         * @type {number}
         */
        Module.gripSize = 6;

        /**
         * Overlap between the sizing grip and the popup border
         * @type {number}
         */
        Module.gripOverlap = 2;

        /**
         * Length of the resizing corner grips
         * @type {number}
         */
        Module.gripCornerLength = 35;

        /**
         * Heigth of the popup header
         * @type {number}
         */
        Module.headerHeight = 36;


        /**
         * A list of all currently active windows
         * @type {Array}
         * @private
         */
        Module._activeWindows = [];


        /**
         * Returns a list of all active windows
         * @returns {Array}
         */
        Module.getActiveWindowList = function() {
            return Module._activeWindows;
        };

        Msg.listen('', 'MsgBrowserResized', function(ev) {
            $.each(Module._activeWindows, function(idx, window) {
                window.autoCorrectAfterSize(ev);
            });
        });

        /**
         * Closes all active popups
         */
        Module.closeAll = function() {
            var activeWindows = [];
            $.each(Module._activeWindows, function(idx, win) {
                activeWindows.push(win);
            });
            for (var i=activeWindows.length-1; i>=0; i--)
                activeWindows[i].close();
        };

        Module.docker = null;

        /**
         * Creates a new popup window
         * @param {Object} settings - Object containing the settings defining the properties of the popup
         * @param {string} settings.title - title of the popup
         * @param {string} settings.headerIcon - icon name displayed in the header
         * @param {int} settings.sizeX - default X size of the popup
         * @param {int} settings.sizeY - default Y size of the popup
         * @param {string} settings.helpID - doc id of the help text
         * @param {boolean} settings.closeOnEscape - if true, pressing the escape button closes the popup
         * @param {boolean} settings.blocking - if true, the popup blocks the content behind (= becomes inaccessible to the user, default using a semi-transparent overlay as visual hint)
         * @param {boolean} settings.blockingTransparent - if true, the blocking does not result in any visual indication
         * @param {boolean} settings.blockingOpaque - if true, the blocking renders the background completely invisible
         * @param {boolean} settings.autoCenter - if true, popup is automatically centered on the browser client area
         * @param {boolean} settings.autoCenterTop - if true, the popup is automatically horizontally centered on the browser client area, and appears on the top edge
         * @param {boolean} settings.preventClose - if true, the uer cannot close the popup
         * @returns {PopupWindow} - popup window class instance
         */
        Module.create = function(settings) {
            var window = { _id: AXMUtils.getUniqueID()};
            window.zIndex = AXMUtils.getNextZIndex();
            window._title = settings.title||'';
            window._headerIcon = settings.headerIcon||null;
            window._minSizeX = 150;
            window._minSizeY = 100;
            window._defaultSizeX = settings.sizeX||500;
            window._defaultSizeY = settings.sizeY||300;
            window._rootFrame = null; // by default, does not have a frame
            window._rootControl = null;
            window.resizable = false;
            window._blocking = settings.blocking||false;
            window._closeOnEscape = settings.closeOnEscape||false;
            window._transpBlocking = settings.blockingTransparent||false;
            window._opaqueBlocking = settings.blockingOpaque||false;
            window._autoCenter = settings.autoCenter||false;
            window._autoCenterTop = settings.autoCenterTop||false;
            window._autoCenterBottom = settings.autoCenterBottom||false;
            window._canClose = !(settings.preventClose);
            window._helpID = settings.helpID;
            window._canDock = settings.canDock||false;
            window._fadeTime = 250;
            window.overflowAllowed = settings.overflowAllowed || false;

            window._listeners = [];


            window.setHeaderInfo = function(headerInfo) {
                window._headerInfo = headerInfo;
                window._title = headerInfo.getSingleTitle();
                window._headerIcon = headerInfo.getIcon().clone();
                window._headerIcon.setSize(1.5);
            };

            window.getHeaderInfo = function() {
                if (window._headerInfo)
                    return window._headerInfo;
                else
                    return Icon.createHeaderInfo(Icon.createEmpty(), window._title, "");
            };

            /**
             * Returns the title of the popup
             * @returns {string}
             */
            window.getTitle = function() {
                return window._title;
            };


            /**
             * Modifies the title of the popup (can be called when the popup is rendered)
             * @param {string} newTitle
             */
            window.modifyTitle = function(newTitle) {
                window._title = newTitle;
                window._$ElContainer.find('.PopupHeaderTitleText').html(newTitle);
            };

            /**
             * Defines the root frame to be displayed in the popup (popup will be window style, containing frames and will be resizeable)
             * @param {AXM.Frame} iFrame
             */
            window.setRootFrame = function(iFrame) {
                window._rootFrame = iFrame;
                iFrame.__parentWindow = window;
                window.resizable = true;
            };


            /**
             * Returns the root frame of the popup (throws an error if not present)
             * @returns {AXM.Frame}
             */
            window.getRootFrame = function() {
                if (!window._rootFrame)
                    AXMUtils.reportBug('Popup does not have a root frame');
                return window._rootFrame;
            };


            /**
             * Defines the root control to be displayed in the popup (popup will be dialog style, containing controls and will not be resizeable)
             * @param iControl
             */
            window.setRootControl = function(iControl) {
                window._rootControl = iControl;
            };


            /**
             * Defines a handler function called when the user pressed enter in the popup
             * @param {function} hnd
             */
            window.setHandler_OnPressedEnter = function(hnd) {
                window._onPressedEnter = hnd;
            };


            /**
             * Starts the popup, making it visible in the application
             */
            window.start = function() {

                if (window._blocking) {
                    var blockerid = 'blocker_'+window._id;
                    var background = DOM.Div({id:blockerid});
                    background.addCssClass('AXMBlockingBackGround');
                    if (window._transpBlocking)
                        background.addCssClass('AXMBlockingBackGroundTransp');
                    if (window._opaqueBlocking)
                        background.addCssClass('AXMBlockingBackGroundOpaque');
                    background.addStyle('z-index', window.zIndex-1);
                    $('.AXMContainer').append(background.toString());
                    var blockerEl = $('#'+blockerid);
                    blockerEl.mousedown(function (ev) {
                        if (true/*ev.target.id == 'BlockingBackGround'*/) {
                            var blockCol = blockerEl.css('background-color');
                            blockerEl.css('background-color', 'rgba(100,100,100,0.6)');
                            setTimeout(function () {
                                blockerEl.css('background-color', blockCol);
                                setTimeout(function () {
                                    blockerEl.css('background-color', 'rgba(100,100,100,0.6)');
                                    setTimeout(function () {
                                        blockerEl.css('background-color', blockCol);
                                    }, 150);
                                }, 150);
                            }, 150);
                        }
                    });
                }

                if (window._blocking || window._closeOnEscape) {
                    AXMUtils.addKeyDownHandler(window._onKeyDown);
                }

                var rootDiv = DOM.Div({id: window._id});
                rootDiv.addStyle('z-index', window.zIndex);
                rootDiv.addCssClass('AXMPopupWindowContainer');
                rootDiv.addStyle('opacity', 0);
                if (window.overflowAllowed){
                    rootDiv.addStyle('overflow', 'visible');
                }

                var browserSize = AXMUtils.getBrowserSize();

                if (window.resizable)
                    rootDiv.addStyle('width', Math.min(browserSize.sizeX, window._defaultSizeX)+'px').addStyle('height', Math.min(browserSize.sizeY, window._defaultSizeY)+'px');

                if (window._title) {
                    var headerDiv = DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowHeader');
                    if (window._headerIcon) {
                        if (AXMUtils.isObjectType(window._headerIcon, 'icon')) {
                            var iconDiv = DOM.Div({parent:headerDiv});
                            iconDiv.addCssClass("AXMPopupHeaderIcon");
                            iconDiv.addElem(window._headerIcon.renderHtml());
                        } else {
                            var str = '<div style="display: inline-block; padding-top:4px;padding-right:16px;vertical-align: top"><i class="AXMPopupHeaderIcon fa {icon}" style=""></i></div>'.AXMInterpolate({icon:window._headerIcon});
                            headerDiv.addElem(str);
                        }
                    }
                    headerDiv.addElem('<div style="display: inline-block;margin-right:70px;overflow-x: hidden;text-overflow: ellipsis; vertical-align: middle" class="PopupHeaderTitleText">' + window._title + '</div>');
                }

                var transfer$Elem = null;
                var divClient = DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowClient');
                if (window._rootFrame) {
                    if (window._rootFrame.getRoot$El().length>0) { // frame already present and rendered - we move it
                        transfer$Elem = window._rootFrame.getRoot$El();
                    }
                    else
                        divClient.addElem(window._rootFrame.createHtml());
                }
                if (window._rootControl)
                    divClient.addElem(window._rootControl.createHtml());

                if (window.resizable) {
                    divClient.addStyle('position', 'absolute');

                    DOM.Div({parent: rootDiv, id: 'GripN'}).addCssClass('AXMPopupWindowGripN');
                    DOM.Div({parent: rootDiv, id: 'GripE'}).addCssClass('AXMPopupWindowGripE');
                    DOM.Div({parent: rootDiv, id: 'GripS'}).addCssClass('AXMPopupWindowGripS');
                    DOM.Div({parent: rootDiv, id: 'GripW'}).addCssClass('AXMPopupWindowGripW');

                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripNW GripNW1');
                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripNW GripNW2');

                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripNE GripNE1');
                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripNE GripNE2');

                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripSE GripSE1');
                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripSE GripSE2');

                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripSW GripSW1');
                    DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowGripSW GripSW2');
                }

                if (window._helpID)
                    rootDiv.addElem('<div class="SWXPopupWindowHelpBox"><i class="fa fa-question"></i></div>');

                if (window._canClose)
                    rootDiv.addElem('<span class="SWXPopupWindowCloseBox"><i class="fa fa-times-circle"></i></span>');

                if (Module.docker && window._canDock)
                    rootDiv.addElem('<span class="SWXPopupWindowDockBox"><i class="fa fa-arrow-circle-left"></i></span>');

                $('.AXMContainer').append(rootDiv.toString());
                window._$ElContainer = $('#' + window._id);


                if (transfer$Elem) {
                    window._$ElContainer.children('.AXMPopupWindowClient').append(transfer$Elem.detach());
                }

                if (window._autoCenter || window._autoCenterTop || window._autoCenterbottom) {
                    var windowSizeX = window._$ElContainer.width();
                    window._$ElContainer
                        .css('top', 4)
                        .css('left', Math.max(0, (browserSize.sizeX-windowSizeX)/2));
                }

                if (window._autoCenterbottom)
                    window._$ElContainer
                        .css('bottom', 4);

                if (window._autoCenter) {
                    // var windowSizeY = window._$ElContainer.height();
                    window._$ElContainer
                        .css('top', 50 + '%')
                        .css('left', 50 + '%')
                        .css('margin-right', -50 + '%')
                        .css('transform', 'translate(-50%, -50%)');
                }

                if (window._rootFrame) {
                    if (!transfer$Elem)
                        window._rootFrame.attachEventHandlers();
                }
                if (window._rootControl)
                    window._rootControl.attachEventHandlers();

                if (window.resizable) {
                    window.onResize({
                        resizing: false
                    });
                    window.autoCorrectAfterSize();
                }

                if (window._helpID)
                    window._$ElContainer.find('.SWXPopupWindowHelpBox').click(function() {
                        require('AXM/Windows/DocViewer').create(window._helpID);
                    });

                if (window._canClose)
                    window._$ElContainer.find('.SWXPopupWindowCloseBox').click(function() {
                        window.close();
                    });

                window._$ElContainer.find('.SWXPopupWindowDockBox').click(function() {
                    Module.docker(window);
                });

                window._installMoveHandler();
                window._installResizeHandlers();
                Module._activeWindows.push(window);

                window._$ElContainer.fadeTo(window._fadeTime,1);

                if (window._blocking && !window._transpBlocking && !window._opaqueBlocking)
                    $('#blocker_'+window._id).fadeTo(window._fadeTime,0.5);
            };


            window.get$El = function() {
                if (!window._$ElContainer)
                    AXMUtils.reportBug("Popup is not yet started");
                return window._$ElContainer;
            };

            /**
             * Handles the html on key down event
             * @param ev
             * @private
             */
            window._onKeyDown = function(ev) {
                if (ev.isEscape && (window._canClose))
                    window.close();
                if (ev.isEnter && (window._onPressedEnter))
                    window._onPressedEnter();
            };


            /**
             * Helper function registering handlers for moving
             * @private
             */
            window._installMoveHandler = function() {
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowHeader'),
                    function() {            // initialise
                        window.bringToTop();
                        window._tmpBrowserSize = AXMUtils.getBrowserSize();
                        window._moveX0 = window._$ElContainer.position().left;
                        window._moveY0 = window._$ElContainer.position().top;
                        window._tmpWindowSize = {
                            sizeX: window._$ElContainer.width(),
                            sizeY: window._$ElContainer.height()
                        };
                    },
                    function(data) {        // move
                        var newPosX = window._moveX0 + data.diffTotalX;
                        var newPosY = window._moveY0 + data.diffTotalY;
                        newPosX = Math.min(newPosX, window._tmpBrowserSize.sizeX-window._tmpWindowSize.sizeX-3);
                        newPosY = Math.min(newPosY, window._tmpBrowserSize.sizeY-40/*window._tmpWindowSize.sizeY-3*/);
                        newPosX = Math.max(0,newPosX);
                        newPosY = Math.max(0,newPosY);
                        window._$ElContainer
                            .css('left', newPosX)
                            .css('top', newPosY);
                    },
                    function() {            // finalise

                    }
                );
            };


            /**
             * Helper function registering handlers for resizing
             * @private
             */
            window._installResizeHandlers = function() {

                var initialiseResize = function() {
                    window.bringToTop();
                    window._tmpBrowserSize = AXMUtils.getBrowserSize();
                    window._resizeX0 = window._$ElContainer.position().left;
                    window._resizeY0 = window._$ElContainer.position().top;
                    window._resizeW0 = window._$ElContainer.width();
                    window._resizeH0 = window._$ElContainer.height();
                    window._oldBoxShadow = window._$ElContainer.css('box-shadow');
                    window._$ElContainer.css('box-shadow', 'none');
                };

                var executeResize = function(resizeLeftX, resizeTopY, diffSizeX, diffSizeY) {

                    var correctDifference = function(diffSize, origSize, minSize, offset, maxTotSize, resizeLeft) {
                        if (!resizeLeft)
                            diffSize = Math.min(diffSize, maxTotSize-offset-origSize-3);
                        else
                            diffSize = Math.min(diffSize, offset);
                        diffSize = Math.max(diffSize, minSize-origSize);
                        return diffSize;
                    };

                    diffSizeX = correctDifference(diffSizeX, window._resizeW0, window._minSizeX, window._resizeX0, window._tmpBrowserSize.sizeX, resizeLeftX);
                    if (resizeLeftX)
                        window._$ElContainer.css('left', window._resizeX0 - diffSizeX);
                    window._$ElContainer.width(window._resizeW0+diffSizeX);

                    diffSizeY = correctDifference(diffSizeY, window._resizeH0, window._minSizeY, window._resizeY0, window._tmpBrowserSize.sizeY, resizeTopY);
                    if (resizeTopY)
                        window._$ElContainer.css('top', window._resizeY0 - diffSizeY);
                    window._$ElContainer.height(window._resizeH0+diffSizeY);
                    window.onResize({
                        resizing: true
                    });
                };

                var finaliseResize = function(newSizeX, newSizeY) {
                    window._$ElContainer.css('box-shadow', window._oldBoxShadow);
                    window.onResize({
                        resizing: false
                    });
                };

                //------N-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripN'),
                    initialiseResize,
                    function(data) { executeResize(false, true, 0, -data.diffTotalY); },
                    finaliseResize
                );

                //------E-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripE'),
                    initialiseResize,
                    function(data) { executeResize(false, false, data.diffTotalX, 0); },
                    finaliseResize
                );

                //------S-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripS'),
                    initialiseResize,
                    function(data) { executeResize(false, false, 0, data.diffTotalY); },
                    finaliseResize
                );

                //------W-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripW'),
                    initialiseResize,
                    function(data) { executeResize(true, false, -data.diffTotalX, 0); },
                    finaliseResize
                );


                //------NW-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripNW'),
                    initialiseResize,
                    function(data) { executeResize(true, true, -data.diffTotalX, -data.diffTotalY); },
                    finaliseResize
                );

                //------NE-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripNE'),
                    initialiseResize,
                    function(data) { executeResize(false, true, data.diffTotalX, -data.diffTotalY); },
                    finaliseResize
                );

                //------SE-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripSE'),
                    initialiseResize,
                    function(data) { executeResize(false, false, data.diffTotalX, data.diffTotalY); },
                    finaliseResize
                );

                //------SW-------
                AXMUtils.create$ElDragHandler(window._$ElContainer.find('.AXMPopupWindowGripSW'),
                    initialiseResize,
                    function(data) { executeResize(true, false, -data.diffTotalX, data.diffTotalY); },
                    finaliseResize
                );


            };


            window.bubbleMessage = function(msgId, msgContent) {
                if (msgId == "Activated")
                    window.bringToTop();
            };

            /**
             * Registers a message listening callback handler that lives as long as the popup lives
             * @param msgId
             * @param callbackFunction
             */
            window.listen = function(msgId, callbackFunction) {
                var eventid = AXMUtils.getUniqueID();
                window._listeners.push(eventid);
                Msg.listen(eventid, msgId, callbackFunction);
            };

            window._verifyCanClose = function() { return true; };

            /**
             * Sets a callback that is executed if the popup is about to close. if the callback returns false, the popup is not closed
             * @param {function} handler
             */
            window.setVerifyCanClose = function(handler) {
                window._verifyCanClose = handler;
            };


            /**
             * Closes the popup
             */
            window.close = function(doNotRemoveFrame) {
                if (!doNotRemoveFrame) {
                    if (!window._verifyCanClose())
                        return;

                    if (window._rootFrame) {
                        var closePreventReason = window._rootFrame._getAnyClosePreventReason();
                        if (closePreventReason) {
                            alert('Cannot close: '+closePreventReason);
                            return;
                        }
                        window._rootFrame.detachEventHandlers();
                        window._rootFrame.informWillClose();
                    }

                    if (window._rootControl)
                        window._rootControl.detachEventHandlers();

                }

                $.each(window._listeners, function(idx, eventid) {
                    Msg.delListener(eventid);
                });
                window._listeners = [];

                if (window._blocking) {
                    if (!window._transpBlocking && !window._opaqueBlocking)
                        $('#blocker_' + window._id).fadeTo(window._fadeTime, 0.0, function () {
                            $('#blocker_' + window._id).remove();
                        });
                    else
                        $('#blocker_' + window._id).remove();
                }

                AXMUtils.removeKeyDownHandler(window._onKeyDown);



                window._$ElContainer.fadeTo(window._fadeTime,0, function() {
                    window._$ElContainer.remove();
                    var winNr=-1;
                    $.each(Module._activeWindows, function(idx, win) {
                        if (window._id == win._id)
                            winNr = idx;
                    });
                    if (winNr>=0)
                        Module._activeWindows.splice(winNr,1);
                });

            };


            /**
             * Brings the popup to the top of the z-order of elements
             */
            window.bringToTop = function() {
                var isOnTop = true;
                $.each(Module._activeWindows, function(idx, win) {
                    if ( (window._id != win._id) && (window.zIndex <= win.zIndex) )
                        isOnTop = false;
                });
                window.zIndex = AXMUtils.getNextZIndex();
                window._$ElContainer.css('z-index',window.zIndex);
            };


            /**
             * Handles popup resizing events
             * @param params
             */
            window.onResize = function(params) {
                var sizeX = window._$ElContainer.width();
                var sizeY = window._$ElContainer.height();
                var clientSizeX = sizeX;
                var clientSizeY = sizeY-Module.headerHeight;

                window._$ElContainer.find('.AXMPopupWindowClient').css({
                    width:clientSizeX+'px',
                    height:clientSizeY+'px',
                    top:Module.headerHeight+'px'
                });

                if (window._rootFrame) {
                    window._rootFrame.setPosition(0,0,clientSizeX, clientSizeY, params);
                }

                //--------N resize grip----------
                window._$ElContainer.find('#GripN').css({
                    left: 0,
                    top: -Module.gripSize+Module.gripOverlap,
                    width:sizeX,
                    height:Module.gripSize
                });

                //--------E resize grip----------
                window._$ElContainer.find('#GripE').css({
                    left: sizeX-Module.gripOverlap,
                    top: 0,
                    width:Module.gripSize,
                    height:sizeY
                });

                //--------S resize grip----------
                window._$ElContainer.find('#GripS').css({
                    left: 0,
                    top: sizeY-Module.gripOverlap,
                    width:sizeX,
                    height:Module.gripSize
                });

                //--------W resize grip----------
                window._$ElContainer.find('#GripW').css({
                    left: -Module.gripSize+Module.gripOverlap,
                    top: 0,
                    width:Module.gripSize,
                    height:sizeY
                });


                //--------NW resize grip----------
                window._$ElContainer.find('.GripNW1').css({
                    left: -Module.gripSize+Module.gripOverlap,
                    top: -Module.gripSize+Module.gripOverlap,
                    width:Module.gripSize,
                    height:Module.gripCornerLength
                });
                window._$ElContainer.find('.GripNW2').css({
                    left: -Module.gripSize+Module.gripOverlap,
                    top: -Module.gripSize+Module.gripOverlap,
                    width:Module.gripCornerLength,
                    height:Module.gripSize
                });

                //--------NE resize grip----------
                window._$ElContainer.find('.GripNE1').css({
                    left: sizeX-Module.gripOverlap,
                    top: -Module.gripSize+Module.gripOverlap,
                    width:Module.gripSize,
                    height:Module.gripCornerLength
                });

                window._$ElContainer.find('.GripNE2').css({
                    left: sizeX-Module.gripCornerLength+Module.gripSize-Module.gripOverlap,
                    top: -Module.gripSize+Module.gripOverlap,
                    width:Module.gripCornerLength,
                    height:Module.gripSize
                });

                //--------SE resize grip----------
                window._$ElContainer.find('.GripSE1').css({
                    left: sizeX-Module.gripOverlap,
                    top: sizeY-Module.gripCornerLength+Module.gripSize-Module.gripOverlap,
                    width:Module.gripSize,
                    height:Module.gripCornerLength
                });

                window._$ElContainer.find('.GripSE2').css({
                    left: sizeX-Module.gripCornerLength+Module.gripSize-Module.gripOverlap,
                    top: sizeY-Module.gripOverlap,
                    width:Module.gripCornerLength,
                    height:Module.gripSize
                });

                //--------SW resize grip----------
                window._$ElContainer.find('.GripSW1').css({
                    left: -Module.gripSize+Module.gripOverlap,
                    top: sizeY-Module.gripCornerLength+Module.gripSize-Module.gripOverlap,
                    width:Module.gripSize,
                    height:Module.gripCornerLength
                });

                window._$ElContainer.find('.GripSW2').css({
                    left: -Module.gripSize+Module.gripOverlap,
                    top: sizeY-Module.gripOverlap,
                    width:Module.gripCornerLength,
                    height:Module.gripSize
                });

            };


            /**
             * Automatically corrects html elements after resizing
             */
            window.autoCorrectAfterSize = function() {
                if (!window.resizable)
                    return;

                var browserSize = AXMUtils.getBrowserSize();

                var correctSize = function(currentSize, minSize, currentOffset, maxTotSize) {
                    if (currentOffset+currentSize>maxTotSize) {
                        currentOffset = Math.max(0, maxTotSize-currentSize);
                        currentSize = Math.max(minSize, Math.min(currentSize, maxTotSize));
                    }
                    return {
                        size: currentSize,
                        offset: currentOffset
                    };
                };

                var offsetX = window._$ElContainer.position().left;
                var offsetY = window._$ElContainer.position().top;
                var sizeX = window._$ElContainer.width();
                var sizeY = window._$ElContainer.height();
                var correctedX = correctSize(sizeX, window._minSizeX, offsetX, browserSize.sizeX);
                var correctedY = correctSize(sizeY, window._minSizeY, offsetY, 99999/*browserSize.sizeY*/);
                window._$ElContainer
                    .css('left', correctedX.offset)
                    .css('top', correctedY.offset);
                if ( (correctedX.size!=sizeX) || (correctedY.size!=sizeY) ) {
                    window._$ElContainer.width(correctedX.size);
                    window._$ElContainer.height(correctedY.size);
                    window.onResize({});
                }
            };

            return window;
        };

        $(document).bind("mousedown.popups", function(ev) {
            if (ev.target) {
                var clicked$El = $(ev.target);
                if (clicked$El.length < 1)
                    return;
                $.each(Module._activeWindows, function(idx, window) {
                    if ((window._$ElContainer[0]==clicked$El[0]) || ($.contains(window._$ElContainer[0], clicked$El[0]))) {
                        window.bringToTop();
                    }
                });

            }

        });

        return Module;
    });
