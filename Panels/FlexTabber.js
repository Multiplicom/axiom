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
        "AXM/AXMUtils", "AXM/Panels/Frame", "AXM/Panels/PanelHtml", "AXM/Controls/Controls", "AXM/Controls/Compound", "AXM/Windows/PopupWindow", "AXM/DOM"],
    function (
        require, $, _,
        AXMUtils, Frame, PanelHtml, Controls, ControlsCompound, PopupWindow, DOM) {

        /**
         * Module implementing FlexTabber classes, used to organise the web application client area in a dynamic way
         * @type {{}}
         */
        var Module = {};


        Module.createTab = function(parentContainer, headerInfo, tabFrame, stackNr) {
            var tabInfo = {};
            AXMUtils.Test.checkIsType(headerInfo, 'headerinfo');
            tabInfo.headerInfo = headerInfo;
            tabInfo.parentContainer = parentContainer;
            tabInfo.tabFrame = tabFrame;
            tabInfo.stackNr = stackNr;
            tabInfo.tabId = AXMUtils.getUniqueID();

            tabInfo.createHtml = function() {
                var tabDiv = DOM.Div({id: tabInfo.tabId});
                tabDiv.addCssClass('AXMFlexTab');
                tabDiv.addCssClass('AXMFlexTabInActive');
                tabDiv.addCssClass('AXMFlexTabInActiveHighlight');
                tabDiv.addStyle('display', 'none');
                var tabContent = DOM.Div({parent: tabDiv});
                tabContent.addCssClass('AXMFlexTabContent');

                var iconDiv = DOM.Div({parent:tabContent});
                iconDiv.addCssClass('AXMFlexTabIcon');
                iconDiv.addElem(tabInfo.headerInfo.icon.renderHtml());

                var textDiv = DOM.Div({parent:tabContent});
                textDiv.addCssClass('AXMFlexTabText');
                textDiv.addElem(tabInfo.headerInfo.title1 + '<br>' + tabInfo.headerInfo.title2);

                var closeDiv = DOM.Create('span', {parent: tabDiv});
                closeDiv.addCssClass('AXMFlexTabCloser');
                closeDiv.addElem('<i class="fa fa-times-circle"/>');

                var popupDiv = DOM.Create('span', {parent: tabDiv});
                popupDiv.addCssClass('AXMFlexTabToPopup');
                popupDiv.addElem('<i class="fa fa-arrow-circle-right"/>');

                return tabDiv.toString();
            };

            tabInfo.get$El = function() {
                return $('#'+tabInfo.tabId);
            };

            tabInfo.attachEventHandlers = function() {
                var el = tabInfo.get$El();
                el.click(function() {
                    tabInfo.parentContainer.activateTab_byID(tabInfo.tabId);
                });

                el.find('.AXMFlexTabCloser').click(function(ev) {
                    tabInfo.parentContainer.closeTab_byID(tabInfo.tabId);
                    ev.stopPropagation();
                    return null;
                });

                el.find('.AXMFlexTabToPopup').click(function(ev) {
                    tabInfo.parentContainer.convertToPopup_byID(tabInfo.tabId);
                    ev.stopPropagation();
                    return null;
                });

            };

            return tabInfo;
        };


        Module.create = function() {
            var frame = Frame.FrameSplitterHor();
            frame.setHalfSplitterSize(3);
            frame.splitterColor = "white";

            frame._id = AXMUtils.getUniqueID();


            frame._panelTabs = PanelHtml.create(frame._id + 'flexTabberLeft');

            frame._frameTabs = frame.addMember(Frame.FrameFinal(frame._panelTabs));
            frame._frameTabs.setFixedDimSize(Frame.dimX, 160);
            frame._frameStacker = frame.addMember(Frame.FrameStacker());

            frame._myTabs = [];
            frame._activeTab = -1;

            frame._panelTabs.setContent('<div class="flexTabWrapperFull"><div class="flexTabWrapper"></div></div>');

            /**
             * Adds a new tab to the frame
             * @param theTitle - title of the tabl
             * @param theFrame - frame content
             * @returns {string} - ID of the tab
             */
            frame.addTabFrame = function(headerInfo, theFrame, settings) {
                AXMUtils.Test.checkIsType(headerInfo, 'headerinfo');
                if (settings.autoActivate!==false)
                    frame._activeTab = frame._myTabs.length;
                var tabInfo = Module.createTab(frame, headerInfo, theFrame, frame._frameStacker.getmemberFrameCount());
                frame._myTabs.push(tabInfo);
                frame._frameStacker.dynAddMember(theFrame);

                tabInfo.parentContainer._panelTabs.get$El().find('.flexTabWrapper').append(tabInfo.createHtml());

                tabInfo.get$El().slideDown(200, function() {
                    tabInfo.get$El().removeClass('AXMFlexTabInActiveHighlight');
                });

                    tabInfo.attachEventHandlers();
                if (settings.autoActivate!==false)
                    frame.activateTab_byID(tabInfo.tabId);
                return tabInfo.tabId;
            };


            frame._tabId2Nr = function(tabId) {
                var tabNr = -1;
                $.each(frame._myTabs, function(idx, _tabInfo) {
                    if (_tabInfo.tabId == tabId) {
                        tabNr = idx;
                    }
                });
                if (tabNr<0)
                    AXMUtils.reportBug("Invalid tab ID");
                return tabNr;
            };

            frame.getTabInfo_byId = function(tabId) {
                var tabNr = frame._tabId2Nr(tabId);
                return frame._myTabs[tabNr];
            };

            frame.activateTab_byID = function(tabId) {
                var tabNr = frame._tabId2Nr(tabId);
                var tabInfo = frame._myTabs[tabNr];
                frame._frameStacker.activateStackNr(tabInfo.stackNr);
                frame._activeTab = tabNr;
                frame.updateTabStates();
            };


            frame.updateTabStates = function() {
                frame._panelTabs.get$El().find('.AXMFlexTab')
                    .removeClass('AXMFlexTabActive')
                    .addClass('AXMFlexTabInActive');
                if ((frame._activeTab>=0) && (frame._activeTab<frame._myTabs.length))
                    $('#'+frame._myTabs[frame._activeTab].tabId)
                        .removeClass('AXMFlexTabInActive')
                        .addClass('AXMFlexTabActive');

            };



            frame.closeTab_byID = function(tabId, doNotRemoveFrame, onCompleted) {
                var tabNr = frame._tabId2Nr(tabId);
                var tabInfo = frame._myTabs[tabNr];
                if (!doNotRemoveFrame) {
                    var closePreventReason = tabInfo.tabFrame._getAnyClosePreventReason();
                    if (closePreventReason) {
                        alert('Cannot close: '+closePreventReason);
                        return;
                    }
                    tabInfo.tabFrame.informWillClose();
                }
                tabInfo.get$El().slideUp(200, function() {
                    tabInfo.get$El().remove();
                    frame._frameStacker.dynDelMember(tabInfo.stackNr);
                    $.each(frame._myTabs, function(idx, tmp1tabInfo) {
                        if (tmp1tabInfo.stackNr>tabInfo.stackNr)
                            tmp1tabInfo.stackNr--;
                    });
                    if (!doNotRemoveFrame) {
                        tabInfo.tabFrame.getRoot$El().remove();
                    }
                    frame._myTabs.splice(tabNr, 1);
                    if (tabNr==frame._activeTab) {
                        if (frame._activeTab>=frame._myTabs.length)
                            frame._activeTab--;
                        if (frame._activeTab>=0)
                            frame.activateTab_byID(frame._myTabs[frame._activeTab].tabId);
                    }
                    else {
                        if (tabNr<frame._activeTab)
                            frame._activeTab--;
                    }
                    if (onCompleted)
                        onCompleted();
                });
            };


            frame.convertToPopup_byID = function(tabId) {
                var tabNr = frame._tabId2Nr(tabId);
                var tabInfo = frame._myTabs[tabNr];

                var popup = PopupWindow.create({
                    //title: tabInfo.headerInfo.title1,
                    blocking:false,
                    autoCenter: true
                });

                popup.setHeaderInfo(tabInfo.headerInfo);

                popup.setRootFrame(tabInfo.tabFrame);

                popup.start();
                tabInfo.tabFrame.getRoot$El().css('visibility', 'visible'); // make sure the frame if visible, in case the tab was hidden
                tabInfo.tabFrame.getRoot$El().css('opacity', 1); // make sure the frame if visible, in case the tab was hidden

                AXMUtils.animateBoxTransition(tabInfo.get$El(), popup.get$El(), {}, function() {
                    frame.closeTab_byID(tabId, true);
                });
            };



            return frame;
        };




        return Module;
    });

