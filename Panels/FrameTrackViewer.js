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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Panels/PanelBase", "AXM/Panels/Frame",
        "AXM/Canvas", "AXM/DrawUtils", "AXM/Color", "AXM/Icon", "AXM/Controls/Controls"
    ],
    function (require, $, _,
              AXMUtils, DOM, PanelBase, Frame,
              Canvas, DrawUtils, Color, Icon, Controls
    ) {


        /**
         * Module encapsulating a panel with a html5 canvas element
         * @type {{}}
         */
        var Module = {};

        Module._trackOffsetLeft = 20;
        Module._trackOffsetRight = 0;
        Module._leftRightOffsetMarginH = 1;
        Module._trackMarginV = 2;
        Module._scrollYArrowSize = 20;

        Module.Track = function (settings) {
            var track = AXMUtils.object('@TrackViewTrack');
            track._id = AXMUtils.getUniqueID();
            track._visible = settings.defaultVisible || false;
            track._canHide = settings.canHide || false;
            track._name = settings.name || "Track";
            track._width = 1;
            track._fixedHeight = -1;
            track.cnvs = Canvas.create(track._id, ['main', 'selection']);

            track._offsetY = 0;
            track._toolTipInfo = { ID: null };

            track.getOffsetY = function() {
                return track._offsetY;
            };

            track.setName = function(name) {
                track._name = name;
            };

            track.getName = function() {
                return track._name;
            };

            track.canHide = function() {
                return track._canHide;
            };

            track.isVisible = function() {
                return track._visible;
            };


            /**
             * Returns the Y range for vertical scrolling. To be overridden
             * @returns {number}
             */
            track.getYRange = function() {
                return 0;
            };


            /**
             * Returns tooltip information for a location
             * Optionally to be implemented in a direved class
             * @param {int} px - x position
             * @param {int} py - y position
             * @returns {{ID, px, py, content}} - tooltip info (may be null if no tooltip is to be shown)
             */
            track.getToolTipInfo = function (px, py) {
                return null;
            };


            /**
             * Optionally to be implemented by a derived class to be notified about clicks
             * @param {{}} ev - event
             * @param {{}} info - additional info
             * @param {int} info.x - mouse x position
             * @param {int} info.y - mouse y position
             * @param {int} info.pageX - mouse x full page position
             * @param {int} info.pageY - mouse y full page position
             */
            track.onMouseClick = function(ev, info) {

            };



            track.setOffsetY = function(newVal, donotUpdate) {
                track._offsetY = newVal;
                if (!donotUpdate)
                    track.render();
            };


            track.shiftOffsetY = function(shft, donotUpdate) {
                track._offsetY += shft;
                track._offsetY = Math.max(track._offsetY, 0);
                track._offsetY = Math.min(track._offsetY, track.getYRange());
                if (!donotUpdate)
                    track.render();
            };

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

            track.setFixedHeight = function(h) {
                track._fixedHeight = h;
            };

            track.hasFixedHeight = function() {
                return track._fixedHeight > 0;
            };

            track.getFixedHeight = function() {
                if (track._fixedHeight < 0)
                    AXMUtils.Test.reportBug("Track does not have fixed height");
                return track._fixedHeight;
            };

            track.getWidth = function() {
                return track._width;
            };


            track.getHeight = function() {
                return track._height;
            };


            track.createHtml = function () {
                var rootDiv = DOM.Div({id: 'track_' + track.getId()});
                if (!track.isVisible())
                    rootDiv.addStyle("display", "none");
                //rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', track._fixedHeight + "px");
                rootDiv.addStyle('border-bottom', "{w}px solid rgb(220,220,220)".AXMInterpolate({w: Module._trackMarginV}));
                //rootDiv.addStyle('background-color', "rgb(240,240,240)");
                rootDiv.addStyle('white-space', "nowrap");
                rootDiv.addStyle('vertical-align', "top");


                var leftDiv = DOM.Div({parent: rootDiv});
                leftDiv.addStyle("display", "inline-block");
                leftDiv.addStyle('vertical-align', "top");
                leftDiv.addStyle("width", (Module._trackOffsetLeft-1) + "px");
                leftDiv.addStyle("height", "100%");
                leftDiv.addStyle("border-right", "1px solid rgb(220,220,220)");

                var centerDiv = DOM.Div({parent: rootDiv});
                centerDiv.addCssClass("TrackCenter");
                centerDiv.addStyle("display", "inline-block");
                centerDiv.addStyle('vertical-align', "top");
                centerDiv.addStyle('position', 'relative');
                centerDiv.addElem(track.cnvs.createHtml());

                var rightDiv = DOM.Div({parent: rootDiv});
                rightDiv.addStyle("display", "inline-block");
                rightDiv.addStyle('vertical-align', "top");
                rightDiv.addStyle("width", (Module._trackOffsetRight-1) + "px");
                rightDiv.addStyle("border-left", "1px solid rgb(220,220,220)");
                rightDiv.addStyle("height", "100%");

                return rootDiv.toString();
            };

            track.setVisible = function(status) {
                track._visible = status;
                var $El = $('#track_' + track.getId());
                if (!status)
                    $El.hide();
                else
                    $El.show();
                if(track.__ctrl_visible){
                    track.__ctrl_visible.setValue(status, true);
                }
            };


            /**
             * Display a tooltip
             * @param tooltipInfo
             * @private
             */
            track._showToolTip = function(tooltipInfo) {
                track._hideToolTip();
                track._toolTipInfo = tooltipInfo;
                if (tooltipInfo && tooltipInfo.content) {
                    AXMReq(tooltipInfo.ID);
                    AXMReq(tooltipInfo.px);
                    AXMReq(tooltipInfo.py);
                    var tooltip = DOM.Div();
                    tooltip.addCssClass("AXMToolTip");
                    tooltip.addStyle("position", "absolute");
                    var screenX = track.cnvs.posXCanvas2Screen(track._toolTipInfo.px);
                    var screenY = track.cnvs.posYCanvas2Screen(track._toolTipInfo.py);
                    tooltip.addStyle("left", (screenX + 10) + 'px');
                    tooltip.addStyle("top", (screenY + 10) + 'px');
                    tooltip.addStyle("z-index", '9999999');
                    tooltip.addElem(track._toolTipInfo.content);
                    $('.AXMContainer').append(tooltip.toString());
                }
            };


            /**
             * Hides a displayed tooltip, if any
             * @private
             */
            track._hideToolTip = function() {
                track._toolTipInfo.ID = null;
                $('.AXMContainer').find('.AXMToolTip').remove();
            };


            /**
             * Attached the html event handlers after DOM insertion
             */
            track.attachEventHandlers = function() {
                var clickLayer$El = track.cnvs.getCanvas$El('selection');
                var viewerPanel = track.getViewerPanel();
                AXMUtils.create$ElScrollHandler(clickLayer$El, function(params) { viewerPanel._handleScrolled(params,track) }, true);
                AXMUtils.create$ElDragHandler(
                    clickLayer$El,
                    track._panningStart,
                    track._panningDo,
                    track._panningStop
                );
                clickLayer$El.mousemove(track._onMouseMove);
                clickLayer$El.click(track._onClick);

                clickLayer$El.mouseleave(function() {
                    track._hideToolTip();
                });
            };

            /**
             * Detach the html event handlers
             */
            track.detachEventHandlers = function() {
                var clickLayer$El = track.cnvs.getCanvas$El('selection');
                AXMUtils.remove$ElScrollHandler(clickLayer$El);
                AXMUtils.remove$ElDragHandler(clickLayer$El);
                clickLayer$El.unbind('mousemove');
                clickLayer$El.unbind('click');
                clickLayer$El.unbind('mouseleave');
            };


            track.resize = function (xl, yl, params) {
                track._width = xl;
                track._height = yl;
                if (track.hasFixedHeight())
                    track._height = track._fixedHeight;

                var centerWidth = xl-Module._trackOffsetLeft-Module._trackOffsetRight-2*Module._leftRightOffsetMarginH;

                var root$El = $('#track_' + track.getId());
                root$El.height(track._height);
                root$El.children(".TrackCenter").width(centerWidth);

                track.cnvs.resize(
                    centerWidth,
                    track._height,
                    params);
            };

            track.render = function() {
                track._maxOffsetY = track.getYRange()-track.cnvs.getHeight();
                track._offsetY = Math.max(Math.min(track._offsetY, track._maxOffsetY), 0);
                track.cnvs.render();
            };

            track.renderLayer = function(layerId) {
                track._maxOffsetY = track.getYRange()-track.cnvs.getHeight();
                track._offsetY = Math.max(Math.min(track._offsetY, track._maxOffsetY), 0);
                track.cnvs.renderLayer(layerId);
            };

            track.DrawTicks = function(drawInfo) {
                var viewerPanel = track.getViewerPanel();
                var zoomFactor = viewerPanel.getZoomFactor();
                var XPosLogic2Display = viewerPanel.XPosLogic2Display;
                var ctx = drawInfo.ctx;
                var sizeX = drawInfo.sizeX;
                var sizeY = drawInfo.sizeY;
                var plotLimitXMin = viewerPanel.clipToRange(viewerPanel.XDisplay2Logic(0-50));
                var plotLimitXMax = viewerPanel.clipToRange(viewerPanel.XDisplay2Logic(sizeX+50));

                var scale = viewerPanel.getXScale();

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
                ctx.strokeStyle = "rgba(0,0,0,0.04)";
                $.each(ticks, function (idx, tick) {
                    if ((tick.value >= plotLimitXMin) && (tick.value <= plotLimitXMax)) {
                        var px = Math.round(XPosLogic2Display(tick.value)) - 0.5;
                        //if (tick.label) {
                        //}
                        //else {
                        //    ctx.strokeStyle = "rgba(0,0,0,0.05)";
                        //}
                        ctx.beginPath();
                        ctx.moveTo(px, 0);
                        ctx.lineTo(px, sizeY);
                        ctx.stroke();
                    }
                });
            }

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

            /**d
             * Draws the selection the track
             * @param drawInfo
             */
            track.drawSelection = function(drawInfo) {
                var viewerPanel = track.getViewerPanel();
                var zoomFactor = viewerPanel.getZoomFactor();
                var XPosLogic2Display = viewerPanel.XPosLogic2Display;
                var ctx = drawInfo.ctx;
                var sizeX = drawInfo.sizeX;
                var sizeY = drawInfo.sizeY;
                ctx.clearRect(0, 0, drawInfo.sizeX, drawInfo.sizeY);

                if (viewerPanel._selEnd >= viewerPanel._selStart) {
                    var x1 = XPosLogic2Display(viewerPanel._selStart);
                    var x2 = XPosLogic2Display(viewerPanel._selEnd+1);
                    ctx.fillStyle="rgba(0,128,255,0.3)";
                    ctx.fillRect(x1, 0, 1, sizeY);
                    ctx.fillRect(x2, 0, 1, sizeY);
                }
            };


            track.drawYScrollArrows = function(drawInfo) {
                var ctx = drawInfo.ctx;
                var sizeX = drawInfo.sizeX;
                var sizeY = drawInfo.sizeY;
                track._arrowScrollYCenterX = sizeX/2;
                var sz = Module._scrollYArrowSize;
                track._hasArrowScrollYDown = false;
                track._hasArrowScrollYUp = false;
                ctx.fillStyle=AXMBaseStyling.color1.changeOpacity(0.4).toStringCanvas();
                ctx.strokeStyle = Color.Color(0,0,0).changeOpacity(0.1).toStringCanvas();
                if (track._offsetY>0) {
                    track._hasArrowScrollYDown = true;
                    ctx.beginPath();
                    ctx.moveTo(track._arrowScrollYCenterX, sizeY);
                    ctx.lineTo(track._arrowScrollYCenterX+sz, sizeY-sz);
                    ctx.lineTo(track._arrowScrollYCenterX-sz, sizeY-sz);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                if (track._offsetY<track._maxOffsetY) {
                    track._hasArrowScrollYUp = true;
                    ctx.beginPath();
                    ctx.moveTo(track._arrowScrollYCenterX, 0);
                    ctx.lineTo(track._arrowScrollYCenterX+sz, 0+sz);
                    ctx.lineTo(track._arrowScrollYCenterX-sz, 0+sz);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                if (track._maxOffsetY>0) {
                    ctx.fillRect(sizeX-7, sizeY-sizeY*(track._offsetY+sizeY)*1.0/(track._maxOffsetY+sizeY), 7, sizeY*sizeY*1.0/(track._maxOffsetY+sizeY));
                }
            };


            track.cnvs.draw = function(drawInfo) {
                track._drawSizeY = drawInfo.sizeY;
                if (drawInfo.layerId == "main") {
                    track.drawMain(drawInfo);
                    track.drawYScrollArrows(drawInfo);
                }
                if (drawInfo.layerId == "selection") {
                    track.drawSelection(drawInfo);
                }
            };


            track._getEventPos = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                return {
                    x: ev1.pageX - track.cnvs.getCanvas$El('main').offset().left,
                    y: ev1.pageY - track.cnvs.getCanvas$El('main').offset().top,
                };
            };


            track._isInsidescrollYArrowUp = function(posit) {
                if (!track._hasArrowScrollYUp)
                    return false;
                if (Math.abs(posit.x-track._arrowScrollYCenterX)>Module._scrollYArrowSize)
                    return false;
                if (posit.y>Module._scrollYArrowSize)
                    return false;
                return (posit.y >= Math.abs(posit.x-track._arrowScrollYCenterX));
            };


            track._isInsidescrollYArrowDown = function(posit) {
                if (!track._hasArrowScrollYDown)
                    return false;
                if (Math.abs(posit.x-track._arrowScrollYCenterX)>Module._scrollYArrowSize)
                    return false;
                if (posit.y<track._drawSizeY-Module._scrollYArrowSize)
                    return false;
                return (posit.y <= track._drawSizeY-Math.abs(posit.x-track._arrowScrollYCenterX));
            };


            track._panningStart = function(params) {
                track._hideToolTip();
                var posit = track._getEventPos(params.event);

                track.clickScrollingYUp = false;
                track.clickScrollingYDown = false;

                if (track._isInsidescrollYArrowUp(posit)) {
                    track.clickScrollingYUp = true;
                    var _repeater = function() {
                        if (!track.clickScrollingYUp)
                            return;
                        track.shiftOffsetY(30);
                        setTimeout(_repeater, 25);
                    };
                    _repeater();
                }


                if (track._isInsidescrollYArrowDown(posit)) {
                    track.clickScrollingYDown = true;
                    var _repeater = function() {
                        if (!track.clickScrollingYDown)
                            return;
                        track.shiftOffsetY(-30);
                        setTimeout(_repeater, 50);
                    };
                    _repeater();
                }


                if ((!track.clickScrollingYUp) && (!track.clickScrollingYDown)) {
                    var viewerPanel = track.getViewerPanel();
                    viewerPanel._panningStart(params, track);
                }

            };

            track._panningDo = function(params) {
                if ((!track.clickScrollingYUp) && (!track.clickScrollingYDown)) {
                    var viewerPanel = track.getViewerPanel();
                    viewerPanel._panningDo(params);
                }
            };

            track._panningStop = function(params) {
                track.clickScrollingYUp = false;
                track.clickScrollingYDown = false;
                if ((!track.clickScrollingYUp) && (!track.clickScrollingYDown)) {
                    var viewerPanel = track.getViewerPanel();
                    viewerPanel._panningStop(params);
                }
            };

            track._onMouseMove = function(ev) {
                var viewerPanel = track.getViewerPanel();
                if (_AXM_HasTransientPopups && _AXM_HasTransientPopups()) {
                    track._hideToolTip();
                    return;
                }
                if (viewerPanel.isPanning()) {
                    track._hideToolTip();
                    return;
                }
                var posit = track._getEventPos(ev);
                var showPointer = false;
                if (track._isInsidescrollYArrowUp(posit) || track._isInsidescrollYArrowDown(posit)) {
                    track._hideToolTip();
                    showPointer = true;
                }
                else {
                    var newToolTipInfo = track.getToolTipInfo(posit.x, posit.y);
                    if (newToolTipInfo) {
                        if (newToolTipInfo.showPointer)
                            showPointer = true;
                        if (track._toolTipInfo.ID != AXMReq(newToolTipInfo.ID))
                            track._showToolTip(newToolTipInfo);
                    }
                    else
                        track._hideToolTip();
                }
                var pointerType = showPointer?"pointer":"auto";
                track.cnvs.getCanvas$El('main').css('cursor', pointerType);
                track.cnvs.getCanvas$El('selection').css('cursor', pointerType);
            };

            track._onClick = function(ev) {
                var viewerPanel = track.getViewerPanel();
                if (viewerPanel.hasDragged())
                    return;
                var posit = track._getEventPos(ev);
                if (track._isInsidescrollYArrowUp(posit))
                    return;
                if (track._isInsidescrollYArrowDown(posit))
                    return;
                track.onMouseClick(ev, {
                    x: posit.x,
                    y: posit.y,
                    pageX: ev.pageX,
                    pageY: ev.pageY
                });
            };


            track.drawMessage = function(drawInfo, content) {
                var ctx = drawInfo.ctx;
                ctx.save();
                ctx.font = "18px Arial";
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.textAlign = 'center';
                ctx.fillText(content, drawInfo.sizeX/2, drawInfo.sizeY/2);

                ctx.restore();

            }


            return track;
        };





        Module.Track_Position = function () {
            var track = Module.Track({canHide: true, defaultVisible: true, name: "Position"});
            track.setFixedHeight(20);
            track._customLabelConvertor = null;

            track.setCustomLabelConvertor = function(handler) {
                track._customLabelConvertor = handler;
            };

            track.drawMain = function(drawInfo) {
                var viewerPanel = track.getViewerPanel();
                var zoomFactor = viewerPanel.getZoomFactor();
                var XPosLogic2Display = viewerPanel.XPosLogic2Display;
                var ctx = drawInfo.ctx;
                var sizeX = drawInfo.sizeX;
                var sizeY = drawInfo.sizeY;

                ctx.fillStyle="#FFFFFF";
                ctx.fillRect(0, 0, sizeX, sizeY);

                var plotLimitXMin = viewerPanel.clipToRange(viewerPanel.XDisplay2Logic(0-50));
                var plotLimitXMax = viewerPanel.clipToRange(viewerPanel.XDisplay2Logic(sizeX+50));

                var scale = viewerPanel.getXScale();

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
                        var px = Math.round(XPosLogic2Display(tick.value)) - 0.5;
                        if (tick.label) {
                            if (track._customLabelConvertor)
                                tick.label = track._customLabelConvertor(tick.value);
                            ctx.fillText(tick.label, px, 4 + 13);
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
            panel._selStart = -1;
            panel._selEnd = -2;
            panel._zoomfactor = 1.0;
            panel._rangeMin = 0.0;
            panel._rangeMax = 1.0;
            panel._tracks = [];
            panel._minScaleUnit = 0;
            panel._maxZoomFactor = 1.0e99;
            panel._isrunning = false;
            panel._canScrollY = false;

            panel._notificationHandlersPositionChanged = [];
            panel._notificationHandlersSelectionChanged = [];


            panel.getCenterPosition = function() {
                var displayWidth = panel._width - Module._trackOffsetLeft - Module._trackOffsetRight;
                return -panel._offset + displayWidth/2/panel._zoomfactor;
            };

            panel.setViewPosition = function(position, zoomFactor) {
                panel._zoomfactor = Math.min(zoomFactor, panel._maxZoomFactor);
                if (!panel._isrunning)
                    AXMUtils.Test.reportBug("Unable to set track viewer position: not initialised");
                var displayWidth = panel._width - Module._trackOffsetLeft - Module._trackOffsetRight;
                panel._offset = -position+displayWidth/2/panel._zoomfactor;
                panel._restrictViewToRange();
                panel.render();
                panel._notifyPosChanged();
            };

            panel.setOffsetAndZoom = function(offset, zoomFactor) {
                panel._offset = offset;
                panel._zoomfactor = zoomFactor;
                panel.render();

            };

            panel.setSelection = function(posStart, posEnd) {
                if ((panel._selStart!=posStart) || (panel._selEnd!=posEnd)) {
                    panel._selStart = posStart;
                    panel._selEnd = posEnd;
                    panel.renderLayer('selection');
                    panel._notifySelectionChanged();
                }
            };

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

            panel.addNotificationHandlersPositionChanged = function(handler) {
                panel._notificationHandlersPositionChanged.push(handler);
            };

            panel.addNotificationHandlersSelectionChanged = function(handler) {
                panel._notificationHandlersSelectionChanged.push(handler);
            };

            /**
             * Call the function to enable vertical scrolling of tracks if height becomes larger than the viewport
             */
            panel.enableScrollY = function() {
                if (panel._isrunning)
                    AXMUtils.Test.reportBug("Cannot perform this action when viewer is running");
                panel._canScrollY = true;
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

            panel.XPosLogic2Display = function(xposlogic) {
                return (xposlogic+panel._offset)*panel._zoomfactor;
            };

            panel.XLenLogic2Display = function(xlenlogic) {
                return xlenlogic*panel._zoomfactor;
            };


            panel.getXScale = function() {
                return DrawUtils.getScaleJump(30/panel.getZoomFactor());
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
                rootDiv.addStyle('overflow-x', 'hidden');
                if (panel._canScrollY)
                    rootDiv.addStyle('overflow-y', 'scroll');
                else
                    rootDiv.addStyle('overflow-y', 'hidden');

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
                panel.rescale(params);
            };

            panel.rescale = function (params) {
                var fixedPortionH = 0;
                var variablePortionBudget = 0;
                var hasVariableHeightTracks = false;
                $.each(panel._tracks, function (idx, track) {
                    if (track.isVisible()) {
                        fixedPortionH += Module._trackMarginV;
                        if (track.hasFixedHeight())
                            fixedPortionH += track.getFixedHeight();
                        else {
                            hasVariableHeightTracks = true;
                            variablePortionBudget += 1;
                        }
                    }
                });
                if (panel._canScrollY && hasVariableHeightTracks)
                    AXMUtils.Test.reportBug("Vertical scroll on track viewer is not compatible with auo scalable tracks");

                $.each(panel._tracks, function (idx, track) {
                    var tyl = null;
                    if (!track.hasFixedHeight())
                        tyl = (panel._height - fixedPortionH)*1.0/variablePortionBudget;
                    track.resize(panel._width, tyl, params);
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

            panel.renderLayer = function(layerId) {
                if (!panel._isrunning)
                    return;
                $.each(panel._tracks, function (idx, track) {
                    track.renderLayer(layerId);
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
                panel._notifyPosChanged();
            };

            panel._handleMoveX = function(offsetDiff, donotUpdate) {
                panel._offset += offsetDiff;
                panel._restrictViewToRange();
                if (!donotUpdate) {
                    panel.render();
                    panel._notifyPosChanged();
                }
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


            panel._handleScrolled = function(params, track) {
                var deltaY = params.deltaY;
                if (!params.controlPressed) { // Scroll action used for zoom
                    if (deltaY!=0) {
                        if (deltaY < 0)//zoom out
                            var scaleFactor = 1.0 / (1.0 + 0.2 * Math.abs(deltaY));
                        else//zoom in
                            var scaleFactor = 1.0 + 0.2 * Math.abs(deltaY);
                        var px = panel._getEventPosX(params.event);
                        panel._handleZoom(scaleFactor, px);
                    }
                    var deltaX = params.deltaX;
                    if (deltaX!=0) {
                        panel._handleMoveX(deltaX*30/panel._zoomfactor);
                    }
                }
                else { // Scroll action used for vertical scrolling
                    track.shiftOffsetY(deltaY*20);
                }
            };

            panel._panningStart = function(params, panningTrack) {
                panel._hasDragged = false;
                panel._hasPannedX = false;
                panel._hasPannedY = false;
                panel._panning_x0 = 0;
                panel._panning_y0 = 0;
                panel._panningTrack = panningTrack;
            };

            panel._panningDo = function(dragInfo) {
                var movedY = false;
                var movedX = false;
                if (Math.abs(dragInfo.diffTotalX)>5)
                    panel._hasPannedX = true;
                if (Math.abs(dragInfo.diffTotalY)>5)
                    panel._hasPannedY = true;
                if (panel._hasPannedY) {
                    panel._panningTrack.shiftOffsetY(dragInfo.diffTotalY-panel._panning_y0, false);
                    panel._panning_y0 = dragInfo.diffTotalY;
                    movedY = true;
                }
                if (panel._hasPannedX) {
                    panel._handleMoveX((dragInfo.diffTotalX-panel._panning_x0)/panel._zoomfactor, false);
                    panel._panning_x0 = dragInfo.diffTotalX;
                    movedX = true;
                }
                if (movedY || movedX) //we need to render explicitly in this case
                    panel.render();
                if (panel._hasPannedX || panel._hasPannedY)
                    panel._hasDragged = true;
            };

            panel._panningStop = function() {
                panel._hasPannedX = false;
                panel._hasPannedY = false;
                setTimeout(function() { panel._hasDragged=false}, 250);
            };

            panel.isPanning = function() {
                return panel._hasPannedX || panel._hasPannedY;
            };

            panel.hasDragged = function() {
                return !!panel._hasDragged;
            };

            panel._notifyPosChanged = function() {
                $.each(panel._notificationHandlersPositionChanged, function(idx, handler) {
                    handler();
                });
            };

            panel._notifySelectionChanged = function() {
                $.each(panel._notificationHandlersSelectionChanged, function(idx, handler) {
                    handler();
                });
            };




            return panel;
        };


        Module.FrameTrackViewer = function () {
            var thePanel = Module.PanelTrackViewer();
            var theFrame = Frame.FrameFinalCommands(thePanel);

            theFrame.trackControlsGroup = Controls.Compound.GroupVert({separator: 3});
            theFrame._popupMenuExtraControlsGroup = Controls.Compound.GroupVert({separator: 3});

            var toolBox = Frame.ToolBox.create(
                Icon.createFA('fa-bars'),
                Controls.Compound.FixedWidth(Controls.Compound.StandardMargin(Controls.Compound.GroupVert({separator: 10}, [
                    theFrame.trackControlsGroup,
                    theFrame._popupMenuExtraControlsGroup
                ]) ), appData.leftPanelWidth));

            theFrame.setToolBox(toolBox);

            theFrame.getPanel = function () {
                return thePanel;
            };

            theFrame.addCommandSpacer(40);

            theFrame.addCommand({
                icon: Icon.createFA("fa-search-plus").addDecorator('fa-arrows-h', 'left', 0, 'bottom', -7, 0.6),
                hint: _TRL("Zoom in")
            }, function () {
                var displayWidth = thePanel._width - Module._trackOffsetLeft - Module._trackOffsetRight;
                thePanel._handleZoom(1.2, displayWidth/2);
            });

            theFrame.addCommand({
                icon: Icon.createFA("fa-search-minus").addDecorator('fa-arrows-h', 'left', 0, 'bottom', -7, 0.6),
                hint: _TRL("Zoom out")
            }, function () {
                var displayWidth = thePanel._width - Module._trackOffsetLeft - Module._trackOffsetRight;
                thePanel._handleZoom(0.8, displayWidth/2);
            });


            theFrame.addExtraPopupMenuControl = function(ctrl) {
                theFrame._popupMenuExtraControlsGroup.add(ctrl);
            };



            theFrame.addTrack = function(track) {
                var $El = $('#' + thePanel.getId() + '_content');
                var isLive = thePanel._isrunning;
                thePanel.addTrack(track);

                if (isLive) {
                    $El.append(track.createHtml());
                    track.attachEventHandlers();
                }

                if (track.canHide()) {
                    track.__ctrl_visible = Controls.Check({text: track.getName(), checked: track.isVisible()});
                    theFrame.trackControlsGroup.add(track.__ctrl_visible);
                    theFrame.trackControlsGroup.liveUpdate();
                    track.__ctrl_visible.addNotificationHandler(function() {
                        track.setVisible(track.__ctrl_visible.getValue());
                        thePanel.rescale({resizing: false});
                    });
                }
                if (isLive) {
                    thePanel.rescale({resizing: false});
                }
            };

            return theFrame;
        };


        return Module;
    })
;

