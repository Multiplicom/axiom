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




        var Module = {};

        Module.create = function(id) {
            var panel = PanelCanvasZoomPan.create(id);

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
                ctx.restore();
            };


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

                ctx.restore();
            };

            panel.coordXLogic2Win = function(vlx) {
                return vlx * panel.scaleX + panel.offsetX;
            };

            panel.coordYLogic2Win = function(vly) {
                return vly * panel.scaleY + panel.offsetY;
            };

            panel.coordXWin2Logic = function(vlx) {
                return (vlx - panel.offsetX ) / panel.scaleX ;
            };

            panel.coordYWin2Logic = function(vly) {
                return (vly - panel.offsetY ) / panel.scaleY;
            };

            // Override to create a plot
            panel.drawPlot = function(drawInfo) {

            };

            panel.drawSel = function(drawInfo, vlx, vly) {
                var px = /*Math.round*/(vlx * drawInfo.scaleX + drawInfo.offsetX);
                var py = /*Math.round*/(vly * drawInfo.scaleY + drawInfo.offsetY);
                var ctx = drawInfo.ctx;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.stroke();
            };

            panel.drawPoint = function(drawInfo, vlx, vly) {
                var px = /*Math.round*/(vlx * drawInfo.scaleX + drawInfo.offsetX);
                var py = /*Math.round*/(vly * drawInfo.scaleY + drawInfo.offsetY);
                var ctx = drawInfo.ctx;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.fill();
            };

            panel.drawLabel = function(drawInfo, vlx, vly, offset, content) {
                var px = /*Math.round*/(vlx * drawInfo.scaleX + drawInfo.offsetX);
                var py = /*Math.round*/(vly * drawInfo.scaleY + drawInfo.offsetY);
                var ctx = drawInfo.ctx;
                ctx.fillText(content, px+offset, py+offset);
            };

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
                //var plotLimitXMin = win.plot.xScaler.getMinVisibleRange();
                //var plotLimitXMax = win.plot.xScaler.getMaxVisibleRange();
                //var plotLimitYMin = win.plot.yScaler.getMinVisibleRange();
                //var plotLimitYMax = win.plot.yScaler.getMaxVisibleRange();

                ctx.fillStyle="#FFFFFF";
                ctx.fillRect(0, 0, drawInfo.sizeX,  drawInfo.sizeY);
                ctx.fillStyle="#000000";


                panel.drawPlot(drawInfo);

            };



            return panel;
        };

        return Module;
    });

