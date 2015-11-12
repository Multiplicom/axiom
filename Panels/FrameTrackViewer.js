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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Panels/PanelBase", "AXM/Panels/Frame", "AXM/Canvas", "AXM/DrawUtils"],
    function (require, $, _,
              AXMUtils, DOM, PanelBase, Frame, Canvas, DrawUtils) {


        /**
         * Module encapsulating a panel with a html5 canvas element
         * @type {{}}
         */
        var Module = {};

        Module._trackOffsetLeft = 20;
        Module._trackOffsetRight = 20;

        Module.Track = function () {
            var track = AXMUtils.object('@TrackViewTrack');
            track._id = AXMUtils.getUniqueID();
            track._width = 1;
            track._fixedHeight = 60;
            track.cnvs = Canvas.create(track._id, ['main', 'selection']);

            track.getId = function () {
                return track._id;
            };

            track.setViewerPanel = function(panel) {
                track._panel = panel;
            };

            track.getViewerPanel = function() {
                if (!track._panel)
                    AXMUtils.Test.reportBug("Track panel not assigned");
                return track._panel;
            };

            track.getWidth = function() {
                return track._width;
            };


            track.createHtml = function () {
                var rootDiv = DOM.Div({id: 'track_' + track.getId()});
                //rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', track._fixedHeight + "px");
                rootDiv.addStyle('border-bottom', "1px solid rgb(220,220,220)");
                rootDiv.addStyle('background-color', "rgb(240,240,240)");


                var leftDiv = DOM.Div({parent: rootDiv});
                leftDiv.addStyle("display", "inline-block");
                leftDiv.addStyle("width", Module._trackOffsetLeft + "px");

                var centerDiv = DOM.Div({parent: rootDiv});
                centerDiv.addStyle("display", "inline-block");
                centerDiv.addStyle('position', 'relative');
                centerDiv.addElem(track.cnvs.createHtml());
                return rootDiv.toString();
            };

            /**
             * Attached the html event handlers after DOM insertion
             */
            track.attachEventHandlers = function() {
                var clickLayer$El = track.cnvs.getCanvas$El('selection');
                var viewerPanel = track.getViewerPanel();
                AXMUtils.create$ElScrollHandler(clickLayer$El, viewerPanel._handleScrolled);
                AXMUtils.create$ElDragHandler(clickLayer$El, viewerPanel._panningStart, viewerPanel._panningDo, viewerPanel._panningStop);
                //clickLayer$El.mousemove(panel._onMouseMove);
                //clickLayer$El.click(panel._onClick);
            };

            /**
             * Detach the html event handlers
             */
            track.detachEventHandlers = function() {
                var clickLayer$El = track.cnvs.getCanvas$El('selection');
                AXMUtils.remove$ElScrollHandler(clickLayer$El);
                AXMUtils.remove$ElDragHandler(clickLayer$El);
                //clickLayer$El.unbind('mousemove');
                //clickLayer$El.unbind('click');
            };


            track.resize = function (xl, yl, params) {
                track._width = xl;
                track.cnvs.resize(xl-Module._trackOffsetLeft-Module._trackOffsetRight, track._fixedHeight, params);
            };

            track.render = function() {
                track.cnvs.render();
            };

            /**
             * Draws the main view of the track - to be overridden
             * @param drawInfo
             */
            track.drawMain = function(drawInfo) {
                drawInfo.ctx.fillStyle="#FFFFFF";
                drawInfo.ctx.fillRect(0, 0, drawInfo.sizeX, drawInfo.sizeY);
                drawInfo.ctx.beginPath();
                drawInfo.ctx.moveTo(0, 0);
                drawInfo.ctx.lineTo(drawInfo.sizeX/2, drawInfo.sizeY);
                drawInfo.ctx.stroke();
            };

            track.cnvs.draw = function(drawInfo) {
                if (drawInfo.layerId == "main")
                    track.drawMain(drawInfo);
            };


            return track;
        };





        Module.Track_Position = function () {
            var track = Module.Track();

            track.drawMain = function(drawInfo) {
                var viewerPanel = track.getViewerPanel();
                var zoomFactor = viewerPanel.getZoomFactor();
                var XLogic2Display = viewerPanel.XLogic2Display;
                var ctx = drawInfo.ctx;
                var sizeX = drawInfo.sizeX;
                var sizeY = drawInfo.sizeY;

                ctx.fillStyle="#FFFFFF";
                ctx.fillRect(0, 0, sizeX, sizeY);

                var plotLimitXMin = viewerPanel.clipToRange(viewerPanel.XDisplay2Logic(0-50));
                var plotLimitXMax = viewerPanel.clipToRange(viewerPanel.XDisplay2Logic(sizeX+50));

                var scale = DrawUtils.getScaleJump(30/zoomFactor);

                ctx.save();
                ctx.font = "10px Arial";
                ctx.fillStyle = "rgb(0,0,0)";
                ctx.textAlign = 'center';
                var ticks = [];
                scale.Jump1 = Math.max(viewerPanel._minScaleUnit, scale.Jump1);
                scale.Jump2 = Math.max(viewerPanel._minScaleUnit, scale.Jump2);
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
                        var px = Math.round(XLogic2Display(tick.value)) - 0.5;
                        if (tick.label) {
                            ctx.fillText(tick.label, px, 6 + 13);
                            //if (tick.label2)
                            //    ctx.fillText(tick.label2, px, drawInfo.sizeY - panel.scaleMarginY + 23);
                            ctx.strokeStyle = "rgba(0,0,0,0.3)";
                            var ticklen = 7;
                        }
                        else {
                            ctx.strokeStyle = "rgba(0,0,0,0.2)";
                            var ticklen = 4;
                        }
                        ctx.beginPath();
                        ctx.moveTo(px, 0);
                        ctx.lineTo(px, ticklen);
                        ctx.stroke();
                    }
                });
                ctx.restore();


            };

            return track;
        };





        /**
         * Implements a panel that contains a html5 canvas element
         * @param {string} id - panel type id
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.PanelTrackViewer = function (id) {
            var panel = PanelBase.create(id);


            panel._offset = 0;
            panel._zoomfactor = 1.0;
            panel._rangeMin = 0.0;
            panel._rangeMax = 1.0;
            panel._tracks = [];
            panel._minScaleUnit = 0;
            panel._maxZoomFactor = 1.0e99;
            panel._isrunning = false;


            /**
             * Sets the minimum size of a single scale unit, in logical coordinates
             * @param {value} minSize
             */
            panel.setMinScaleUnit = function(minSize) {
                panel._minScaleUnit = minSize;
            };


            /**
             * Sets the maximum horizontal zoom factor
             * @param {value} fact
             */
            panel.setMaxZoomFactor = function(fact) {
                panel._maxZoomFactor = fact;
            };


            /**
             * Sets the X range of the viewer
             * @param {value} rangeMin
             * @param {value} rangeMax
             */
            panel.setRange = function(rangeMin, rangeMax) {
                panel._rangeMin = rangeMin;
                panel._rangeMax = rangeMax;
                panel._restrictViewToRange();
                panel.render();
            };

            panel.addTrack = function (itrack) {
                AXMUtils.Test.checkIsType(itrack, '@TrackViewTrack');
                itrack.setViewerPanel(panel);
                panel._tracks.push(itrack);
            };


            panel.getRangeMin = function() {
                return panel._rangeMin;
            };

            panel.getRangeMax = function() {
                return panel._rangeMax;
            };

            /**
             * Clips a x position to the viewer range
             * @param {number} xval - logical x position
             * @returns {number} - clipped value
             */
            panel.clipToRange = function(xval) {
                return Math.max(panel._rangeMin, Math.min(panel._rangeMax, xval));
            };

            panel.getOffset = function() {
                return panel._offset;
            };

            panel.getZoomFactor = function() {
                return panel._zoomfactor;
            };

            panel.XDisplay2Logic = function(xdisp) {
                return xdisp/panel._zoomfactor - panel._offset;
            };

            panel.XLogic2Display = function(xlogic) {
                return (xlogic+panel._offset)*panel._zoomfactor;
            };

            /**
             * Returns the html implementing the panel
             * @returns {string}
             */
            panel.createHtml = function () {
                var rootDiv = DOM.Div({id: panel.getId() + '_content'});
                rootDiv.addCssClass('AXMHtmlPanelBody');
                rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', '100%');
                rootDiv.addStyle('overflow', 'hidden');

                $.each(panel._tracks, function (idx, track) {
                    rootDiv.addElem(track.createHtml());
                });

                return rootDiv.toString();
            };


            /**
             * Attached html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function () {
                panel._isrunning = true;
                $.each(panel._tracks, function (idx, track) {
                    track.attachEventHandlers();
                });
            };

            /**
             * Detach html event handlers
             */
            panel.detachEventHandlers = function () {
                $.each(panel._tracks, function (idx, track) {
                    track.detachEventHandlers();
                });
            };

            /**
             * Resizes the panel
             * @param {int} xl - new x dimension
             * @param {int} yl - new y dimension
             * @param params
             */
            panel.resize = function (xl, yl, params) {
                panel._width = xl;
                panel._height = yl;
                panel._restrictViewToRange();

                $.each(panel._tracks, function (idx, track) {
                    track.resize(xl, null, params);
                });
                panel.render();
            };

            panel.render = function() {
                if (!panel._isrunning)
                    return;
                $.each(panel._tracks, function (idx, track) {
                    track.render();
                });
            };


            /**
             * Modifies zoom & offset in order to fit it into the view range
             * @private
             */
            panel._restrictViewToRange = function() {
                if (!panel._isrunning || (panel._width<5))
                    return;
                var displayWidth = panel._width - Module._trackOffsetLeft - Module._trackOffsetRight;
                panel._zoomfactor = Math.max(panel._zoomfactor, displayWidth/1.1/(panel._rangeMax-panel._rangeMin));

                panel._offset = Math.max(panel._offset, -panel._rangeMax+displayWidth*29.0/30.0/panel._zoomfactor);

                panel._offset = Math.min(panel._offset, -panel._rangeMin+displayWidth/30.0/panel._zoomfactor);
            };

            panel._handleZoom = function(scaleFactor, centralPx) {

                var z1 = panel._zoomfactor;
                var z2 = panel._zoomfactor * scaleFactor;
                z2 = Math.min(z2,panel._maxZoomFactor);
                panel._zoomfactor = z2;
                panel._offset = panel._offset + (1.0/z2-1.0/z1)*centralPx;
                panel._restrictViewToRange();
                panel.render();
            };

            panel._handleMoveX = function(offsetDiff) {
                panel._offset += offsetDiff;
                panel._restrictViewToRange();
                panel.render();
            };

            /**
             * Returns the X position contained in a html event object
             * @param {{}} ev - html event object
             * @returns {number} - returns the X position
             */
            panel._getEventPosX = function (ev) {
                //todo: improve (a bit of a hack right now)
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return ev1.pageX - panel._tracks[0].cnvs.getCanvas$El('main').offset().left;
            };


            panel._handleScrolled = function(params) {
                var delta = params.deltaY;
                if (delta!=0) {
                    if (delta < 0)//zoom out
                        var scaleFactor = 1.0 / (1.0 + 0.2 * Math.abs(delta));
                    else//zoom in
                        var scaleFactor = 1.0 + 0.2 * Math.abs(delta);
                    var px = panel._getEventPosX(params.event);
                    panel._handleZoom(scaleFactor, px);
                }
            };

            panel._panningStart = function(params) {
                panel._hasPannedX = false;
                panel._panning_x0 = 0;
                panel._panning_y0 = 0;
            };
            panel._panningDo = function(dragInfo) {
                if (Math.abs(dragInfo.diffTotalX)>10)
                    panel._hasPannedX = true;
                if (panel._hasPannedX) {
                    panel._handleMoveX((dragInfo.diffTotalX-panel._panning_x0)/panel._zoomfactor);
                    panel._panning_x0 = dragInfo.diffTotalX;
                }
            };
            panel._panningStop = function() {

            };



            return panel;
        };


        Module.FrameTrackViewer = function () {
            var thePanel = Module.PanelTrackViewer();
            var theFrame = Frame.FrameFinalCommands(thePanel);

            theFrame.getPanel = function () {
                return thePanel;
            };

            theFrame.addCommand({
                icon: "fa-search-minus",
                hint: _TRL("Zoom out")
            }, function () {
            });

            theFrame.addCommand({
                icon: "fa-search-plus",
                hint: _TRL("Zoom in")
            }, function () {
            });

            return theFrame;
        };


        return Module;
    })
;

