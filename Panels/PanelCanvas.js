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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Panels/PanelBase"],
    function (
        require, $, _,
        AXMUtils, DOM, PanelBase) {

        var Module = {};

        Module.create = function(id) {
            var panel = PanelBase.create(id);

            panel._canvasLayerIds = ['main','selection'];
            panel.canvasBaseId = 'CNV_'+panel.getId()+'_';
            panel._canvasLayerMap = {};
            $.each(panel._canvasLayerIds, function(idx,id) {
                panel._canvasLayerMap[id]={};
            });

            panel.getCanvasID = function(layerid) {
                if (!(layerid in panel._canvasLayerMap))
                    reportError('Invalid canvas id: '+layerid);
                return panel.canvasBaseId+layerid;
            };

            panel.getCanvas$El = function (layerid) {
                return $("#" + panel.getCanvasID(layerid));
            };

            panel.getCanvasElement = function (layerid) {
                return panel.getCanvas$El(layerid)[0];
            };

            panel.createHtml = function() {
                var rootDiv = DOM.Div({id: panel.getId()+'_content'});
                rootDiv.addCssClass('AXMHtmlPanelBody');
                rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', '100%');
                rootDiv.addStyle('overflow', 'hidden');


                $.each(panel._canvasLayerIds, function(idx, layerid) {
                    var cnv = DOM.Create('canvas', { id: panel.getCanvasID(layerid), parent: rootDiv });
                    //cnv.addAttribute("width", that._cnvWidth);
                    //cnv.addAttribute("height", that._cnvHeight);
                    //cnv.setWidthPx(that._cnvWidth).setHeightPx(that._cnvHeight);
                    cnv.addStyle("position","absolute");
                    cnv.addStyle("left","0");
                    cnv.addStyle("top","0");
                });

                return rootDiv.toString();
            };

            panel.attachEventHandlers = function() {
                //if (panel._rootControl)
                //    return panel._rootControl.attachEventHandlers();
            };


            panel.resize = function(xl, yl, params) {
                //panel._cnvWidth = $('#' + panel.getId()+'_content').innerWidth();
                //panel._cnvHeight = $('#' + panel.getId()+'_content').innerHeight();
                panel._cnvWidth = xl;
                panel._cnvHeight = yl;

                var context = panel.getCanvasElement('main').getContext("2d");
                panel.devicePixelRatio = window.devicePixelRatio || 1;
                panel.backingStoreRatio = context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1;

                panel.ratio = panel.devicePixelRatio / panel.backingStoreRatio;

                $.each(panel._canvasLayerIds, function(idx, layerid) {
                    var $El = panel.getCanvas$El(layerid);
                    $El.width((panel._cnvWidth)+'px');
                    $El.height((panel._cnvHeight)+'px');
                });

                if (!params.resizing) {
                    $.each(panel._canvasLayerIds, function(idx, layerid) {
                        var canvasElement = panel.getCanvasElement(layerid);
                        if (canvasElement) {
                            canvasElement.width = panel._cnvWidth*panel.ratio;
                            canvasElement.height = panel._cnvHeight*panel.ratio;
                        }
                    });
                    panel.render();
                }
            };



            panel.render_exec = function () {
                var ctx = panel.getCanvasElement('main').getContext("2d");
                ctx.scale(panel.ratio, panel.ratio);
                ctx.fillStyle="#FFFF00";
                ctx.fillRect(0, 0, panel._cnvWidth,panel._cnvHeight);
                var drawInfo = {
                    ctx: ctx,
                    sizeX: panel._cnvWidth,
                    sizeY: panel._cnvHeight
                };
                panel.draw(drawInfo);
            }

            panel.render = function () {
                panel.render_exec();
            }

            //that.invalidate = DQX.debounce(that.render, 150);

            // Override this function
            panel.draw = function(drawInfo) {
                drawInfo.ctx.beginPath();
                drawInfo.ctx.moveTo(0, 0);
                drawInfo.ctx.lineTo(drawInfo.sizeX, drawInfo.sizeY);
                drawInfo.ctx.stroke();
            };

            panel.getEventPosX = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return ev1.pageX - panel.getCanvas$El('main').offset().left;
            }

            panel.getEventPosY = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return ev1.pageY - panel.getCanvas$El('main').offset().top;
            }



            return panel;
        } ;

        return Module;
    });

