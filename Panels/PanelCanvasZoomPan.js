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


        var Scaler = function(iScaler) {
            var scaler = {};

            if (iScaler) {
                scaler.minVal = iScaler.minVal;
                scaler.maxVal = iScaler.maxVal;
                scaler.range =  iScaler.range;
                scaler.offset = iScaler.offset;
            }
            
            scaler.setRange = function(minVal, maxVal) {
                scaler.minVal = minVal;
                scaler.maxVal = maxVal;
                scaler.range =  scaler.maxVal-scaler.minVal;
                scaler.offset = scaler.minVal;
                scaler.isZoomed = false;
            };

            scaler.getRange = function() {
                return scaler.range;
            };

            scaler.getOffset = function() {
                return scaler.offset;
            };

            scaler.getMinVisibleRange = function() {
                return scaler.offset;
            };

            scaler.getMaxVisibleRange = function() {
                return scaler.offset+scaler.range;
            };

            scaler.toFraction = function(vl) {
                return (vl-scaler.offset)/scaler.range;
            };

            scaler.getViewPortFraction = function() {
                return {
                    mn: (scaler.offset-scaler.minVal) / (scaler.maxVal-scaler.minVal),
                    mx: (scaler.offset+scaler.range-scaler.minVal) / (scaler.maxVal-scaler.minVal)
                }
            };

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


            scaler.zoom = function(fac, centerFrac) {
                var fixedPosValue = centerFrac*scaler.range + scaler.offset;
                scaler.range /= fac;
                scaler.offset = (fixedPosValue/scaler.range - centerFrac) * scaler.range;
                scaler.clipRange();
                if (fac>1)
                    scaler.isZoomed = true;
            };

            scaler.panFraction = function(fr) {
                scaler.offset += fr*scaler.range;
                scaler.clipRange();
            };


            return scaler;
        };


        
        
        
        var Module = {};

        Module.create = function(id) {
            var panel = PanelCanvas.create(id);

            panel.scaleMarginX = 37;
            panel.scaleMarginY = 37;
            panel._dragActionPan = true;
            //panel._directRedraw = true;

            panel.xScaler = Scaler();
            panel.yScaler = Scaler();

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

            // override:
            panel.drawCenter = function(drawInfo) {

            };


            panel.draw = function(drawInfo) {
                panel.drawSizeX = drawInfo.sizeX;
                panel.drawSizeY = drawInfo.sizeY;
                panel.drawCenter(drawInfo);
                panel.drawScale(drawInfo);
            };

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
            }

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

            panel.finishZoomPan = function() {
                if (panel.zoompanProcessing) {
                    panel.zoompanProcessing = false;
                    panel.render();
                }
            };

            panel.ThrottledFinishZoomPan = AXMUtils.debounce(panel.finishZoomPan, 250);
            panel._setNewScalers = function(newXScaler, newYScaler) {
                if (panel._directRedraw) {
                    panel.xScaler = newXScaler;
                    panel.yScaler = newYScaler;
                    panel.render();
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
            }
            

            panel._handleZoom = function(scaleFactor, px, py) {
                var centerFracX = (px-panel.scaleMarginX)*1.0/(panel.drawSizeX-panel.scaleMarginX);
                var centerFracY = (panel.drawSizeY-panel.scaleMarginY-py)/(panel.drawSizeY-panel.scaleMarginY);
                var newXScaler = Scaler(panel.xScaler);newXScaler.zoom(scaleFactor, centerFracX);
                var newYScaler = Scaler(panel.yScaler);newYScaler.zoom(scaleFactor, centerFracY);
                panel._setNewScalers(newXScaler, newYScaler);
            }
            
            panel._handleScrolled = function(params) {
                var delta = params.deltaY;
                if (delta!=0) {
                    if (delta < 0)//zoom out
                        var scaleFactor = 1.0 / (1.0 + 0.4 * Math.abs(delta));
                    else//zoom in
                        var scaleFactor = 1.0 + 0.4 * Math.abs(delta);
                    var px = panel.getEventPosX(params.event);
                    var py = panel.getEventPosY(params.event);
                    panel._handleZoom(scaleFactor, px, py);
                }
            };


            panel._panningStart = function() {
                panel._panning_x0 = 0;
                panel._panning_y0 = 0;
                panel.origXScaler = Scaler(panel.xScaler);
                panel.origYScaler = Scaler(panel.yScaler);
            };

            panel._panningDo = function(dragInfo) {
                var imW = panel.drawSizeX - panel.scaleMarginX;
                var imH = panel.drawSizeY - panel.scaleMarginY;
                var newXScaler = Scaler(panel.xScaler);newXScaler.panFraction(-(dragInfo.diffTotalX-panel._panning_x0)/imW);
                var newYScaler = Scaler(panel.yScaler);newYScaler.panFraction((dragInfo.diffTotalY-panel._panning_y0)/imH);
                panel._panning_x0 = dragInfo.diffTotalX;
                panel._panning_y0 = dragInfo.diffTotalY;
                panel._setNewScalers(newXScaler, newYScaler);
            };

            panel._panningStop = function() {
                panel.finishZoomPan();
            };
            

            var _super_attachEventHandlers = panel.attachEventHandlers;
            panel.attachEventHandlers = function() {
                _super_attachEventHandlers();
                var clickLayer$El = panel.getCanvas$El('selection');
                AXMUtils.create$ElScrollHandler(clickLayer$El, panel._handleScrolled);
                AXMUtils.create$ElDragHandler(clickLayer$El, panel._panningStart, panel._panningDo, panel._panningStop);
            };



            return panel;
        };

        return Module;
    });
