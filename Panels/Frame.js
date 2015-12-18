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
        "AXM/AXMUtils", "AXM/Controls/Controls", "AXM/Controls/Compound", "AXM/DOM", "AXM/Msg", "AXM/Panels/Sub/FrameToolBox"],
    function (
        require, $, _,
        AXMUtils, Controls, ControlsCompound, DOM, Msg, FrameToolBox) {


        /**
         * Module implementing frame classes, used to organise web application client area in smaller components
         * @type {{}}
         */
        var Module = {};

        Module.ToolBox = FrameToolBox;

        /**
         * The height of a frame title bar
         * @type {number}
         */
        Module.titleBarH = 25;

        /**
         * Index of the X dimension, used in 2D properties
         * @type {number}
         */
        Module.dimX = 0;

        /**
         * Index of the Y dimension, used in 2D properties
         * @type {number}
         */
        Module.dimY = 1;

        /**
         * Verifies that a dimension is valid. throws an exception if not
         * @param {int} dim - dimension
         */
        Module.checkValidDim = function (dim) {
            if ((dim !== Module.dimX) && (dim !== Module.dimY))
                AXMUtils.reportBug("Invalid dimension ID");
        };


        /**
         * Creates a helper class object that contains information and functionality about the range of possible sizes an object can have in a single dimension
         * @returns {Object} - object instance
         * @constructor
         */
        Module.dimSizeInfo = function() {
            var sizeInfo = AXMUtils.object('@FrameDimSizeInfo');
            sizeInfo._min = 120;
            sizeInfo._max = 999999;
            sizeInfo._autoSize = false;

            /**
             * Sets the minimum size
             * @param {int} sz
             * @returns {Object} - self
             */
            sizeInfo.setMinSize = function (sz) {
                sizeInfo._min = sz;
                return sizeInfo;
            };

            /**
             * Sets the size to be fixed
             * @param {int} sz - fixed size
             * @returns {Object} - self
             */
            sizeInfo.setFixedSize = function (sz) {
                sizeInfo._min = sz;
                sizeInfo._max = sz;
                return sizeInfo;
            };

            /**
             * Defines the size as being determined automatically
             * @returns {Object} - self
             */
            sizeInfo.setAutoSize = function () {
                sizeInfo._min = 0;
                sizeInfo._autoSize = true;
                return sizeInfo;
            };

            /**
             * Determines if the size if fixed
             * @returns {boolean}
             * @private
             */
            sizeInfo._isFixedSize = function () {
                if (sizeInfo._autoSize)
                    return true;
                return sizeInfo._max == sizeInfo._min;
            };

            /**
             * Returns the minimum size
             * @returns {int}
             * @private
             */
            sizeInfo._getMinSize = function () {
                return sizeInfo._min;
            };

            /**
             * Returns the maximum size
             * @returns {int}
             * @private
             */
            sizeInfo._getMaxSize = function () {
                return sizeInfo._max;
            };

            /**
             * Determines if the size is set to be automatic
             * @returns {boolean}
             */
            sizeInfo.isAutoSize = function() {
                return sizeInfo._autoSize;
            };

            return sizeInfo;
        };



        /**
         * Base class implementing a frame
         * @returns {Object} - frame instance
         * @constructor
         */
        Module.FrameGeneric = function () {
            var frame = AXMUtils.object("@Frame");
            frame._parentFrame = null;
            frame._id = 'FR'+AXMUtils.getUniqueID();
            frame._sizeFraction = 1;
            frame._hasTitle = false;
            frame._title = '';
            frame._sizeInfos = [Module.dimSizeInfo(), Module.dimSizeInfo()]; //allowed frame size range in X and Y dimension
            frame.splitterColor = "rgb(230,230,230)";
            frame._tearDownHanders = [];//List of functions that will be called when the frame isa about to be removed
            frame._listeners = [];
            frame._toolBox = null;

            /**
             * Returns the unique identifier of the frame
             * @returns {string}
             */
            frame.getId = function() {
                return frame._id;
            };

            /**
             * Returns the ID of the DIV containing the frame title
             * @returns {string}
             */
            frame.getTitleDivId = function() {
                return frame._id+'_title';
            };

            /**
             * Sets the relative size of the frame with respect to its siblings, used in case the frame is member of a parent frame that groups its members horizontally or vertically
             * @param {float} fr - relative size
             * @returns {Object} - self
             */
            frame.setSizeFraction = function(fr) {
                AXMUtils.Test.checkIsNumber(fr);
                frame._sizeFraction = fr;
                return frame;
            };


            /**
             * Returns the relative size of the frame with respect to its siblings, used in case the frame is member of a parent frame that groups its members horizontally or vertically
             * @returns {float}
             */
            frame.getSizeFraction = function() {
                return frame._sizeFraction;
            };


            /**
             * Sets the title of the frame
             * @param {string} iTitle
             * @returns {Object} - self
             */
            frame.setTitle = function(iTitle) {
                AXMUtils.Test.checkIsString(iTitle);
                frame._hasTitle = true;
                frame._title = iTitle;
                return frame;
            };


            /**
             * Determines if the frame has a title bar
             * @returns {boolean}
             */
            frame.hasTitleBar = function() {
                if (!frame._hasTitle)
                    return false;
                if (frame._parentFrame && frame._parentFrame.isTabber())
                    return false;
                return true;
            };


            /**
             * Returns the title of the frame
             * @returns {string}
             */
            frame.getTitle = function() {
                return frame._title;
            };


            frame.setToolBox = function(toolBox) {
                if (frame._toolBox)
                    AXMUtils.reportBug("Frame already has a toolbox");
                frame._toolBox = toolBox;
                frame._toolBox._frame= frame;
            };

            /**
             * Adds a new function that will be called when the frame is about to be removed
             * @param func
             */
            frame.addTearDownHandler = function(func) {
                frame._tearDownHanders.push(func);
            };


            /**
             * Registers a message listening callback handler that lives as long as the frame lives
             * @param msgId
             * @param callbackFunction
             */
            frame.listen = function(msgId, callbackFunction) {
                var eventid = AXMUtils.getUniqueID();
                frame._listeners.push(eventid);
                Msg.listen(eventid, msgId, callbackFunction);
            };

            /**
             * Determines if the frame is a compound frame, and groups its members as tabs (to be overriden in derived classes)
             * @returns {boolean}
             */
            frame.isTabber = function() { return false; };


            /**
             * Specifies the minimum size of the frame in a dimension
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @param {int} sze - size
             * @returns {Object} - self
             */
            frame.setMinDimSize = function (dim, sze) {
                Module.checkValidDim(dim);
                AXMUtils.Test.checkIsNumber(sze);
                frame._sizeInfos[dim].setMinSize(sze);
                return frame;
            };

            /**
             * Defines a dimension as automatically scaled
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @returns {Object} - self
             */
            frame.setAutoSize = function (dim) {
                Module.checkValidDim(dim);
                frame._sizeInfos[dim].setAutoSize();
                return frame;
            };


            /**
             * Defines a dimension as being fixed in size
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @param {int} sz - fixed size
             * @returns {Object} - self
             */
            frame.setFixedDimSize = function (dim, sz) {
                Module.checkValidDim(dim);
                AXMUtils.Test.checkIsNumber(sz);
                frame._sizeInfos[dim].setFixedSize(sz);
                return frame;
            };


            /**
             * In case the frame is scaled automatically along a dimension, returns its computed size
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @returns {int} - size
             * @private
             */
            frame._getAutoSize = function (dim) {
                Module.checkValidDim(dim);
                var sze = frame._getClientAutoSize(dim);
                return sze;
            };


            /**
             * Returns the minimum frame size along a dimension
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @returns {int} - minumum size
             * @private
             */
            frame._getMinSize = function (dim) {
                Module.checkValidDim(dim);
                if (frame._sizeInfos[dim].isAutoSize())
                    return frame._getAutoSize(dim);
                return Math.max(
                    frame._sizeInfos[dim]._getMinSize(),
                    frame._getClientMinSize(dim)
                );
            };


            /**
             * Returns the minumum size of the client area of a frame
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @returns {number} - minimum client size
             * @private
             */
            frame._getClientMinSize = function(dim) {
                return 0;
            };


            /**
             * Returns the maximum frame size along a dimension
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @returns {Number}
             * @private
             */
            frame._getMaxSize = function (dim) {
                Module.checkValidDim(dim);
                if (frame._sizeInfos[dim].isAutoSize())
                    return frame._getAutoSize(dim);
                return frame._sizeInfos[dim]._getMaxSize();
            };

            frame.getRoot$El = function() {
                return $('#'+frame._id);
            };

            /**
             * Returns the html implementing thee frame
             * @returns {string}
             */
            frame.createHtml = function() {
                var frameDiv = DOM.Div({id: frame._id});
                frameDiv.addCssClass('AXMFrame');
                if (frame.hasTitleBar())
                    DOM.Div({parent: frameDiv, id:frame.getTitleDivId()}).addCssClass('AXMFrameTitle')
                        .addElem(frame._title);
                var frameClient = DOM.Div({parent:frameDiv}).addCssClass('AXMFrameClient');
                if (frame.createHtmlClient)
                    frameClient.addElem(frame.createHtmlClient());


                return frameDiv.toString();
            };

            frame.updateHtml = function() {
                if (frame.createHtmlClient) {
                    var content = frame.createHtmlClient();
                    frame.$ElContainer.children('.AXMFrameClient').html(content);
                }
            };


            /**
             * Attached the html handlers to after DOM insertion
             */
            frame.attachEventHandlers = function(params) {
                frame.$ElContainer = $('#' + frame._id);
                if (frame._toolBox) {
                    frame._toolBox.start();
                }
            };

            /**
             * Detach the html handlers
             */
            frame.detachEventHandlers = function() {
            };

            /**
             * Automatically pdates the positioning of the frame, including the client area content
             */
            frame.updatePosition = function() {
                var _digest = function(vl) {
                    if (vl.indexOf('px', vl.length - 2) >= 0)
                        return parseInt(vl.substring(0,vl.length-2));
                    else
                        return parseInt(vl);
                };
                var x0 = _digest(frame.$ElContainer.css('left'));
                var y0 = _digest(frame.$ElContainer.css('top'));
                var xl = _digest(frame.$ElContainer.css('width'));
                var yl = _digest(frame.$ElContainer.css('height'));
                frame.setPosition(x0, y0, xl, yl, {});

            };


            /**
             * Changes the positioning of the frame
             * @param {int} x0 - left x position
             * @param {int} y0 - top y position
             * @param {int} xl - x width
             * @param {int} yl - y width
             */
            frame.setPosition = function(x0, y0, xl, yl, params) {
                AXMUtils.Test.checkIsNumber(x0, y0, xl, yl);
                frame.$ElContainer.css('left', x0 + 'px');
                frame.$ElContainer.css('top', y0 + 'px');
                frame.$ElContainer.css('width', xl + 'px');
                frame.$ElContainer.css('height', yl + 'px');
                frame._clientVOffset = 0;
                if (frame.hasTitleBar()) {
                    $('#' + frame.getTitleDivId()).outerWidth(xl).outerHeight(Module.titleBarH)
                    frame._clientVOffset += Module.titleBarH;
                }
                frame.$ElContainer.children('.AXMFrameClient').css({
                    left: '0px',
                    top: frame._clientVOffset +'px',
                    width: xl + 'px',
                    height: (yl-frame._clientVOffset) + 'px'
                });
                if (frame.setPositionClient){
                    frame.setPositionClient(xl, yl-frame._clientVOffset, params);
                    //setTimeout(function() {
                    //    frame.setPositionClient(xl, yl-frame._clientVOffset, params);
                    //}, 10);
                }
            };


            frame.bubbleMessage = function(msgId, msgContent) {
                if (frame._parentFrame)
                    frame._parentFrame.bubbleMessage(msgId, msgContent);
                else {
                    if (frame.__parentWindow)
                        frame.__parentWindow.bubbleMessage(msgId, msgContent);
                }
            };


            /**
             * Activates a specific panel in the hierarchical frame structure (used for tabbed containers). to be implemented in derived classes
             * @param panelTypeId
             * @returns {boolean}
             */
            frame.activatePanelTypeId = function(panelTypeId) {
                //in general: do nothing
                return false;
            };


            /**
             * If a frame cannot be closed, returns a reason why not. This calls getClosePreventReason for the current frame and any of its members
             * @param msg
             * @returns {string}
             * @private
             */
            frame._getAnyClosePreventReason = function(msg) {
                return frame.getClosePreventReason(msg);
            };


            /**
             * If a frame cannot be closed, returns a reason why not. override in derived classes
             * @param msg
             * @returns {string}
             */
            frame.getClosePreventReason = function(msg) {
                return null;
            };


            frame._executeTearDownHandlers = function() {
                $.each(frame._listeners, function(idx, eventid) {
                    Msg.delListener(eventid);
                });
                frame._listeners = [];
                $.each(frame._tearDownHanders, function(idx, handler) {
                    handler();
                }) ;
                frame._tearDownHanders = [];
            };


            /**
             * Call this function to inform the frame or any of its members that it will close
             * @param msg
             */
            frame.informWillClose = function(msg) {
                frame._executeTearDownHandlers();
                frame.willClose();
            };

            /**
             * Called when the frame is about to close. override in derived classes
             * @param msg
             */
            frame.willClose = function(msg) {

            };

            return frame;
        };


        /**
         * Base class implementing the behaviour of a compound frame (i.e. a frame grouping member frames)
         * @returns {Object} - object instance
         * @constructor
         */
        Module.FrameCompound = function () {
            var frame = Module.FrameGeneric();
            frame._memberFrames = [];

            /**
             * Adds a new member frame
             * @param {Module.Frame} memberFrame
             * @returns {Module.Frame} - member frame
             */
            frame.addMember = function(memberFrame) {
                AXMUtils.Test.checkIsType(memberFrame, '@Frame');
                frame._memberFrames.push(memberFrame);
                memberFrame._parentFrame = frame;
                return memberFrame;
            };

            /**
             * Returns the number of member frames
             * @returns {int}
             */
            frame.getmemberFrameCount = function() {
                return frame._memberFrames.length;
            };

            var _super_attachEventHandlers = frame.attachEventHandlers;
            /**
             * Attached the html event handlers after DOM insertion
             */
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params); // calls the implementation of the parent class
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame.attachEventHandlers(params);
                });
            };

            var _super_detachEventHandlers = frame.detachEventHandlers;
            /**
             * Detach the html event handlers
             */
            frame.detachEventHandlers = function() {
                _super_detachEventHandlers(); // calls the implementation of the parent class
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame.detachEventHandlers();
                });
            };


            /**
             * Activates an individual panel inside the hierarchical frame structure
             * @param {string} panelTypeId - ID of the panel
             * @returns {boolean} - determines whether or not the panel was found
             */
            frame.activatePanelTypeId = function(panelTypeId) {
                var found = false;
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    if (memberFrame.activatePanelTypeId(panelTypeId))
                        found = true;
                });
                return found;
            };

            frame._getAnyClosePreventReason = function(msg) {
                var rs = frame.getClosePreventReason(msg);
                if (rs)
                    return rs;
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    rs = memberFrame._getAnyClosePreventReason(msg);
                    if (rs)
                        return rs;
                });
                return null;
            };

            frame.informWillClose = function(msg) {
                frame._executeTearDownHandlers();
                if (frame._toolBox)
                    frame._toolBox.close();
                frame.willClose();
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame.informWillClose(msg);
                });
            };



            return frame;
        };


        /**
         * Implements a compound frame that organises member frame by aligning them horizontally or vertically, with splitters between them
         * @param {int} dim - splitter dimenion (can be Module.dimX or Module.dimY)
         * @returns {Object} - object instance
         * @constructor
         */
        Module.FrameSplitter = function (dim) {
            var frame = Module.FrameCompound();
            Module.checkValidDim(dim);
            frame._dim = dim;
            frame._hSplitterSize = 3;


            /**
             * Defines half the size of the splitters between the member frames
             * @param {int} hSize
             * @returns {Object} - self
             */
            frame.setHalfSplitterSize = function(hSize) {
                AXMUtils.Test.checkIsNumber(hSize);
                frame._hSplitterSize = hSize;
                return frame;
            };

            /**
             * Determines if the frame is a horizontal splitter
             * @returns {boolean}
             */
            frame.isHorSplitter = function() { return frame._dim==Module.dimX; };

            /**
             * Determines if the frame is a vertical splitter
             * @returns {boolean}
             */
            frame.isVertSplitter = function() { return frame._dim==Module.dimY; };


            /**
             * Returns the automatic size calculation of the client area in a dimension
             * @param {int} dim - dimension (can be Module.dimX or Module.dimY)
             * @returns {number} - computed automatic client size
             * @private
             */
            frame._getClientAutoSize = function(dim) {
                Module.checkValidDim(dim);
                if (dim==frame._dim) {
                    var sze = 0;
                    $.each(frame._memberFrames, function(idx, memberFrame) {
                        sze += memberFrame._getClientAutoSize(dim);
                    });
                    return sze;
                }
                else {
                    var sze = 0;
                    $.each(frame._memberFrames, function(idx, memberFrame) {
                        sze = Math.max(sze, memberFrame._getClientAutoSize(dim) );
                    });
                    return sze;
                }
            };


            /**
             * Returns the minimum size calculation of the client area in a dimension
             * @param {int} dim - dimension (can be Module.dimX or Module.dimY)
             * @returns {number} - computed minumum client size
             * @private
             */
            frame._getClientMinSize = function(dim) {
                Module.checkValidDim(dim);
                if (dim==frame._dim) {
                    var sze = 0;
                    $.each(frame._memberFrames, function(idx, memberFrame) {
                        sze += memberFrame._getMinSize(dim);
                    });
                    return sze;
                }
                else {
                    var sze = 0;
                    $.each(frame._memberFrames, function(idx, memberFrame) {
                        sze = Math.max(sze, memberFrame._getMinSize(dim) );
                    });
                    return sze;
                }
            };


            /**
             * Returns the ID of a splitter DIV
             * @param {int} sepnr - splitter index number
             * @returns {string} - ID
             */
            frame.getSplitterDivId = function(sepnr) {
                if ((sepnr<1) || (sepnr>=frame._memberFrames.length))
                    AXMUtils.reportBug('Invalid separator number');
                return 'FSP_'+frame._id+'_'+sepnr;
            };


            /**
             * Determines if a splitter is fixed or moveable by the user
             * @param {int} splitterNr - splitter index number
             * @returns {boolean}
             * @private
             */
            frame._isFixedSplitter = function(splitterNr) {
                if ((splitterNr<1) || (splitterNr>=frame._memberFrames.length))
                    AXMUtils.reportBug('Invalid separator number');
                if (frame._memberFrames[splitterNr-1]._sizeInfos[frame._dim]._isFixedSize())
                    return true;
                if (frame._memberFrames[splitterNr]._sizeInfos[frame._dim]._isFixedSize())
                    return true;
                return false;
            };


            /**
             * Returns the html of the client area
             * @returns {string}
             */
            frame.createHtmlClient = function() {
                frame._normaliseSizeFractions();
                var html = '';
                for (var fnr = 1; fnr < frame._memberFrames.length; fnr++) {
                    var splitdiv = DOM.Div({ id: frame.getSplitterDivId(fnr) });
                    splitdiv.addCssClass('AXMSplitter');
                    if (!frame._isFixedSplitter(fnr)) {
                        if (frame.isHorSplitter())
                            splitdiv.addCssClass('AXMSplitterH');
                        if (frame.isVertSplitter())
                            splitdiv.addCssClass('AXMSplitterV');
                    }
                    splitdiv.addStyle('background-color', frame.splitterColor);
                    html += splitdiv.toString();
                }
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    html += memberFrame.createHtml();
                });
                return html;
            };


            /**
             * Normalises the member frame relative sizes
             * @private
             */
            frame._normaliseSizeFractions = function() {
                var totalFraction = 0;
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    totalFraction += memberFrame.getSizeFraction();
                });
                if (totalFraction<=0)
                    AXMUtils.reportBug('Invalid splitter fractions');
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame._sizeFraction /= totalFraction;
                });
            };


            /**
             * Calculates the positions of the member frame splitters, given a total available length
             * @param {int}length
             * @returns {[int]} - positions
             */
            frame.calcSplitterPositions = function(length) {
                AXMUtils.Test.checkIsNumber(length);
                if (frame._memberFrames.length == 1) return [];
                frame._normaliseSizeFractions();
                var position = 0;
                frame.splitterPositions = [0];
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    if (idx>0)
                        frame.splitterPositions.push(position);
                    position += Math.round(memberFrame.getSizeFraction()*length);
                });
                frame.splitterPositions.push(length);
            };

            var _super_attachEventHandlers = frame.attachEventHandlers;
            /**
             * Attaches the html event handlers after DOM insertion
             */
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params);
                frame._attachEventHandlers_Splitters(params)
            };

            var _super_detachEventHandlers = frame.detachEventHandlers;
            /**
             * Detaches the html event handlers
             */
            frame.detachEventHandlers = function() {
                _super_detachEventHandlers();
                frame._detachEventHandlers_Splitters()
            };

            /**
             * Attaches the html event handlers for ths splitters after DOM insertion
             */
            frame._attachEventHandlers_Splitters = function(params) {
                var initialiseMoveSplitter = function(splitterNr, splitter$El) {
                    frame._temp_dragSplitter_splitterNr = splitterNr;
                    frame._temp_dragSplitter_splitter$El = splitter$El;
                    frame._temp_dragSplitter_origPosit = frame.splitterPositions[splitterNr];
                };
                var doMoveSplitter= function(params) {
                    var shift = frame.isHorSplitter() ? params.diffTotalX : params.diffTotalY;
                    var $ElClient = frame.$ElContainer.children('.AXMFrameClient');
                    var totsize = frame.isHorSplitter() ? $ElClient.width() : $ElClient.height();
                    frame._calculateNewFrameSizeFractions(frame._temp_dragSplitter_splitterNr, frame._temp_dragSplitter_origPosit+shift, totsize);
                    frame._setPositionSubframes({resizing: true});
                };
                var finaliseMoveSplitter= function() {
                    frame._setPositionSubframes({resizing: false});
                };

                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    if ( (fnr > 0) && (!frame._isFixedSplitter(fnr)) ) {
                        var splitter$El = $('#'+frame.getSplitterDivId(fnr));
                        AXMUtils.create$ElDragHandler(splitter$El,
                            function() { initialiseMoveSplitter(fnr,splitter$El); },
                            doMoveSplitter,
                            finaliseMoveSplitter
                        );
                    }
                });

            };

            /**
             * Detaches the html event handlers
             */
            frame._detachEventHandlers_Splitters = function() {
                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    if ( (fnr > 0) && (!frame._isFixedSplitter(fnr)) ) {
                        var splitter$El = $('#'+frame.getSplitterDivId(fnr));
                        AXMUtils.remove$ElDragHandler(splitter$El);
                    }
                });

            };


            /**
             * Calculates the new member frame relative sizes after a splitter position was moved by the user
             * @param {int} splitterNr - moved splitter index
             * @param {int} newPos - new position of the splitter
             * @param {int} totSize - total available size
             * @private
             */
            frame._calculateNewFrameSizeFractions = function(splitterNr, newPos, totSize) {
                var posits = [0];
                var ps = 0;
                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    ps += memberFrame._sizeFraction * totSize;
                    posits.push(ps);
                });
                posits.push(totSize);
                posits[splitterNr] = Math.min(posits[splitterNr+1]-1, Math.max(posits[splitterNr-1]+1, newPos));
                var prevposit = 0;
                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    memberFrame._sizeFraction = Math.max(1.0e-9, (posits[fnr+1] - prevposit) / totSize);
                    prevposit = posits[fnr+1];
                });
                frame._adjustFrameSizeFractions(totSize);
            };


            /**
             * Adjusts the relative sizes of the member frames according to a new total available size
             * @param {int} totSize - available size
             * @private
             */
            frame._adjustFrameSizeFractions = function(totSize) {
                var widths = [];
                var widths_min = [];
                var widths_max = [];
                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    widths.push(memberFrame._sizeFraction * totSize);
                    widths_min.push(memberFrame._getMinSize(frame._dim));
                    widths_max.push(memberFrame._getMaxSize(frame._dim));
                });

                var modif = true;
                for (var iter = 0; (iter < 5) && modif; iter++) {
                    modif = false;
                    $.each(frame._memberFrames, function(fnr1, memberFrame1) {
                        if (widths[fnr1] < widths_min[fnr1]) {
                            var extra = widths_min[fnr1] - widths[fnr1];
                            widths[fnr1] += extra;
                            $.each(frame._memberFrames, function(fnr2, memberFrame2) {
                                if (fnr2 != fnr1)
                                    widths[fnr2] -= extra / (frame._memberFrames.length - 1);
                            });
                            modif = true;
                        }
                        if (widths[fnr1] > widths_max[fnr1]) {
                            var extra = widths_max[fnr1] - widths[fnr1];
                            widths[fnr1] += extra;
                            $.each(frame._memberFrames, function(fnr2, memberFrame2) {
                                if (fnr2 != fnr1)
                                    widths[fnr2] -= extra / (frame._memberFrames.length - 1);
                            });
                            modif = true;
                        }
                    });
                }

                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    memberFrame._sizeFraction = Math.max(1.0e-9, widths[fnr] / totSize);
                });
                frame._normaliseSizeFractions();
            };


            /**
             * Positions the member frames inside the available client area of the frame
             * @private
             */
            frame._setPositionSubframes = function(params) {
                var xl = frame.$ElContainer.children('.AXMFrameClient').width();
                var yl = frame.$ElContainer.children('.AXMFrameClient').height();
                frame.setPositionClient(xl,yl, params);
            };


            return frame;
        };



        /**
         * Implements a compound frame that organises member frame by aligning them horizontally, with splitters between them
         * @returns {Object} - object instance
         * @constructor
         */
        Module.FrameSplitterHor = function () {
            var frame = Module.FrameSplitter(0);


            /**
             * Positions the member frame with respect to the client area of the frame
             * @param {int} xl - client area width
             * @param {int} yl - client area height
             * @param {{}} params
             */
            frame.setPositionClient = function(xl, yl, params) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                frame._adjustFrameSizeFractions(xl);
                frame.calcSplitterPositions(xl);
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    var memberLeft = frame.splitterPositions[idx];
                    var memberRight = frame.splitterPositions[idx+1];
                    if (idx>0) {
                        memberLeft += frame._hSplitterSize;
                        $('#' + frame.getSplitterDivId(idx))
                            .css('width', 2*frame._hSplitterSize)
                            .css('height', yl)
                            .css('left', frame.splitterPositions[idx]-frame._hSplitterSize)
                            .css('top', 0);
                    }
                    if (idx<frame._memberFrames.length-1) {
                        memberRight -= frame._hSplitterSize;
                    }
                    memberFrame.setPosition(memberLeft, 0, memberRight-memberLeft+1, yl, params);

                });
            };

            return frame;
        };



        /**
         * Implements a compound frame that organises member frame by aligning them horizontally, with splitters between them
         * @returns {Object} - object instance
         * @constructor
         */
        Module.FrameSplitterVert = function () {
            var frame = Module.FrameSplitter(1);


            /**
             * Positions the member frame with respect to the client area of the frame
             * @param {int} xl - client area width
             * @param {int} yl - client area height
             * @param {{}} params
             */
            frame.setPositionClient = function(xl, yl, params) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                frame._adjustFrameSizeFractions(yl);
                frame.calcSplitterPositions(yl);
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    var memberTop = frame.splitterPositions[idx];
                    var memberBottom = frame.splitterPositions[idx+1];
                    if (idx>0) {
                        memberTop += frame._hSplitterSize;
                        $('#' + frame.getSplitterDivId(idx))
                            .css('height', 2*frame._hSplitterSize)
                            .css('width', xl)
                            .css('top', frame.splitterPositions[idx]-frame._hSplitterSize)
                            .css('left', 0);
                    }
                    if (idx<frame._memberFrames.length-1) {
                        memberBottom -= frame._hSplitterSize;
                    }
                    memberFrame.setPosition(0, memberTop, xl, memberBottom-memberTop+1, params);

                });
            };

            return frame;
        };




        /**
         * Base class implementing a compound frame that organises member frame by stacking them in the client area, with only one member frame visible at any time
         * @returns {Object} - object instance
         * @constructor
         */
        Module.FrameStacker = function () {
            var frame = Module.FrameCompound();
            frame._activeMemberNr = 0;
            frame._stackHeaderOffset = 0;


            /**
             * Returns the html for the client area
             * @returns {string}
             */
            frame.createHtmlClient = function() {
                var html = '';

                $.each(frame._memberFrames, function(idx, memberFrame) {
                    html += memberFrame.createHtml();
                });
                return html;
            };

            /**
             * Positions the member frames in the client area
             * @param {int} xl - client area width
             * @param {int} yl - client area height
             * @param {{}} params
             */
            frame.setPositionClient = function(xl, yl, params) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame.setPosition(0, frame._stackHeaderOffset, xl, yl-frame._stackHeaderOffset, params);
                });
                frame._updateMemberVisibility();
            };

            /**
             * Positions the member frames inside the available client area of the frame
             * @private
             */
            frame._setPositionSubframes = function(params) {
                var xl = frame.$ElContainer.children('.AXMFrameClient').width();
                var yl = frame.$ElContainer.children('.AXMFrameClient').height();
                frame.setPositionClient(xl,yl, params);
            };


            /**
             * Dynamically adds a member frame when the stacker is live displayed
             * @param {{}} theFrame - new member frame to be added
             */
            frame.dynAddMember = function(theFrame) {
                frame.addMember(theFrame);
                //frame._activeMemberNr = frame._memberFrames.length-1;
                var $elClient = frame.$ElContainer.children('.AXMFrameClient');
                if (theFrame.getRoot$El().length>0) {
                    theFrame.getRoot$El().css('display', 'none');
                    $elClient.append(theFrame.getRoot$El().detach());
                }
                else {
                    $elClient.append(theFrame.createHtml());
                    theFrame.getRoot$El().css('display', 'none');
                    theFrame.attachEventHandlers();
                }
                frame._setPositionSubframes({resizing: false});
            };

            /**
             * Dynamically removes a member from the stacker while live displayed
             * Note that the corresponding html is not removed
             * @param {{}} stackNr - index of the member to be removed
             */
            frame.dynDelMember = function(stackNr) {
                if ((stackNr<0) || (frame._memberFrames>=frame._memberFrames))
                    AXMUtils.reportBug('Invalid stack number');
                frame._memberFrames.splice(stackNr, 1);
                if (frame._activeMemberNr>stackNr)
                    frame._activeMemberNr--;
            };

            frame._firstVisibilityUpdate = true;
            /**
             * Updates the visibility of the member frames
             * @private
             */
            frame._updateMemberVisibility = function() {
                if (frame._firstVisibilityUpdate) {
                    $.each(frame._memberFrames, function(idx, memberFrame) {
                        memberFrame.$ElContainer.css('display',
                            (idx==frame._activeMemberNr) ? '' : 'none');
                    });
                    frame._firstVisibilityUpdate = false;//!!!
                } else {
                    var currentVisible = null;
                    var newVisible = null;
                    $.each(frame._memberFrames, function(idx, memberFrame) {
                        if (memberFrame.$ElContainer.css('display') != 'none')
                            currentVisible = memberFrame;
                        if (idx==frame._activeMemberNr)
                            newVisible = memberFrame;
                    });
                    if (currentVisible!=newVisible) {
                        if (currentVisible) {
                            currentVisible.$ElContainer.fadeTo(200,0, function() {
                                currentVisible.$ElContainer.css('display','none');
                                if (newVisible) {
                                    newVisible.$ElContainer.css('display','');
                                    newVisible.$ElContainer.fadeTo(200,1)
                                }
                            })
                        }
                        else {
                            if (newVisible) {
                                newVisible.$ElContainer.css('opacity','0');
                                newVisible.$ElContainer.css('display','');
                                newVisible.$ElContainer.fadeTo(200,1)
                            }
                        }
                    }
                }
            };

            /**
             * Activates an individual member frame
             * @param {int} fnr - member frame number
             */
            frame.activateStackNr = function(fnr) {
                if ((fnr<0) || (fnr>=frame._memberFrames.length))
                    AXMUtils.reportBug('Invalid TAB nr');
                frame._activeMemberNr = fnr;
                frame._updateMemberVisibility();
            };

            /**
             * Activates (= makes visible) a member frame containing a panel with a specific ID
             * @param {string} panelTypeId - panel ID of the frame to be activated
             */
            frame.activatePanelTypeId = function(panelTypeId) {
                var actFrameNr = -1;
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    if (memberFrame.activatePanelTypeId(panelTypeId))
                        actFrameNr = idx;
                });
                if (actFrameNr != -1) {
                    if (frame.activateStackNr)
                        frame.activateStackNr(actFrameNr);
                    return true
                }
                else
                    return false;
            };


            return frame;
        };



        /**
         * Implements a compound frame that organises member frame by stacking them in the client area, with only one member frame visible at any time, and a tabber control allowing the user to select the visible member frame
         * @returns {Object} - object instance
         * @constructor
         */
        Module.FrameTabber = function () {
            var frame = Module.FrameStacker();
            frame._stackHeaderOffset = 34+7;

            frame.isTabber = function() { return true; };


            /**
             * Returns a unique html element ID for each tab in the tabber
             * @param tabNr
             * @returns {string}
             * @private
             */
            frame._getTabId = function(tabNr) {
                return 'frametab_'+frame._id+'_'+tabNr;
            };

            var _super_createHtmlClient = frame.createHtmlClient;
            /**
             * Returns the html implementing the client area
             * @returns {string}
             */
            frame.createHtmlClient = function() {
                var html = '';

                var tabDiv = DOM.Div({}).addCssClass('AXMFrameTabContainer');
                var tabDivInner = DOM.Div({parent:tabDiv}).addCssClass('AXMFrameTabContainerInner');
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    var tablElDiv = DOM.Div({parent: tabDivInner, id:frame._getTabId(idx)})
                        .addCssClass('AXMFrameTabElement');
                    if (memberFrame.__stacker_disabled)
                        tablElDiv.addCssClass('AXMFrameTabDisabled');
                    tablElDiv.addElem(memberFrame.getTitle());
                });
                html += tabDiv.toString();
                html += _super_createHtmlClient();
                return html;
            };

            var _super_attachEventHandlers = frame.attachEventHandlers;
            /**
             * Attaches the html event handlers after DOM insertion
             * @param params
             */
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params);
                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    $('#'+frame._getTabId(fnr)).click(function() {
                        if ((fnr != frame._activeMemberNr) && (!memberFrame.__stacker_disabled))
                            frame.activateStackNr(fnr);
                    });
                });
                frame.activateStackNr(0);
            };

            var _super_detachEventHandlers = frame.detachEventHandlers;
            /**
             * Detaches the html event handlers
             */
            frame.detachEventHandlers = function() {
                _super_detachEventHandlers();
                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    $('#'+frame._getTabId(fnr)).unbind('click');
                });
            };

            frame._getTabContainer = function() {
                var $El = frame.$ElContainer.children('.AXMFrameClient').children('.AXMFrameTabContainer');
                if ($El.length != 1)
                if ($El.length != 1)
                    AXMUtils.Test.reportBug('Tab container bug');
                return $El;
            };


            /**
             * disables or enables a member frame of the tabber
             * @param {string} frameId - id of the affected member frame
             * @param {boolean} disabled - new state
             */
            frame.disableMember_ById = function(frameId, disabled) {
                var frameNr = -1;
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    if (memberFrame.getId() == frameId)
                        frameNr = idx;
                });
                if (frameNr < 0)
                    AXMUtils.reportBug("member frame id in stacker not found");
                frame._memberFrames[frameNr].__stacker_disabled = disabled;
                if (disabled)
                    $('#'+frame._getTabId(frameNr))
                        .addClass('AXMFrameTabDisabled');
                else
                    $('#'+frame._getTabId(frameNr))
                        .removeClass('AXMFrameTabDisabled');
            };


            /**
             * Activates an individual member frame
             * @param {int} fnr - member frame number
             */
            frame.activateStackNr = function(fnr) {
                if ((fnr<0) || (fnr>=frame._memberFrames.length))
                    AXMUtils.reportBug('Invalid TAB nr');
                frame._activeMemberNr = fnr;
                frame._updateMemberVisibility();
                frame._getTabContainer().children('.AXMFrameTabContainerInner').children('.AXMFrameTabElement')
                    .removeClass('AXMFrameTabElementActive')
                    .addClass('AXMFrameTabElementInActive');
                $('#'+frame._getTabId(fnr))
                    .removeClass('AXMFrameTabElementInActive')
                    .addClass('AXMFrameTabElementActive');

            };

            var _super_setPositionClient = frame.setPositionClient;
            /**
             * Positions the member frames inside the available client space
             * @param {int} xl - client space width
             * @param {int} yl - client space height
             * @param params
             */
            frame.setPositionClient = function(xl, yl, params) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                frame._getTabContainer()
                    .outerWidth(xl)
                    .outerHeight(frame._stackHeaderOffset);

                var availableWidth = frame._getTabContainer().width();

                var longestTitleLength = 0;
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    longestTitleLength = Math.max(longestTitleLength, memberFrame.getTitle().length);
                });

                var maxTitleLength = longestTitleLength;

                do {
                    $.each(frame._memberFrames, function(fnr, memberFrame) {
                        var shortTitle =memberFrame.getTitle();
                        if (maxTitleLength < shortTitle.length)
                            shortTitle = shortTitle.substring(0, maxTitleLength) + '&hellip;';
                        $('#'+frame._getTabId(fnr)).html(shortTitle);
                    });
                    var consumedWidth = frame._getTabContainer().children('.AXMFrameTabContainerInner').width();
                    maxTitleLength--;
                } while ((consumedWidth > availableWidth) && (maxTitleLength>1))

                _super_setPositionClient(xl, yl, params);
            };

            return frame;
        };


        /**
         * Implements a frame containing a panel
         * @param {AXM.Panels.PanelBase} iPanel - panel to be contained in the frame
         * @returns {Object} - frame instance
         * @constructor
         */
        Module.FrameFinal = function (iPanel) {
            AXMUtils.Test.checkIsType(iPanel, "@Panel");
            var frame = Module.FrameGeneric();
            frame._panel = iPanel;
            iPanel._setFrame(frame);


            /**
             * Adds a css class to the fame content
             * @param className
             */
            frame.setCssClass = function(className) {
                frame._cssClass = className;
                return frame;
            };


            /**
             * Returns the html implementing the client area
             * @returns {string}
             */
            frame.createHtmlClient = function() {
                var div = DOM.Div({id: frame._id+'_finalclient'});
                div.addCssClass('AXMFrameFinalClientArea');
                if (frame._cssClass)
                    div.addCssClass(frame._cssClass);
                div.addElem(frame._panel.createHtml());

                return div.toString();
            };

            /**
             * Returns the automatically computed client size in a given dimension
             * @param {int} dim - dimension index (Module.dimX or Module.dimY)
             * @returns {int}
             * @private
             */
            frame._getClientAutoSize = function(dim) {
                var $ElClient = frame.$ElContainer.children('.AXMFrameClient').children('.AXMFrameFinalClientArea');
                if ($ElClient.length != 1)
                    AXMUtils.Test.reportBug('Bug in getclientautosize');
                var ht = $ElClient.html();
                if (dim==Module.dimX)
                    return $ElClient.outerWidth();
                else
                    return $ElClient.outerHeight();
            };


            var _super_attachEventHandlers = frame.attachEventHandlers;
            /**
             * Attached the html event handlers after DOM insertion
             * @param params
             */
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params);
                frame._panel.attachEventHandlers(params);
            };


            var _super_detachEventHandlers = frame.detachEventHandlers;
            /**
             * Detach the html event handlers
             */
            frame.detachEventHandlers = function() {
                _super_detachEventHandlers();
                frame._panel.detachEventHandlers();
            };

            /**
             * Positions the panel in the client area
             * @param {int} xl - client area width
             * @param {int} yl - client area height
             * @param params
             */
            frame.setPositionClient = function(xl, yl, params) {
                if (!params)
                    debugger;
                var $ElClient = frame.$ElContainer.children('.AXMFrameClient').children(".AXMFrameFinalClientArea");
                if ($ElClient.length != 1)
                    AXMUtils.Test.reportBug('Bug in setPositionClient');
                if (!frame._sizeInfos[Module.dimY].isAutoSize())
                    $ElClient.css('height', yl);
                if (!frame._sizeInfos[Module.dimX].isAutoSize())
                    $ElClient.css('width', xl);
                frame._panel.resize(xl, yl, params);
            };


            /**
             * Returns the panel contained by this frame
             * @returns {AXM.Panels.PanelBase}
             */
            frame.getPanel = function() {
                return frame._panel;
            };


            /**
             * Activates a frame containing a specific panel ID (this function only needs to return the presence of this panel)
             * @param {int} panelTypeId - panel ID
             * @returns {boolean} - presence of this panel
             */
            frame.activatePanelTypeId = function(panelTypeId) {
                return frame._panel.getTypeId() == panelTypeId;
            };

            /**
             * Called when the frame is about to close.
             * @param msg
             */
            frame.willClose = function(msg) {
                frame._panel._tearDown();
             };


            return frame;
        };



        /**
         * Implements a frame containing a panel, with a button command bar on top
         * @param {AXM.Panels.PanelBase} iPanel - panel to be contained in the frame
         * @returns {Object} - frame instance
         * @constructor
         */
        Module.FrameFinalCommands = function(iPanel) {
            var controlsH = 40;
            var frame = Module.FrameSplitterVert();
            frame.setHalfSplitterSize(2);
            frame._panelControls = require('AXM/Panels/PanelForm').create(iPanel.getId()+'_commands');
            frame._frameCommands = frame.addMember(Module.FrameFinal(frame._panelControls))
                .setFixedDimSize(Module.dimY, controlsH);
            frame._frameFinal = frame.addMember(Module.FrameFinal(iPanel));

            frame._controlGroup = ControlsCompound.GroupHor({verticalAlignCenter: true});
            frame._panelControls.setRootControl(ControlsCompound.WrapperStyled(frame._controlGroup, 'AXMCommandBar'));

            frame._commandButtonsList = [];


            /**
             * Adds a command to the command bar
             * @param {{}} settings - same settings as for a AXM.Controls.Button
             * @param {function} action - called when the command is invoked by the user
             * @returns {Object}
             */
            frame.addCommand = function(settings, action) {
                settings.height = controlsH-1;
                if (!settings.width)
                    settings.width = 40;
                if (!settings.buttonClass)
                    settings.buttonClass = 'AXMButtonCommandBar';
                var bt = Controls.Button(settings);
                bt.addNotificationHandler(action);
                frame._commandButtonsList.push(bt);
                frame._controlGroup.add(bt);
                return bt;
            };


            /**
             * Adds a general control to the top command bar
             * @param {Object} ctrl
             */
            frame.addControl = function(ctrl) {
                frame._controlGroup.add(ctrl);
            };


            /**
             * Adds a horizontal separator to the top command bar
             */
            frame.addSeparator = function() {
                frame._controlGroup.add(ControlsCompound.DividerH());

            };

            return frame;
        };




        return Module;
    });

