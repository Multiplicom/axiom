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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Panels/PanelCanvas"],
    function (
        require, $, _,
        AXMUtils, DOM, PanelCanvas) {


        /**
         * Returns a helper class implementing a scaler object, containing a total range and a variable subrange within this total range
         * This is used to define a zoomed range (subrange) within a complete range (canvas)
         * @param {Scaler} iScaler - (optional) another scaler object from which settings should be copied
         * @returns {{}} - object instance
         * @constructor
         */
        var Scaler = function(iScaler) {
            var scaler = {};

            if (iScaler) {
                scaler.minVal = iScaler.minVal;
                scaler.maxVal = iScaler.maxVal;
                scaler.range =  iScaler.range;
                scaler.offset = iScaler.offset;
            }

            /**
             * Sets the range of the scaler
             * @param {float} minVal
             * @param {float} maxVal
             */
            scaler.setRange = function(minVal, maxVal) {
                scaler.minVal = minVal;
                scaler.maxVal = maxVal;
                scaler.range =  scaler.maxVal-scaler.minVal;
                scaler.offset = scaler.minVal;
                scaler.isZoomed = false;
            };

            /**
             * Returns the range size
             * @returns {float}
             */
            scaler.getRange = function() {
                return scaler.range;
            };

            /**
             * Returns the subrange offset
             * @returns {float}
             */
            scaler.getOffset = function() {
                return scaler.offset;
            };

            /**
             * Returns the minimum value of the subrange
             * @returns {float}
             */
            scaler.getMinVisibleRange = function() {
                return scaler.offset;
            };

            /**
             * Returns the maximum value of the subrange
             * @returns {float}
             */
            scaler.getMaxVisibleRange = function() {
                return scaler.offset+scaler.range;
            };

            /**
             * Converts a value into a fractional position within the subrange
             * @param {float} vl - value
             * @returns {number} - fraction
             */
            scaler.toFraction = function(vl) {
                return (vl-scaler.offset)/scaler.range;
            };


            /**
             * Returns the min and max position of the subrange as fractional positions within the entire range
             * @returns {{mn: number, mx: number}}
             */
            scaler.getViewPortFraction = function() {
                return {
                    mn: (scaler.offset-scaler.minVal) / (scaler.maxVal-scaler.minVal),
                    mx: (scaler.offset+scaler.range-scaler.minVal) / (scaler.maxVal-scaler.minVal)
                }
            };


            /**
             * Clips the subrange to the complete range
             */
            scaler.clipRange = function() {
                if (scaler.range>scaler.maxVal-scaler.minVal)
                    scaler.range = scaler.maxVal-scaler.minVal;

                var minval = 0.0*scaler.range + scaler.offset;
                if (minval<scaler.minVal)
                    scaler.offset = scaler.minVal;

                var maxval = 1.0*scaler.range + scaler.offset;
                if (maxval>scaler.maxVal)
                    scaler.offset = scaler.maxVal - scaler.range;

            };


            /**
             * Zooms the subrange
             * @param {float} fac - zoom factor
             * @param {float} centerFrac - relative position of the zoom center
             */
            scaler.zoom = function(fac, centerFrac) {
                var fixedPosValue = centerFrac*scaler.range + scaler.offset;
                scaler.range /= fac;
                scaler.offset = (fixedPosValue/scaler.range - centerFrac) * scaler.range;
                scaler.clipRange();
                if (fac>1)
                    scaler.isZoomed = true;
            };


            /**
             * Shifts the subrange
             * @param {float} fr - shift distance as a fraction of the total range
             */
            scaler.panFraction = function(fr) {
                scaler.offset += fr*scaler.range;
                scaler.clipRange();
            };


            return scaler;
        };





        /**
         * Implements a panel that contains a html5 canvas element
         * @param {string} id - panel type id
         * @returns {Object} - panel instance
         * @constructor
         */
        var Module = {};

        /**
         * Implements a panel that contains a zoom-and-drag html5 canvas element
         * @param {string} id - panel type id
         * @param {{}} settings - panel settings
         * @param {int} settings.scaleMarginY - size of margin used to draw the scale
         * @param {boolean} settings.selectXDirOnly - if true, only x direction can be zoomed and scrolled
         * @param {boolean} settings.autoRemoveSelection - if false, the user-drawn selection is not automatically removed
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.create = function(id, settings) {
            var panel = PanelCanvas.create(id);

            if (!settings)
                settings = {};

            panel.scaleMarginX = 37;
            panel.scaleMarginY = settings.scaleMarginY || 37;

            panel.selectXDirOnly = settings.selectXDirOnly || false;

            panel._dragActionPan = true;
            panel._canZoomX = true;
            panel._canZoomY = true;
            panel._canZoomAxesSimultaneously = true;
            panel._minRangeX = 1e-9;  // to counter floating precision errors
            panel._minRangeY = 1e-9;
            panel._toolTipInfo = { ID: null };
            panel._selectionMode = false;
            panel.handleRectSelection = null;
            panel._autoRemoveSelection = true;
            if (settings.autoRemoveSelection === false)
                panel._autoRemoveSelection = false;
            //panel._directRedraw = true;

            /**
             * The X zoom range scaler
             * @type {Scaler}
             */
            panel.xScaler = Scaler();

            /**
             * The Y zoom range scaler
             * @type {Scaler}
             */
            panel.yScaler = Scaler();

            panel.getXRangeMin = function() {
                return panel.xScaler.getMinVisibleRange();
            };

            panel.getXRangeMax = function() {
                return panel.xScaler.getMaxVisibleRange();
            };

            panel.getYRangeMin = function() {
                return panel.yScaler.getMinVisibleRange();
            };

            panel.getYRangeMax = function() {
                return panel.yScaler.getMaxVisibleRange();
            };

            panel.setXRange = function(minval, maxval) {
                panel.xScaler.setRange(minval, maxval);
            };
            panel.setYRange = function(minval, maxval) {
                panel.yScaler.setRange(minval, maxval);
            };
            panel.getXScale = function() {
                return 1.0/panel.xScaler.getRange()*(panel.drawSizeX-panel.scaleMarginX);
            };
            panel.getXOffset = function() {
                return panel.scaleMarginX - panel.xScaler.getOffset()*panel.getXScale();
            };
            panel.getYScale = function() {
                return  - 1.0/panel.yScaler.getRange()*(panel.drawSizeY-panel.scaleMarginY);
            };
            panel.getYOffset = function() {
                return (panel.drawSizeY - panel.scaleMarginY) - panel.yScaler.getOffset()*panel.getYScale();
            };

            /**
             * Specifies in what direction the canvas can zoom
             * @param {boolean} canZoomX
             * @param {boolean} canZoomY
             */
            panel.setZoomDirections = function(canZoomX, canZoomY) {
                panel._canZoomX = canZoomX;
                panel._canZoomY = canZoomY;
            };

            /**
             * Specifies whether both axes are zoomed simultaneously, or independently.
             * In the latter case, regular scrolling only zooms along the first axis (X).
             * To zoom along the second axis (Y), the Ctrl modifier must be pressed while scrolling.
             * @param {boolean} canZoomAxesSimultaneously
             */
            panel.setCanZoomAxesSimultaneously = function(canZoomAxesSimultaneously) {
                panel._canZoomAxesSimultaneously = canZoomAxesSimultaneously;
            };

            /**
             * Specify min range on both axes
             * @param {boolean} minRangeX
             * @param {boolean} minRangeY
             */
            panel.setMinRanges = function(minRangeX, minRangeY) {
                panel._minRangeX = minRangeX;
                panel._minRangeY = minRangeY;
            };

            /**
             * Specifies in what direction the canvas can zoom
             */
            panel.canZoomX = function(scaleFactor) {
                return panel._canZoomX && (scaleFactor <= 1.0 || panel.xScaler.getRange() > panel._minRangeX)
            };

            /**
             * Specifies in what direction the canvas can zoom
             */
            panel.canZoomY = function(scaleFactor) {
                return panel._canZoomY && (scaleFactor <= 1.0 || panel.yScaler.getRange() > panel._minRangeY)
            };

            /**
             * Enables or disables the selection modus. When enables, mouse dragging sets the selection rather than panning
             * @param {bool} status
             */
            panel.setSelectionMode = function(status) {
                panel._selectionMode = status;
            };


            /**
             * Sets the handler that handles selection events
             * @param {function(pointTopLeft, pointRightbottom)} handler
             */
            panel.setHandleRectSelection = function(handler) {
                panel.handleRectSelection = handler;
            };


            /**
             * Drawing function, to be implemented in derived classes
             * @param drawInfo
             */
            panel.drawCenter = function(drawInfo) {
            };

            /**
             * Returns tooltip information for a location
             * Optionally to be implemented in a direved class
             * @param {int} px - x position
             * @param {int} py - y position
             * @returns {{ID, px, py, content}} - tooltip info (may be null if no tooltip is to be shown)
             */
            panel.getToolTipInfo = function (px, py) {
                return null;
            };

            /**
             * Optionally to be implemented by a derived class to be notified about clicks
             * @param {{}} ev - event handler
             * @param info
             */
            panel.onMouseClick = function(ev, info) {

            };


            /**
             * Draws the canvas
             * @param drawInfo
             */
            panel.draw = function(drawInfo) {
                panel.drawSizeX = drawInfo.sizeX;
                panel.drawSizeY = drawInfo.sizeY;
                panel.drawCenter(drawInfo);
                panel.drawScale(drawInfo);
            };


            /**
             * Draws the scale(s)
             * @param drawInfo
             */
            panel.drawScale = function(drawInfo) {
                panel.drawSizeX = drawInfo.sizeX;
                panel.drawSizeY = drawInfo.sizeY;
                var ctx = drawInfo.ctx;

                ctx.fillStyle="rgb(220,220,220)";
                ctx.fillRect(0,0,panel.scaleMarginX, drawInfo.sizeY);
                ctx.fillRect(0,drawInfo.sizeY-panel.scaleMarginY,drawInfo.sizeX,panel.scaleMarginY);

                if (panel.drawXScale)
                    panel.drawXScale(drawInfo);
                if (panel.drawYScale)
                    panel.drawYScale(drawInfo);

                ctx.fillStyle="rgba(0,0,0,0.2)";
                var vpFraction = panel.xScaler.getViewPortFraction();
                var imW = drawInfo.sizeX-panel.scaleMarginX;
                ctx.fillRect(panel.scaleMarginX + vpFraction.mn*imW, drawInfo.sizeY-5,(vpFraction.mx-vpFraction.mn)*imW, 5);
                var vpFraction = panel.yScaler.getViewPortFraction();
                var imH = drawInfo.sizeY-panel.scaleMarginY;
                ctx.fillRect(0, (1-vpFraction.mx)*imH, 5,(vpFraction.mx-vpFraction.mn)*imH);
            };


            /**
             * Updates the scale drawings
             */
            panel.renderScale = function() {
                var ctx = panel.getCanvasElement('main').getContext("2d");
                ctx.fillStyle="#FFFFFF";
                var drawInfo = {
                    ctx: ctx,
                    sizeX: panel._cnvWidth,
                    sizeY: panel._cnvHeight,
                    scaleBorderOnly: true
                };
                panel.drawScale(drawInfo);
            };


            /**
             * Display a tooltip
             * @param tooltipInfo
             * @private
             */
            panel._showToolTip = function(tooltipInfo) {
                panel._hideToolTip();
                panel._toolTipInfo = tooltipInfo;
                if (tooltipInfo.content) {
                    var tooltip = DOM.Div();
                    tooltip.addCssClass("AXMToolTip");
                    tooltip.addStyle("position", "absolute");
                    tooltip.addStyle("z-index", '9999999');
                    tooltip.addElem(panel._toolTipInfo.content);

                    // To place the tooltip nicely we must first know it's dimensions
                    var $tooltip = $( $.parseHTML(tooltip.toString()) );
                    $('.AXMContainer').append($tooltip);

                    var screenX = panel.posXCanvas2Screen(panel._toolTipInfo.px);
                    var screenY = panel.posYCanvas2Screen(panel._toolTipInfo.py);
                    screenX += ($tooltip.width()  + 10 + screenX > $(window).width())  ? -($tooltip.width()+10)  : 10;
                    screenY += ($tooltip.height() + 10 + screenY > $(window).height()) ? -($tooltip.height()+10) : 10;
                    $tooltip.css({top: screenY, left: screenX, position:'absolute'});
                }
            };


            /**
             * Hides a displayed tooltip, if any
             * @private
             */
            panel._hideToolTip = function() {
                panel._toolTipInfo.ID = null;
                $('.AXMContainer').find('.AXMToolTip').remove();
            };


            /**
             * Finalises a zoom & pan action
             */
            panel.finishZoomPan = function() {
                if (panel.zoompanProcessing) {
                    panel.zoompanProcessing = false;
                    panel.drawCanvas();
                }
            };

            panel.ThrottledFinishZoomPan = AXMUtils.debounce(panel.finishZoomPan, 250);
            /**
             * Adjusts the scalers according to a new position
             * @param {Scaler} newXScaler - new X scaler
             * @param {Scaler} newYScaler - new Y scaler
             * @private
             */
            panel._setNewScalers = function(newXScaler, newYScaler) {
                if (panel._directRedraw) {
                    panel.xScaler = newXScaler;
                    panel.yScaler = newYScaler;
                    panel.drawCanvas();
                }
                else {
                    var mainCanvas = panel.getCanvasElement('main');
                    var ctx = mainCanvas.getContext("2d");
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    if (!panel.zoompanProcessing) {
                        panel.zoompanProcessing = true;
                        panel.zoompanImage = new Image();
                        panel.zoompanImage.id = "tempzoompic";
                        panel.zoompanImage.src = mainCanvas.toDataURL();
                        panel.origXScaler = Scaler(panel.xScaler);
                        panel.origYScaler = Scaler(panel.yScaler);
                    }
                    panel.xScaler = newXScaler;
                    panel.yScaler = newYScaler;
                    if (!panel.zoompanProcessing) {
                        panel.zoompanProcessing = true;
                        panel.zoompanImage = new Image();
                        panel.zoompanImage.id = "tempzoompic";
                        panel.zoompanImage.src = mainCanvas.toDataURL();
                    }

                    ctx.scale(panel.ratio, panel.ratio);
                    ctx.fillStyle="rgb(240,240,240)";
                    ctx.fillRect(0, 0, panel._cnvWidth,panel._cnvHeight);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    var frx1 = panel.xScaler.toFraction(panel.origXScaler.getMinVisibleRange());
                    var frx2 = panel.xScaler.toFraction(panel.origXScaler.getMaxVisibleRange());
                    var fry1 = panel.yScaler.toFraction(panel.origYScaler.getMinVisibleRange());
                    var fry2 = panel.yScaler.toFraction(panel.origYScaler.getMaxVisibleRange());
                    var imW = panel.zoompanImage.width-panel.scaleMarginX*panel.ratio;
                    var imH = panel.zoompanImage.height-panel.scaleMarginY*panel.ratio;
                    ctx.drawImage(panel.zoompanImage,
                        panel.scaleMarginX*panel.ratio, 0,
                        imW, imH,
                        panel.scaleMarginX*panel.ratio + imW*frx1, imH*(1-fry2),
                        imW*(frx2-frx1), imH*(fry2-fry1)
                    );
                    ctx.scale(panel.ratio, panel.ratio);
                    panel.renderScale();
                    panel.ThrottledFinishZoomPan();
                }
            };


            /**
             * Draws a selection rectangle
             * @param {x,y} firstPoint - top left corner
             * @param {x,y}secondPoint - bottom right corner
             * @private
             */
            panel._drawSelRect = function(firstPoint, secondPoint) {
                var selCanvas = panel.getCanvasElement('selection');
                var ctx = selCanvas.getContext("2d");
                ctx.setTransform(1, 0, 0, 1, 0, 0);

                ctx.scale(panel.ratio, panel.ratio);
                //ctx.fillStyle="rgb(255,255,255)";
                //ctx.fillRect(0, 0, panel._cnvWidth,panel._cnvHeight);
                ctx.clearRect(0, 0, panel._cnvWidth, panel._cnvHeight);
                ctx.fillStyle='rgba(255,0,0,0.1)';
                ctx.strokeStyle='rgba(255,0,0,0.5)';
                if (firstPoint && secondPoint) {
                    if (panel.selectXDirOnly) {
                        firstPoint.y = 0;
                        secondPoint.y = panel._cnvHeight;
                    }
                    ctx.beginPath();
                    ctx.moveTo(firstPoint.x, firstPoint.y);
                    ctx.lineTo(firstPoint.x, secondPoint.y);
                    ctx.lineTo(secondPoint.x, secondPoint.y);
                    ctx.lineTo(secondPoint.x, firstPoint.y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            };


            /**
             * Handles a zoom action
             * @param {float} scaleFactor - zoom factor
             * @param {float} px - center x position
             * @param {float} py - center y position
             * @param {float} params - the event params
             * @private
             */
            panel._handleZoom = function(scaleFactor, px, py, params) {
                var centerFracX = (px-panel.scaleMarginX)*1.0/(panel.drawSizeX-panel.scaleMarginX);
                var centerFracY = (panel.drawSizeY-panel.scaleMarginY-py)/(panel.drawSizeY-panel.scaleMarginY);
                var newXScaler = panel.xScaler;
                if (panel.canZoomX(scaleFactor) && (panel._canZoomAxesSimultaneously || !params.controlPressed)) {
                    newXScaler = Scaler(panel.xScaler);
                    newXScaler.zoom(scaleFactor, centerFracX);
                }
                var newYScaler = panel.yScaler;
                if (panel.canZoomY(scaleFactor) && (panel._canZoomAxesSimultaneously || params.controlPressed)) {
                    newYScaler = Scaler(panel.yScaler);
                    newYScaler.zoom(scaleFactor, centerFracY);
                }
                panel._setNewScalers(newXScaler, newYScaler);
            };

            /**
             * Handles the mouse scrolled event
             * @param {{}} params - mouse scroll parameters
             * @private
             */
            panel._handleScrolled = function(params) {
                var delta = params.deltaY;
                if ((delta!=0)&&(!panel._selectionMode)) {
                    if (delta < 0)//zoom out
                        var scaleFactor = 1.0 / (1.0 + 0.4 * Math.abs(delta));
                    else//zoom in
                        var scaleFactor = 1.0 + 0.4 * Math.abs(delta);
                    var px = panel.getEventPosX(params.event);
                    var py = panel.getEventPosY(params.event);
                    panel._handleZoom(scaleFactor, px, py, params);
                }
            };


            /**
             * Initialises a panning action (initiated by a mouse button down event)
             * @param params
             * @private
             */
            panel._panningStart = function(params) {
                panel.bubbleMessage("Activated");
                panel._hideToolTip();
                panel._isRectSelecting = params.shiftPressed || panel._selectionMode;
                if (panel._isRectSelecting) {
                    panel._rectSelectPoint1 = {
                        x: panel.getEventPosX(params.event),
                        y: panel.getEventPosY(params.event)
                    };
                    panel._rectSelectPoint2 = null;
                }
                panel._isPanning = !params.shiftPressed;
                if (panel._isPanning) {
                    panel._hasPanned = false;
                    panel._panning_x0 = 0;
                    panel._panning_y0 = 0;
                    panel.origXScaler = Scaler(panel.xScaler);
                    panel.origYScaler = Scaler(panel.yScaler);
                }
            };


            /**
             * Handles a panning change action (initiated by a mouse drag event)
             * @param dragInfo
             * @private
             */
            panel._panningDo = function(dragInfo) {
                if (panel._isRectSelecting) {
                    panel._rectSelectPoint2 = {
                        x: panel.getEventPosX(dragInfo.event),
                        y: panel.getEventPosY(dragInfo.event)
                    };
                    panel._drawSelRect(panel._rectSelectPoint1, panel._rectSelectPoint2);
                }
                if (panel._isPanning) {
                    if (Math.abs(dragInfo.diffTotalX)+Math.abs(dragInfo.diffTotalY)>10)
                        panel._hasPanned = true;
                    if (panel._hasPanned) {
                        var imW = panel.drawSizeX - panel.scaleMarginX;
                        var imH = panel.drawSizeY - panel.scaleMarginY;
                        var newXScaler = Scaler(panel.xScaler);newXScaler.panFraction(-(dragInfo.diffTotalX-panel._panning_x0)/imW);
                        var newYScaler = Scaler(panel.yScaler);newYScaler.panFraction((dragInfo.diffTotalY-panel._panning_y0)/imH);
                        panel._panning_x0 = dragInfo.diffTotalX;
                        panel._panning_y0 = dragInfo.diffTotalY;
                        panel._setNewScalers(newXScaler, newYScaler);
                    }
                }
            };

            /**
             * Handles a panning stop action (initiated by a mouse button up event)
             * @private
             */
            panel._panningStop = function() {
                if (panel._isRectSelecting) {
                    if (panel._rectSelectPoint2) {
                        if (panel._autoRemoveSelection)
                            panel._drawSelRect(null, null);
                        if (panel.handleRectSelection)
                            panel.handleRectSelection(panel._rectSelectPoint1, panel._rectSelectPoint2);
                        setTimeout(function() { // some delay to avoid the click handler to kick in
                            panel._isRectSelecting = false;
                        },100);
                    }
                }
                if (panel._isPanning) {
                    panel._isPanning = false;
                    if (panel._hasPanned) {
                        setTimeout(function() { // some delay to avoid the click handler to kick in
                            panel._hasPanned = false;
                        },100);
                        panel.finishZoomPan();
                    }
                }

            };


            panel.removeSelection = function() {
                panel._drawSelRect(null, null);
            };

            /**
             * Html mouse move event handler
             * @param ev
             * @private
             */
            panel._onMouseMove = function(ev) {
                if (panel._lassoSelecting)
                    return;
                if (panel._isRectSelecting)
                    return;
                if (panel._isPanning)
                    return;
                var px = panel.getEventPosX(ev);
                var py = panel.getEventPosY(ev);
                var newToolTipInfo = panel.getToolTipInfo(px, py);
                var showPointer = false;
                if (newToolTipInfo && (!_AXM_HasTransientPopups())) {
                    if (newToolTipInfo.showPointer)
                        showPointer = true;
                    if (panel._toolTipInfo.ID != newToolTipInfo.ID)
                        panel._showToolTip(newToolTipInfo);
                }
                else
                    panel._hideToolTip();
                var pointerType = showPointer?"pointer":"auto";
                if (panel._selectionMode && (!showPointer))
                    pointerType = "crosshair";
                panel.getCanvas$El('main').css('cursor', pointerType);
                panel.getCanvas$El('selection').css('cursor', pointerType);
            };


            /**
             * Html mouse click event handler
             * @param ev
             * @private
             */
            panel._onClick = function(ev) {
                if (panel._lassoSelecting)
                    return;
                if (panel._isRectSelecting)
                    return;
                if (panel._hasPanned)
                    return;
                panel._hideToolTip();
                panel.onMouseClick(ev, {
                    x: panel.getEventPosX(ev),
                    y: panel.getEventPosY(ev),
                    pageX: ev.pageX,
                    pageY: ev.pageY
                });
            };

            panel.isLassoSelecting = function() {
                return panel._lassoSelecting;
            };

            panel.doLassoSelection = function(onCompleted) {
                if (panel._lassoSelecting)
                    return;
                panel._lassoSelecting = true;

                var selPts = [];
                var clickLayer$El = panel.getCanvas$El('selection');

                var drawSelArea = function(tempPt) {
                    var selCanvas = panel.getCanvasElement('selection');
                    var ctx = selCanvas.getContext("2d");
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, selCanvas.width, selCanvas.height);
                    ctx.fillStyle='rgba(255,0,0,0.1)';
                    ctx.strokeStyle='rgba(255,0,0,0.5)';
                    ctx.scale(panel.ratio, panel.ratio);
                    ctx.beginPath();
                    $.each(selPts, function(idx, pt) {
                        if (idx==0)
                            ctx.moveTo(pt.x, pt.y);
                        else
                            ctx.lineTo(pt.x, pt.y);
                    });
                    if (tempPt && (selPts.length>0))
                        ctx.lineTo(tempPt.x, tempPt.y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                };

                var end = function() {
                    clickLayer$El.unbind("click.FrameCanvasLasso");
                    clickLayer$El.unbind("dblclick.FrameCanvasLasso");
                    $(document).unbind("mousemove.FrameCanvasLasso");
                    selPts = [];
                    drawSelArea();
                    clickLayer$El.css('cursor', 'auto');
                    panel._lassoSelecting = false;
                };

                var lassoEventListener_click = function(ev) {
                    var px = panel.getEventPosX(ev);
                    var py = panel.getEventPosY(ev);
                    if ( (selPts.length==0) || (px!=selPts[selPts.length-1].x) || (py!=selPts[selPts.length-1].y) )
                        selPts.push({x:px, y:py});
                    drawSelArea();
                };

                var lassoEventListener_dblclick = function() {
                    var selectedPoints = selPts;
                    end();
                    onCompleted(selectedPoints);
                };

                var lassoEventListener_mousemove = function(ev) {
                    var px = panel.getEventPosX(ev);
                    var py = panel.getEventPosY(ev);
                    drawSelArea({x:px, y:py});
                };

                if (!panel._lassoSelecting) { // end the lasso selection
                    end();
                }

                else { // start the lasso selection
                    clickLayer$El.bind("click.FrameCanvasLasso", lassoEventListener_click);
                    clickLayer$El.bind("dblclick.FrameCanvasLasso", lassoEventListener_dblclick);
                    $(document).bind("mousemove.FrameCanvasLasso", lassoEventListener_mousemove);
                    clickLayer$El.css('cursor', 'crosshair');
                }
            };

            var _super_attachEventHandlers = panel.attachEventHandlers;
            /**
             * Attached the html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function() {
                _super_attachEventHandlers();
                var clickLayer$El = panel.getCanvas$El('selection');
                AXMUtils.create$ElScrollHandler(clickLayer$El, panel._handleScrolled, true);
                AXMUtils.create$ElDragHandler(clickLayer$El, panel._panningStart, panel._panningDo, panel._panningStop);
                clickLayer$El.mousemove(panel._onMouseMove);
                clickLayer$El.click(panel._onClick);
                clickLayer$El.mouseleave(panel._hideToolTip);
            };

            var _super_detachEventHandlers = panel.detachEventHandlers;
            /**
             * Detach the html event handlers
             */
            panel.detachEventHandlers = function() {
                _super_detachEventHandlers();
                if(panel){
                    var clickLayer$El = panel.getCanvas$El('selection');
                    AXMUtils.remove$ElScrollHandler(clickLayer$El);
                    AXMUtils.remove$ElDragHandler(clickLayer$El);
                    clickLayer$El.unbind('mousemove');
                    clickLayer$El.unbind('click');
                    clickLayer$El.unbind('mouseleave');
                }
            };


            return panel;
        };

        return Module;
    });

