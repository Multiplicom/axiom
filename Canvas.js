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
        "AXM/AXMUtils", "AXM/DOM"],
    function (
        require, $, _,
        AXMUtils, DOM) {

        var Module = {};

        /**
         * Creates an object that encapsulates a layered canvas element
         * @param {string} id - unique id of the canvas element
         * @param [] layers - list of layer ids
         * @returns {{}} - canvas object instance
         * @constructor
         */
        Module.create = function(id, layers) {
            var cnvs = AXMUtils.object('@Canvas');

            cnvs._id = id;
            cnvs._canvasLayerIds = layers;
            cnvs._baseLayerId = layers[0];
            cnvs.canvasBaseId = 'CNV_'+cnvs._id+'_';
            cnvs._canvasLayerMap = {};
            $.each(cnvs._canvasLayerIds, function(idx,id) {
                cnvs._canvasLayerMap[id]={};
            });

            /**
             * Returns the html element id of a canvas associated with a specific layer
             * @param {string} layerid - layer identifier
             * @returns {string} - html id
             */
            cnvs.getCanvasID = function(layerid) {
                if (!(layerid in cnvs._canvasLayerMap))
                    AXMUtils.Test.reportBug('Invalid canvas id: '+layerid);
                return cnvs.canvasBaseId+layerid;
            };

            /**
             * Returns the jquery element of a canvas associated with a specific layer
             * @param {string} layerid - layer identifier
             * @returns {jQuery} - jquery element
             */
            cnvs.getCanvas$El = function (layerid) {
                return $("#" + cnvs.getCanvasID(layerid));
            };


            /**
             * Returns the html element of a canvas associated with a specific layer
             * @param {string} layerid - layer identifier
             * @returns {htmlElement} - html element
             */
            cnvs.getCanvasElement = function (layerid) {
                return cnvs.getCanvas$El(layerid)[0];
            };

            /**
             * Returns the html implementing the panel
             * @returns {string}
             */
            cnvs.render = function() {
                var rootDiv = DOM.Div({id: "cnvs_" + cnvs._id+'_content'});
                rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', '100%');
                rootDiv.addStyle('overflow', 'hidden');


                $.each(cnvs._canvasLayerIds, function(idx, layerid) {
                    var cnv = DOM.Create('canvas', { id: cnvs.getCanvasID(layerid), parent: rootDiv });
                    cnv.addStyle("position","absolute");
                    cnv.addStyle("left","0");
                    cnv.addStyle("top","0");
                });

                return rootDiv.toString();
            };

            /**
             * Resizes the panel
             * @param {int} xl - new x dimension
             * @param {int} yl - new y dimension
             * @param params
             */
            cnvs.resize = function(xl, yl, params) {
                cnvs._cnvWidth = xl;
                cnvs._cnvHeight = yl;

                var context = cnvs.getCanvasElement(cnvs._baseLayerId).getContext("2d");
                cnvs.devicePixelRatio = window.devicePixelRatio || 1;
                cnvs.backingStoreRatio = context.webkitBackingStorePixelRatio ||
                    context.mozBackingStorePixelRatio ||
                    context.msBackingStorePixelRatio ||
                    context.oBackingStorePixelRatio ||
                    context.backingStorePixelRatio || 1;

                cnvs.ratio = cnvs.devicePixelRatio / cnvs.backingStoreRatio;

                $.each(cnvs._canvasLayerIds, function(idx, layerid) {
                    var $El = cnvs.getCanvas$El(layerid);
                    $El.width((cnvs._cnvWidth)+'px');
                    $El.height((cnvs._cnvHeight)+'px');
                });

                if (!params.resizing) {
                    $.each(cnvs._canvasLayerIds, function(idx, layerid) {
                        var canvasElement = cnvs.getCanvasElement(layerid);
                        if (canvasElement) {
                            canvasElement.width = cnvs._cnvWidth*cnvs.ratio;
                            canvasElement.height = cnvs._cnvHeight*cnvs.ratio;
                        }
                    });
                }
            };

            cnvs.getHeight = function() {
                return cnvs._cnvHeight;
            };


            cnvs.getRenderContext = function(layerId) {
                var ctx = cnvs.getCanvasElement(layerId).getContext("2d");
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(cnvs.ratio, cnvs.ratio);
                return ctx;
            };

            /**
             * Renders the drawing in the canvas element
             */
            cnvs.render_exec = function (layerid) {
                if(cnvs.getCanvas$El(layerid).length){  // Check if the element still exists
                    var ctx = cnvs.getRenderContext(layerid);
                    //ctx.fillStyle="#FFFFFF";
                    //ctx.fillRect(0, 0, cnvs._cnvWidth,cnvs._cnvHeight);
                    var drawInfo = {
                        ctx: ctx,
                        sizeX: cnvs._cnvWidth,
                        sizeY: cnvs._cnvHeight,
                        layerId: layerid
                    };
                    cnvs.draw(drawInfo);
                }
            };


            /**
             * Renders the drawing in the canvas element for all layers
             */
            cnvs.render = function () {
                $.each(cnvs._canvasLayerIds, function(idx, layerId) {
                    cnvs.render_exec(layerId);
                });
            };

            /**
             * Renders the drawing in the canvas element for a specific layer
             */
            cnvs.renderLayer = function (layerId) {
                cnvs.render_exec(layerId);
            };


            /**
             * Implements the drawing to the canvas element (to be overriden in derived classes)
             * @param {{}} drawInfo - drawing info
             * @param {} drawInfo.ctx - drawing context
             * @param {int} drawInfo.sizeX - X size
             * @param {int} drawInfo.sizeY - Y size
             * @param {string} drawInfo.layerId - layer ID
             */
            cnvs.draw = function(drawInfo) {
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
            cnvs.getEventPosX = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return ev1.pageX - cnvs.getCanvas$El(cnvs._baseLayerId).offset().left;
            };


            /**
             * Returns the Y position contained in a html event object
             * @param {{}} ev - html event object
             * @returns {number} - returns the Y position
             */
            cnvs.getEventPosY = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return ev1.pageY - cnvs.getCanvas$El(cnvs._baseLayerId).offset().top;
            };


            /**
             * Converts a canvas X position to browser x position
             * @param {int} px - x position
             * @returns {int}
             */
            cnvs.posXCanvas2Screen = function (px) {
                return px + cnvs.getCanvas$El(cnvs._baseLayerId).offset().left;
            };

            /**
             * Converts a canvas Y position to browser y position
             * @param {int} py - y position
             * @returns {int}
             */
            cnvs.posYCanvas2Screen = function (py) {
                return py + cnvs.getCanvas$El(cnvs._baseLayerId).offset().top;
            };


            /**
             * Generates a data url for canvas element content
             * @returns {string}
             */
            cnvs.getDataUrl = function() {
                return cnvs.getCanvasElement(cnvs._baseLayerId).toDataURL('image/png');
            }

            /**
             * Saves the canvas element content to a data url
             */
            cnvs.save = function() {
                window.open(cnvs.getDataUrl(),'_blank');
            };

            /**
             * Saves the canvas element to a local file
             */
            cnvs.saveLocalFile = function() {
                AXMUtils.saveDataUrl(cnvs.getDataUrl(), 'plot.png');
            };


            return cnvs;
        };

        return Module;
    });

