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


        /**
         * Module encapsulating a panel with a html5 canvas element
         * @type {{}}
         */
        var Module = {};


        /**
         * Implements a panel that contains a html5 canvas element
         * @param {string} id - panel type id
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.create = function(id) {
            var panel = PanelBase.create(id);

            panel._canvasLayerIds = ['main','selection'];
            panel.canvasBaseId = 'CNV_'+panel.getId()+'_';
            panel._canvasLayerMap = {};
            $.each(panel._canvasLayerIds, function(idx,id) {
                panel._canvasLayerMap[id]={};
            });


            /**
             * Returns the html element id of a canvas associated with a specific layer
             * @param {string} layerid - layer identifier
             * @returns {string} - html id
             */
            panel.getCanvasID = function(layerid) {
                if (!(layerid in panel._canvasLayerMap))
                    reportError('Invalid canvas id: '+layerid);
                return panel.canvasBaseId+layerid;
            };

            /**
             * Returns the jquery element of a canvas associated with a specific layer
             * @param {string} layerid - layer identifier
             * @returns {jQuery} - jquery element
             */
            panel.getCanvas$El = function (layerid) {
                return $("#" + panel.getCanvasID(layerid));
            };


            /**
             * Returns the html element of a canvas associated with a specific layer
             * @param {string} layerid - layer identifier
             * @returns {htmlElement} - html element
             */
            panel.getCanvasElement = function (layerid) {
                return panel.getCanvas$El(layerid)[0];
            };


            /**
             * Returns the html implementing the panel
             * @returns {string}
             */
            panel.createHtml = function() {
                var panelBody = DOM.Div({ id: panel.getId() + "_content" });
                panelBody.addCssClass("AXMHtmlPanelBody");
                panelBody.addStyle("width", "100%");
                panelBody.addStyle("height", "100%");
                panelBody.addStyle("overflow", "hidden");

                for (const layerId of panel._canvasLayerIds) {
                    var layer = DOM.Create("canvas", {
                        id: panel.getCanvasID(layerId),
                        parent: panelBody
                    });
                    layer.addStyle("position", "absolute");
                    layer.addStyle("left", "0");
                    layer.addStyle("top", "0");
                }

                return panelBody.toString();
            };


            /**
             * Attached html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function() {
            };

            panel.detachEventHandlers = function() {
            };

            /**
             * Resizes the panel
             * @param {int} xl - new x dimension
             * @param {int} yl - new y dimension
             * @param params
             */
            panel.resize = function(xl, yl, params) {
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


            /**
             * Renders the drawing in the canvas element
             */
            panel.render_exec = function () {
                var ctx = panel.getCanvasElement('main').getContext("2d");
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(panel.ratio, panel.ratio);
                ctx.fillStyle="#FFFFFF";
                ctx.fillRect(0, 0, panel._cnvWidth,panel._cnvHeight);
                var drawInfo = {
                    ctx: ctx,
                    sizeX: panel._cnvWidth,
                    sizeY: panel._cnvHeight
                };
                panel.draw(drawInfo);
            };


            /**
             * Renders the drawing in the canvas element
             */
            panel.render = function () {
                panel.render_exec();
            };


            /**
             * Implements the drawing to the canvas element (to be overriden in derived classes)
             * @param {{}} drawInfo - drawing info
             */
            panel.draw = function(drawInfo) {
                drawInfo.ctx.beginPath();
                drawInfo.ctx.moveTo(0, 0);
                drawInfo.ctx.lineTo(drawInfo.sizeX, drawInfo.sizeY);
                drawInfo.ctx.stroke();
            };


            /**
             * Returns the X position contained in a html event object
             * @param {{}} ev - html event object
             * @returns {number} - returns the X position
             */
            panel.getEventPosX = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return ev1.pageX - panel.getCanvas$El('main').offset().left;
            };


            /**
             * Returns the Y position contained in a html event object
             * @param {{}} ev - html event object
             * @returns {number} - returns the Y position
             */
            panel.getEventPosY = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return ev1.pageY - panel.getCanvas$El('main').offset().top;
            };


            /**
             * Converts a canvas X position to browser x position
             * @param {int} px - x position
             * @returns {int}
             */
            panel.posXCanvas2Screen = function (px) {
                return px + panel.getCanvas$El('main').offset().left;
            };

            /**
             * Converts a canvas Y position to browser y position
             * @param {int} py - y position
             * @returns {int}
             */
            panel.posYCanvas2Screen = function (py) {
                return py + panel.getCanvas$El('main').offset().top;
            };


            /**
             * Saves the canvas element content to a data url
             */
            panel.save = function() {
                var win=window.open('', '_blank');
                win.document.write("<img src='"+ panel.getDataUrl() +"'/>");
            };

            /**
             * Generates a data url for the panel canvas element content
             * @returns {string}
             */
            panel.getDataUrl = function() {
                return panel.getCanvasElement('main').toDataURL('image/png');
            }

            /**
             * Saves the panel canvas element to a local file
             */
            panel.saveLocalFile = function() {
                AXMUtils.saveDataUrl(panel.getDataUrl(), 'plot.png');
            };

            return panel;
        } ;

        return Module;
    });

