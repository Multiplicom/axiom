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
        "AXM/AXMUtils", "AXM/DrawUtils", "AXM/DOM", "AXM/Panels/PanelCanvasZoomPan"],
    function (
        require, $, _,
        AXMUtils, DrawUtils, DOM, PanelCanvasZoomPan) {




        /**
         * Module encapsulating a panel with a html5 canvas element with X-Y plotting features
         * @type {{}}
         */
        var Module = {};

        /**
         * Implements a panel that contains a html5 canvas element with X-Y plotting features
         * @param {string} id - panel type id
         * @param {{}} - settings
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.create = function(id, settings) {
            var panel = PanelCanvasZoomPan.create(id, settings);
            panel._xLabel = '';
            panel._yLabel = '';

            /**
             * Define x label
             * @param {string} txt - label
             */
            panel.setXLabel = function(txt) {
                panel._xLabel = txt;
            };


            /**
             * Define y label
             * @param {string} txt - label
             */
            panel.setYLabel = function(txt) {
                panel._yLabel = txt;
            };


            /**
             * Draw the X scale
             * @param drawInfo
             */
            panel.drawXScale = function(drawInfo) {
                var ctx = drawInfo.ctx;
                var scaleX = panel.getXScale();
                var offsetX = panel.getXOffset();
                var plotLimitXMin = panel.xScaler.getMinVisibleRange();
                var plotLimitXMax = panel.xScaler.getMaxVisibleRange();
                ctx.save();
                ctx.font = "10px Arial";
                ctx.fillStyle = "rgb(0,0,0)";
                ctx.textAlign = 'center';
                var scale = DrawUtils.getScaleJump(30/scaleX);
                var ticks = [];
                for (var i=Math.ceil(plotLimitXMin/scale.Jump1); i<=Math.floor(plotLimitXMax/scale.Jump1); i++) {
                    var tick = {};
                    tick.value = i*scale.Jump1;
                    if (i%scale.JumpReduc==0) {
                        tick.label = scale.value2String(tick.value);
                    }
                    ticks.push(tick);
                }
                $.each(ticks, function (idx, tick) {
                    if ((tick.value >= plotLimitXMin) && (tick.value <= plotLimitXMax)) {
                        var px = Math.round(tick.value * scaleX + offsetX) - 0.5;
                        if (tick.label) {
                            ctx.fillText(tick.label, px, drawInfo.sizeY - panel.scaleMarginY + 13);
                            if (tick.label2)
                                ctx.fillText(tick.label2, px, drawInfo.sizeY - panel.scaleMarginY + 23);
                            ctx.strokeStyle = "rgba(0,0,0,0.2)";
                        }
                        else {
                            ctx.strokeStyle = "rgba(0,0,0,0.1)";
                        }
                        if (!drawInfo.scaleBorderOnly) {
                            ctx.beginPath();
                            ctx.moveTo(px, 0);
                            ctx.lineTo(px, drawInfo.sizeY - panel.scaleMarginY);
                            ctx.stroke();
                        }
                    }
                });
                ctx.fillText(panel._xLabel, drawInfo.sizeX/2, drawInfo.sizeY - 10);
                ctx.restore();
            };


            /**
             * Draw the y scale
             * @param drawInfo
             */
            panel.drawYScale = function(drawInfo) {
                var ctx = drawInfo.ctx;
                var scaleY = panel.getYScale();
                var offsetY = panel.getYOffset();
                var plotLimitYMin = panel.yScaler.getMinVisibleRange();
                var plotLimitYMax = panel.yScaler.getMaxVisibleRange();

                ctx.save();
                ctx.font="10px Arial";
                ctx.fillStyle="rgb(0,0,0)";
                ctx.textAlign = 'center';

                var scale = DrawUtils.getScaleJump(30/Math.abs(scaleY));
                var ticks = [];
                for (var i=Math.ceil(plotLimitYMin/scale.Jump1); i<=Math.floor(plotLimitYMax/scale.Jump1); i++) {
                    var tick = {};
                    tick.value = i*scale.Jump1;
                    if (i%scale.JumpReduc==0) {
                        tick.label = scale.value2String(tick.value);
                    }
                    ticks.push(tick);
                }

                $.each(ticks, function(idx, tick) {
                    if ((tick.value>=plotLimitYMin) && (tick.value<=plotLimitYMax)) {
                        var py = Math.round(tick.value * scaleY + offsetY)-0.5;
                        if (tick.label) {
                            ctx.save();
                            ctx.translate(panel.scaleMarginX-5,py);
                            ctx.rotate(-Math.PI/2);
                            if (!tick.label2)
                                ctx.fillText(tick.label,0,0);
                            else {
                                ctx.fillText(tick.label,0,-10);
                                ctx.fillText(tick.label2,0,0);
                            }
                            ctx.restore();
                            ctx.strokeStyle = "rgba(0,0,0,0.2)";
                        }
                        else {
                            ctx.strokeStyle = "rgba(0,0,0,0.1)";
                        }
                        if (!drawInfo.scaleBorderOnly) {
                            ctx.beginPath();
                            ctx.moveTo(panel.scaleMarginX,py);
                            ctx.lineTo(drawInfo.sizeX,py);
                            ctx.stroke();
                        }
                    }
                });

                ctx.save();
                ctx.translate(15,drawInfo.sizeY/2);
                ctx.rotate(-Math.PI/2);
                ctx.fillText(panel._yLabel, 0, 0);
                ctx.restore();

                ctx.restore();
            };

            /**
             * Converts logical x coordinate to window x coordinate
             * @param {float} vlx - logical coordinate
             * @returns {float} - window coordinate
             */
            panel.coordXLogic2Win = function(vlx) {
                return vlx * panel.scaleX + panel.offsetX;
            };


            /**
             * Converts logical y coordinate to window y coordinate
             * @param {float} vly - logical coordinate
             * @returns {float} - window coordinate
             */
            panel.coordYLogic2Win = function(vly) {
                return vly * panel.scaleY + panel.offsetY;
            };


            /**
             * Converts window x coordinate to logical x coordinate
             * @param {float} vlx - window coordinate
             * @returns {float} - logical coordinate
             */
            panel.coordXWin2Logic = function(vlx) {
                return (vlx - panel.offsetX ) / panel.scaleX ;
            };


            /**
             * Converts window y coordinate to logical y coordinate
             * @param {float} vly - window coordinate
             * @returns {float} - logical coordinate
             */
            panel.coordYWin2Logic = function(vly) {
                return (vly - panel.offsetY ) / panel.scaleY;
            };

            /**
             * Tests whether part of the rectangular area around a point is visible in the viewport
             * @param {float} vlx - the window x coordinate of the center point
             * @param {float} vly - the window y coordinate of the center point
             * @param {float} width - the window width of the rectangle centered at the point
             * @param {float} height - the window height of the rectangle centered at the point
             * @returns {bool} - whether part of the area is visible
             */
            panel.pointVisibleInViewport = function(vlx, vly, width, height) {
                return (
                    vlx - 0.5 * width >= 0 &&
                    vlx + 0.5 * width <= panel._cnvWidth &&
                    vly - 0.5 * height >= 0 &&
                    vly + 0.5 * height <= panel._cnvHeight
                );
            };

            /**
             * To be implemented by derived class to define the plot
             * @param drawInfo
             */
            panel.drawPlot = function(drawInfo) {

            };

            /**
             * Draws an individual selected point
             * @param drawInfo
             * @param {float} vlx - logical x coordinae
             * @param {float} vly - logical y coordinate
             * @param {float} size - point size
             */
            panel.drawSel = function(drawInfo, vlx, vly, size) {
                var px = (vlx * drawInfo.scaleX + drawInfo.offsetX);
                var py = (vly * drawInfo.scaleY + drawInfo.offsetY);
                var ctx = drawInfo.ctx;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.stroke();
            };

            /**
             * Draws an individual  point
             * @param drawInfo
             * @param {float} vlx - logical x coordinae
             * @param {float} vly - logical y coordinate
             * @param {float} size - point size
             */
            panel.drawPoint = function(drawInfo, vlx, vly, size, drawOutline) {
                if (size < 0)
                    debugger;
                var px = /*Math.round*/(vlx * drawInfo.scaleX + drawInfo.offsetX);
                var py = /*Math.round*/(vly * drawInfo.scaleY + drawInfo.offsetY);

                if (!panel.pointVisibleInViewport(px, py, size * 2, size * 2))
                    return;

                var ctx = drawInfo.ctx;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.fill();
                if (drawOutline)
                    ctx.stroke();
            };

            /**
             * Draws a text labe;
             * @param drawInfo
             * @param {float} vlx - logical x coordinate
             * @param {float} vly - logical y coordinate
             * @param {float} offset - offset of the label
             * @param {string} content - label text
             */
            panel.drawLabel = function(drawInfo, vlx, vly, offset, content) {
                var px = (vlx * drawInfo.scaleX + drawInfo.offsetX);
                var py = (vly * drawInfo.scaleY + drawInfo.offsetY);
                var ctx = drawInfo.ctx;
                ctx.fillText(content, px+offset, py+offset);
            };


            /**
             * Implements drawing the plot
             * @param drawInfo
             */
            panel.drawCenter = function(drawInfo) {
                var ctx = drawInfo.ctx;
                var scaleX = panel.getXScale();
                var offsetX = panel.getXOffset();
                var scaleY = panel.getYScale();
                var offsetY = panel.getYOffset();
                drawInfo.scaleX = scaleX; drawInfo.offsetX = offsetX;
                drawInfo.scaleY = scaleY; drawInfo.offsetY = offsetY;
                panel.scaleX = scaleX; panel.offsetX = offsetX;
                panel.scaleY = scaleY; panel.offsetY = offsetY;

                ctx.fillStyle="#FFFFFF";
                ctx.fillRect(0, 0, drawInfo.sizeX,  drawInfo.sizeY);
                ctx.fillStyle="#000000";


                panel.drawPlot(drawInfo);

            };



            return panel;
        };

        return Module;
    });

