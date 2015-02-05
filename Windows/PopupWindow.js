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
        "AXM/AXMUtils", "AXM/Msg", "AXM/DOM"],
    function (
        require, $, _,
        AXMUtils, Msg, DOM) {

        var Module = {};

        Module.gripSize = 6;
        Module.gripOverlap = 2;
        Module.gripCornerLength = 35;
        Module.headerHeight = 35;

        Module._activeWindows = [];

        Msg.listen('', 'MsgBrowserResized', function(ev) {
            $.each(Module._activeWindows, function(idx, window) {
                window.autoCorrectAfterSize(ev);
            });
        });

        Module.create = function(settings) {
            var window = { _id: AXMUtils.getUniqueID()};
            window.zIndex = AXMUtils.getNextZIndex();
            window._title = settings.title||'';
            window._minSizeX = 150;
            window._minSizeY = 100;
            window._defaultSizeX = settings.sizeX||500;
            window._defaultSizeY = settings.sizeY||300;
            window._rootFrame = null; // by default, does not have a frame
            window._rootControl = null;
            window.resizable = false;
            window._blocking = settings.blocking||false;
            window._autoCenter = settings.autoCenter||false;
            window._canClose = !(settings.preventClose);


            window.setRootFrame = function(iFrame) {
                window._rootFrame = iFrame;
                window.resizable = true;
            };

            window.setRootControl = function(iControl) {
                window._rootControl = iControl;
            };

            window.setHandler_OnPressedEnter = function(hnd) {
                window._onPressedEnter = hnd;
            };

            window.start = function() {

                if (window._blocking) {
                    var blockerid = 'blocker_'+window._id;
                    var background = DOM.Div({id:blockerid});
                    background.addCssClass('AXMBlockingBackGround');
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
                    AXMUtils.addKeyDownHandler(window._onKeyDown);
                }

                var rootDiv = DOM.Div({id: window._id});
                rootDiv.addStyle('z-index', window.zIndex);
                rootDiv.addCssClass('AXMPopupWindowContainer');

                if (window.resizable)
                    rootDiv.addStyle('width', window._defaultSizeX+'px').addStyle('height', window._defaultSizeY+'px');

                headerDiv = DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowHeader').addElem(window._title);

                var divClient = DOM.Div({parent: rootDiv}).addCssClass('AXMPopupWindowClient');
                if (window._rootFrame)
                    divClient.addElem(window._rootFrame.createHtml());
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

                if (window._canClose)
                    rootDiv.addElem('<img class="SWXPopupWindowCloseBox" src="{bitmap}">'.AXMInterpolate({bitmap:AXMUtils.BmpFile('close')}));

                $('.AXMContainer').append(rootDiv.toString());
                window._$ElContainer = $('#' + window._id);

                if (window._autoCenter) {
                    var browserSize = AXMUtils.getBrowserSize();
                    var windowSizeX = window._$ElContainer.width();
                    var windowSizeY = window._$ElContainer.height();
                    window._$ElContainer
                        .css('left', (browserSize.sizeX-windowSizeX)/2)
                        .css('top', (browserSize.sizeY-windowSizeY)/2);
                }

                if (window._rootFrame)
                    window._rootFrame.attachEventHandlers();
                if (window._rootControl)
                    window._rootControl.attachEventHandlers();

                if (window.resizable) {
                    window.onResize({
                        resizing: false
                    });
                    window.autoCorrectAfterSize();
                }

                if (window._canClose)
                    window._$ElContainer.find('.SWXPopupWindowCloseBox').click(window.close);


                window._installMoveHandler();
                window._installResizeHandlers();
                Module._activeWindows.push(window);
            };

            window._onKeyDown = function(ev) {
                if (ev.isEscape && (window._canClose))
                    window.close();
                if (ev.isEnter && (window._onPressedEnter))
                    window._onPressedEnter();
            };


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
                        }
                    },
                    function(data) {        // move
                        var newPosX = window._moveX0 + data.diffTotalX;
                        var newPosY = window._moveY0 + data.diffTotalY;
                        newPosX = Math.min(newPosX, window._tmpBrowserSize.sizeX-window._tmpWindowSize.sizeX-3)
                        newPosY = Math.min(newPosY, window._tmpBrowserSize.sizeY-window._tmpWindowSize.sizeY-3)
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
                    }

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

            window.close = function() {
                $('#blocker_'+window._id).remove();
                AXMUtils.removeKeyDownHandler(window._onKeyDown);

                window._$ElContainer.remove();
                var winNr=-1;
                $.each(Module._activeWindows, function(idx, win) {
                    if (window._id == win._id)
                        winNr = idx;
                });
                if (winNr>=0)
                    Module._activeWindows.splice(winNr,1);

            };


            window.bringToTop = function() {
                window._$ElContainer.css('z-index',AXMUtils.getNextZIndex());
            };


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
                var correctedY = correctSize(sizeY, window._minSizeY, offsetY, browserSize.sizeY);
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

        return Module;
    });

