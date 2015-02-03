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
        "AXM/AXMUtils", "AXM/Controls/Controls", "AXM/Controls/Compound", "AXM/DOM"],
    function (
        require, $, _,
        AXMUtils, Controls, ControlsCompound, DOM) {

        var Module = {};

        Module.titleBarH = 25;

        Module.dimX = 0;
        Module.dimY = 1;
        Module.checkValidDim = function (dim) {
            if ((dim !== Module.dimX) && (dim !== Module.dimY))
                AXMUtils.reportBug("Invalid dimension ID");
        };


        Module.dimSizeInfo = function() {
            var sizeInfo = AXMUtils.object('@FrameDimSizeInfo');
            sizeInfo._min = 120;
            sizeInfo._max = 999999;
            sizeInfo._autoSize = false;

            sizeInfo.setMinSize = function (sz) {
                sizeInfo._min = sz;
                return sizeInfo;
            };
            sizeInfo.setFixedSize = function (sz) {
                sizeInfo._min = sz;
                sizeInfo._max = sz;
                return sizeInfo;
            };
            sizeInfo.setAutoSize = function () {
                sizeInfo._min = 0;
                sizeInfo._autoSize = true;
                return sizeInfo;
            };
            sizeInfo._isFixedSize = function () {
                if (sizeInfo._autoSize)
                    return true;
                return sizeInfo._max == sizeInfo._min;
            };
            sizeInfo._getMinSize = function () {
                return sizeInfo._min;
            };
            sizeInfo._getMaxSize = function () {
                return sizeInfo._max;
            };
            sizeInfo.isAutoSize = function() {
                return sizeInfo._autoSize;
            }

            return sizeInfo;
        }


        Module.FrameGeneric = function () {
            var frame = AXMUtils.object("@Frame");
            frame._parentFrame = null;
            frame._id = 'FR'+AXMUtils.getUniqueID();
            frame._sizeFraction = 1;
            frame._hasTitle = false;
            frame._title = '';
            frame._sizeInfos = [Module.dimSizeInfo(), Module.dimSizeInfo()]; //allowed frame size range in X and Y dimension

            frame.getId = function() {
                return frame._id;
            };

            frame.getTitleDivId = function() {
                return frame._id+'_title';
            };

            frame.setSizeFraction = function(fr) {
                AXMUtils.Test.checkIsNumber(fr);
                frame._sizeFraction = fr;
                return frame;
            };

            frame.getSizeFraction = function() {
                return frame._sizeFraction;
            };

            frame.setTitle = function(iTitle) {
                AXMUtils.Test.checkIsString(iTitle);
                frame._hasTitle = true;
                frame._title = iTitle;
                return frame;
            };

            frame.hasTitleBar = function() {
                if (!frame._hasTitle)
                    return false;
                if (frame._parentFrame && frame._parentFrame.isTabber())
                    return false;
                return true;
            }

            frame.getTitle = function() {
                return frame._title;
            }

            frame.isTabber = function() { return false; };

            frame.setMinDimSize = function (dim, sze) {
                Module.checkValidDim(dim);
                AXMUtils.Test.checkIsNumber(sze);
                frame._sizeInfos[dim].setMinSize(sze);
                return frame;
            };

            frame.setAutoSize = function (dim) {
                Module.checkValidDim(dim);
                frame._sizeInfos[dim].setAutoSize();
                return frame;
            }


            frame.setFixedDimSize = function (dim, sz) {
                Module.checkValidDim(dim);
                AXMUtils.Test.checkIsNumber(sz);
                frame._sizeInfos[dim].setFixedSize(sz);
                return frame;
            };

            frame._getAutoSize = function (dim) {
                Module.checkValidDim(dim);
                var sze = frame._getClientAutoSize(dim);
                //if (this._parentFrame)   !!!todo: include parent separator?
                //    sze += frame._parentFrame._separatorSize / 2;
                return sze;
            }


            frame._getMinSize = function (dim) {
                Module.checkValidDim(dim);
                if (frame._sizeInfos[dim].isAutoSize())
                    return frame._getAutoSize(dim);
                return Math.max(
                    frame._sizeInfos[dim]._getMinSize(),
                    frame._getClientMinSize(dim)
                );
            };

            frame._getClientMinSize = function(dim) {
                return 0;
            };


            frame._getMaxSize = function (dim) {
                Module.checkValidDim(dim);
                if (frame._sizeInfos[dim].isAutoSize())
                    return frame._getAutoSize(dim);
                return frame._sizeInfos[dim]._getMaxSize();
            };


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

            frame.attachEventHandlers = function(params) {
                frame.$ElContainer = $('#' + frame._id);
            };

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
                frame.$ElContainer.find('.AXMFrameClient').css({
                    left: '0px',
                    top: frame._clientVOffset +'px',
                    width: xl + 'px',
                    height: (yl-frame._clientVOffset) + 'px'
                });
                if (frame.setPositionClient)
                    frame.setPositionClient(xl, yl-frame._clientVOffset, params);
            };

            return frame;
        };

        Module.FrameCompound = function () {
            var frame = Module.FrameGeneric();
            frame._memberFrames = [];

            frame.addMember = function(memberFrame) {
                AXMUtils.Test.checkIsType(memberFrame, '@Frame');
                frame._memberFrames.push(memberFrame);
                memberFrame._parentFrame = frame;
                return memberFrame;
            };

            var _super_attachEventHandlers = frame.attachEventHandlers;
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params);
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame.attachEventHandlers(params);
                });
            };

            return frame;
        };


        Module.FrameSplitter = function (dim) {
            var frame = Module.FrameCompound();
            Module.checkValidDim(dim);
            frame._dim = dim;
            frame._hSplitterSize = 3;


            frame.setHalfSplitterSize = function(hSize) {
                AXMUtils.Test.checkIsNumber(hSize);
                frame._hSplitterSize = hSize;
                return frame;
            };

            frame.isHorSplitter = function() { return frame._dim==Module.dimX; };
            frame.isVertSplitter = function() { return frame._dim==Module.dimY; };

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



            frame.getSplitterDivId = function(sepnr) {
                if ((sepnr<1) || (sepnr>=frame._memberFrames.length))
                    AXMUtils.reportBug('Invalid separator number');
                return 'FSP_'+frame._id+'_'+sepnr;
            };

            frame._isFixedSplitter = function(splitterNr) {
                if ((splitterNr<1) || (splitterNr>=frame._memberFrames.length))
                    AXMUtils.reportBug('Invalid separator number');
                if (frame._memberFrames[splitterNr-1]._sizeInfos[frame._dim]._isFixedSize())
                    return true;
                if (frame._memberFrames[splitterNr]._sizeInfos[frame._dim]._isFixedSize())
                    return true;
                return false;
            };

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
                    html += splitdiv.toString();
                }
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    html += memberFrame.createHtml();
                });
                return html;
            };

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
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params);
                frame._attachEventHandlers_Splitters(params)
            }

            frame._attachEventHandlers_Splitters = function(params) {
                var initialiseMoveSplitter = function(splitterNr, splitter$El) {
                    frame._temp_dragSplitter_splitterNr = splitterNr;
                    frame._temp_dragSplitter_splitter$El = splitter$El;
                    frame._temp_dragSplitter_origPosit = frame.splitterPositions[splitterNr];
                };
                var doMoveSplitter= function(params) {
                    var shift = frame.isHorSplitter() ? params.diffTotalX : params.diffTotalY;
                    var $ElClient = frame.$ElContainer.find('.AXMFrameClient');
                    var totsize = frame.isHorSplitter() ? $ElClient.width() : $ElClient.height();
                    //shift = 0;//!!!
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



            frame._setPositionSubframes = function(params) {
                var xl = frame.$ElContainer.find('.AXMFrameClient').width();
                var yl = frame.$ElContainer.find('.AXMFrameClient').height();
                frame.setPositionClient(xl,yl, params);
            };


            return frame;
        };

        Module.FrameSplitterHor = function () {
            var frame = Module.FrameSplitter(0);


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



        Module.FrameSplitterVert = function () {
            var frame = Module.FrameSplitter(1);

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




        Module.FrameStacker = function () {
            var frame = Module.FrameCompound();
            frame._activeMemberNr = 0;
            frame._stackHeaderOffset = 0;

            frame.createHtmlClient = function() {
                var html = '';

                $.each(frame._memberFrames, function(idx, memberFrame) {
                    html += memberFrame.createHtml();
                });
                return html;
            };

            frame.setPositionClient = function(xl, yl, params) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame.setPosition(0, frame._stackHeaderOffset, xl, yl-frame._stackHeaderOffset, params);
                });
                frame._updateMemberVisibility();
            };

            frame._updateMemberVisibility = function() {
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    memberFrame.$ElContainer.css('display',
                        (idx==frame._activeMemberNr) ? 'block' : 'none');

                });
            };

            return frame;


        }

        Module.FrameTabber = function () {
            var frame = Module.FrameStacker();
            frame._stackHeaderOffset = 34;

            frame.isTabber = function() { return true; };

            frame._getTabId = function(tabNr) {
                return 'frametab_'+frame._id+'_'+tabNr;
            };

            var _super_createHtmlClient = frame.createHtmlClient;
            frame.createHtmlClient = function() {
                var html = '';

                var tabDiv = DOM.Div({}).addCssClass('AXMFrameTabContainer');
                var tabDivInner = DOM.Div({parent:tabDiv}).addCssClass('AXMFrameTabContainerInner');
                $.each(frame._memberFrames, function(idx, memberFrame) {
                    var tablElDiv = DOM.Div({parent: tabDivInner, id:frame._getTabId(idx)})
                        .addCssClass('AXMFrameTabElement');
                    tablElDiv.addElem(memberFrame.getTitle());
                });

                html += tabDiv.toString();

                html += _super_createHtmlClient();

                return html;
            };

            var _super_attachEventHandlers = frame.attachEventHandlers;
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params);
                $.each(frame._memberFrames, function(fnr, memberFrame) {
                    $('#'+frame._getTabId(fnr)).click(function() {
                        if (fnr != frame._activeMemberNr)
                            frame.activateTabNr(fnr);
                    });
                });
                frame.activateTabNr(0);
            };

            frame.activateTabNr = function(fnr) {
                if ((fnr<0) || (fnr>=frame._memberFrames.length))
                    AXMUtils.reportBug('Invalid TAB nr');
                frame._activeMemberNr = fnr;
                frame._updateMemberVisibility();
                frame.$ElContainer.find('.AXMFrameTabContainer').find('.AXMFrameTabElement')
                    .removeClass('AXMFrameTabElementActive')
                    .addClass('AXMFrameTabElementInActive');
                $('#'+frame._getTabId(fnr))
                    .removeClass('AXMFrameTabElementInActive')
                    .addClass('AXMFrameTabElementActive');

            };

            var _super_setPositionClient = frame.setPositionClient;
            frame.setPositionClient = function(xl, yl, params) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                frame.$ElContainer.find('.AXMFrameTabContainer')
                    .outerWidth(xl)
                    .outerHeight(frame._stackHeaderOffset);

                var availableWidth = frame.$ElContainer.find('.AXMFrameTabContainer').width();

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
                    var consumedWidth = frame.$ElContainer.find('.AXMFrameTabContainerInner').width();
                    maxTitleLength--;
                } while ((consumedWidth > availableWidth) && (maxTitleLength>1))

                _super_setPositionClient(xl, yl, params);
            };


            return frame;
        };






        Module.FrameFinal = function (iPanel) {
            var frame = Module.FrameGeneric();
            frame._panel = iPanel;
            iPanel._setFrame(frame);

            frame.createHtmlClient = function() {
                var div = DOM.Div({id: frame._id+'_finalclient'});
                div.addCssClass('AXMFrameFinalClientArea');
                div.addElem(frame._panel.createHtml());

                return div.toString();
            };

            frame._getClientAutoSize = function(dim) {
                //var obj = document.getElementById(frame._id+'_finalclient');
                //if (obj) {
                //    if (dim==Module.dimX)
                //        return obj.offsetWidth;
                //    else
                //        return obj.offsetHeight;
                //}
                //else
                //    return 0;

                var $ElClient = frame.$ElContainer.find('.AXMFrameFinalClientArea');
                var ht = $ElClient.html();
                if (dim==Module.dimX)
                    return $ElClient.outerWidth();
                else
                    return $ElClient.outerHeight();
            };


            var _super_attachEventHandlers = frame.attachEventHandlers;
            frame.attachEventHandlers = function(params) {
                _super_attachEventHandlers(params);
                frame._panel.attachEventHandlers(params);
            };

            frame.setPositionClient = function(xl, yl, params) {
                if (!params)
                    debugger;
                var $ElClient = frame.$ElContainer.find(".AXMFrameFinalClientArea");
                if (!frame._sizeInfos[Module.dimY].isAutoSize())
                    $ElClient.css('height', yl);
                if (!frame._sizeInfos[Module.dimX].isAutoSize())
                    $ElClient.css('width', xl);
                frame._panel.resize(xl, yl, params);
            };

            frame.getPanel = function() {
                return frame._panel;
            };


            return frame;
        };


        Module.FrameFinalCommands = function(iPanel) {
            var controlsH = 35;
            var frame = Module.FrameSplitterVert();
            frame.setHalfSplitterSize(2);
            frame._panelControls = require('AXM/Panels/PanelForm').create(iPanel.getId()+'_commands');
            frame._frameCommands = frame.addMember(Module.FrameFinal(frame._panelControls))
                .setFixedDimSize(Module.dimY, controlsH);
            frame._frameFinal = frame.addMember(Module.FrameFinal(iPanel));

            frame._controlGroup = ControlsCompound.GroupHor({});
            frame._panelControls.setRootControl(ControlsCompound.WrapperStyled(frame._controlGroup, 'AXMCommandBar'));

            frame.addCommand = function(settings, action) {
                settings.height = controlsH-1;
                if (!settings.width)
                    settings.width = 30;
                if (!settings.buttonClass)
                    settings.buttonClass = 'AXMButtonCommandBar';
                var bt = Controls.Button(settings);
                bt.addNotificationHandler(action);

                frame._controlGroup.add(bt);
            };

            frame.addControl = function(ctrl) {
                frame._controlGroup.add(ctrl);
            };

            frame.addSeparator = function() {
                frame._controlGroup.add(ControlsCompound.DividerH());

            };

            //sf1
            return frame;
        };




        return Module;
    });

