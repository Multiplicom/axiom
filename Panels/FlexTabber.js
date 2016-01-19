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

        Module.leftPartSize = 160;


        /**
         * Creates a new TabInfo object
         * @param {string} tabId
         * @param {AXM.Panel.FlexTabber} parentContainer - FlexTabber frame frame this tab will belong to
         * @param {AXM.Iconn.HeaderInfo} headerInfo - object containing info about the header of the tab (icon, title, ...)
         * @param {AXM.Frame} tabFrame - frame that whill be shown in the tab
         * @param {int} stackNr - index of the tab in the stack of tabs
         * @param {{}} settings - extra settings
         * @param {boolean} settings.isFixed - if true, the tab cannot be removed
         * @returns {{}} - tab info object
         */
        Module.createTabInfo = function(tabId, parentContainer, headerInfo, tabFrame, stackNr, settings) {
            var tabInfo = {};
            AXMUtils.Test.checkIsType(headerInfo, 'headerinfo');
            AXMUtils.Test.checkIsType(parentContainer, "flextabber");
            AXMUtils.Test.checkIsType(tabFrame, "@Frame");

            tabInfo.headerInfo = headerInfo;
            tabInfo.parentContainer = parentContainer;
            tabInfo.tabFrame = tabFrame;
            tabInfo.stackNr = stackNr;
            tabInfo.tabId = tabId;
            tabInfo._isFixed = !!settings.isFixed;

            /**
             * Returns the html for the tab header
             * @returns {string}
             */
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
                var textLine1Div = DOM.Div({parent: textDiv});
                textLine1Div.addCssClass("TabTitle1");
                textLine1Div.addElem(tabInfo.headerInfo.title1);
                var textLine2Div = DOM.Div({parent: textDiv});
                textLine2Div.addCssClass("TabTitle2");
                textLine2Div.addStyle("max-width", (Module.leftPartSize-40)+"px");
                textLine2Div.addStyle("overflow", "hidden");
                textLine2Div.addStyle("text-overflow", "ellipsis");
                textLine2Div.addElem(tabInfo.headerInfo.title2);

                if (!tabInfo._isFixed) {
                    var closeDiv = DOM.Create('span', {parent: tabDiv});
                    closeDiv.addCssClass('AXMFlexTabCloser');
                    closeDiv.addElem('<i class="fa fa-times-circle"/>');

                    var popupDiv = DOM.Create('span', {parent: tabDiv});
                    popupDiv.addCssClass('AXMFlexTabToPopup');
                    popupDiv.addElem('<i class="fa fa-arrow-circle-right"/>');
                }

                return tabDiv.toString();
            };

            /**
             * Returns the jQuery element with the tab header
             * @returns {jQuery}
             */
            tabInfo.get$El = function() {
                return $('#'+tabInfo.tabId);
            };


            /**
             * Attach the required event handlers to the tab header after DOM insertion
             */
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

            /**
             * Detach the required event handlers to the tab header
             */
            tabInfo.detachEventHandlers = function() {
                var el = tabInfo.get$El();
                el.unbind('click');
                el.find('.AXMFlexTabCloser').unbind('click');
                el.find('.AXMFlexTabToPopup').unbind('click');
            };

            return tabInfo;
        };


        /**
         * Creates a FlexTabber frame
         * @returns {Object}
         */
        Module.create = function() {
            var frame = Frame.FrameSplitterHor();
            frame.extend('flextabber');
            frame.setHalfSplitterSize(3);
            frame.splitterColor = "white";

            frame._id = AXMUtils.getUniqueID();


            frame._panelTabs = PanelHtml.create(frame._id + 'flexTabberLeft');
            frame._panelTabs.enableVScrollingNoBar();

            frame._frameTabs = frame.addMember(Frame.FrameFinal(frame._panelTabs));
            frame._frameTabs.setFixedDimSize(Frame.dimX, Module.leftPartSize);
            frame._frameStacker = frame.addMember(Frame.FrameStacker());

            frame._myTabs = [];
            frame._activeTab = -1;
            frame._history_tabId = [];

            frame._panelTabs.setContent('<div class="flexTabWrapperFull"><div class="flexTabWrapper"></div></div>');


            /**
             * Call this to allow the FlexTabber to use the browser history
             */
            frame.setUseBrowserHistory = function() {
                frame._useBrowserHistory = true;
                window.onpopstate = function (event) {
                    if (event.state)
                        frame.activateTab_byID(event.state.viewId, true);
                };
            };

            /**
             * Adds a new tab to the frame
             * @param tabId {string|null} - Identifier of the tab (might be null)
             * @param headerInfo - AXM.Icon.HeaderInfo
             * @param theFrame - frame content
             * @param {{}} settings - settings
             * @param {boolean} settings.isFixed - if true, the tab cannot be removed
             * @param {boolean} settings.autoActivate - if true, the tab becomes automatically activate
             * @returns {string} - ID of the tab
             */
            frame.addTabFrame = function(tabId, headerInfo, theFrame, settings) {
                if (!tabId)
                    tabId = 'TB_' + AXMUtils.getUniqueID();
                else
                    if (frame.hasTabId(tabId))
                        AXMUtils.Test.reportBug("Tab is already present: " + tabId);
                AXMUtils.Test.checkIsType(headerInfo, 'headerinfo');
                if (settings.autoActivate!==false)
                    frame._activeTab = frame._myTabs.length;
                var tabInfo = Module.createTabInfo(tabId, frame, headerInfo, theFrame, frame._frameStacker.getmemberFrameCount(), settings);
                frame._myTabs.push(tabInfo);
                frame._frameStacker.dynAddMember(theFrame);

                tabInfo.parentContainer._panelTabs.get$El().find('.flexTabWrapper').append(tabInfo.createHtml());
                setTimeout(function() {
                    frame._panelTabs.scrollToBottom();
                }, 200);

                tabInfo.get$El().slideDown(200, function() {
                    tabInfo.get$El().removeClass('AXMFlexTabInActiveHighlight');
                });

                    tabInfo.attachEventHandlers();
                if (settings.autoActivate!==false)
                    frame.activateTab_byID(tabInfo.tabId);
                return tabInfo.tabId;
            };


            /**
             * Modifies the title of a tab frame
             * @param tabId {string} id of the tab
             * @param newTitle1 {string} - title line 1
             * @param newTitle2 {string} - title line 2
             */
            frame.changeTabFrameTitle = function(tabId, newTitle1, newTitle2) {
                var tabNr = frame._tabId2Nr_noFail(tabId)

                if (tabNr >= 0) {
                    var tabInfo = frame._myTabs[tabNr];
                    tabInfo.headerInfo.title1 = newTitle1;
                    tabInfo.headerInfo.title2 = newTitle2;
                    frame._updateTabStates();
                    tabInfo.get$El().find('.TabTitle1').html(newTitle1);
                    tabInfo.get$El().find('.TabTitle2').html(newTitle2);
                }

                $.each(PopupWindow.getActiveWindowList(), function(idx, popupWindow) {
                    if (tabId == popupWindow.__originalFlexTabberId) {
                        popupWindow.modifyTitle(newTitle1 + " " + newTitle2);
                    }
                });

            };


            /**
             * Returns the tab index associated with a tab ID, and returns -1 of not present
             * @param {string} tabId
             * @returns {number}
             * @private
             */
            frame._tabId2Nr_noFail = function(tabId) {
                var tabNr = -1;
                $.each(frame._myTabs, function(idx, _tabInfo) {
                    if (_tabInfo.tabId == tabId) {
                        tabNr = idx;
                    }
                });
                return tabNr;
            };


            /**
             * Returns the tab index associated with a tab ID, and fails of not present
             * @param {string} tabId
             * @returns {number}
             * @private
             */
            frame._tabId2Nr = function(tabId) {
                var tabNr = frame._tabId2Nr_noFail(tabId);
                if (tabNr<0)
                    AXMUtils.reportBug("Invalid tab ID");
                return tabNr;
            };


            /**
             * Returns the ID of the currently active tab
             * @returns {string}
             */
            frame.getCurrentTabId = function() {
                if ((frame._activeTab<0) || (frame._activeTab>=frame._myTabs.length))
                    return "";
                return frame._myTabs[frame._activeTab].tabId;
            };


            /**
             * Returns the TabInfo object of the currently acive tab
             * @returns {*}
             */
            frame.getCurrentTabInfo = function() {
                if ((frame._activeTab<0) || (frame._activeTab>=frame._myTabs.length))
                    return null;
                return frame._myTabs[frame._activeTab];
            };


            /**
             * Determines if a tab is present
             * @param {string} tabId
             * @returns {boolean}
             */
            frame.hasTabId = function(tabId) {
                return frame._tabId2Nr_noFail(tabId) >= 0;
            };


            /**
             * Returns the TabInfo object associated with a tab id
             * @param {string} tabId
             * @returns {*}
             */
            frame.getTabInfo_byId = function(tabId) {
                var tabNr = frame._tabId2Nr(tabId);
                return frame._myTabs[tabNr];
            };


            /**
             * Activates a tab
             * @param {string} tabId - tab id
             * @param {bool} noUpdateHistory - if true, do not update the browser history
             */
            frame.activateTab_byID = function(tabId, noUpdateHistory) {
                var tabNr = frame._tabId2Nr(tabId);
                var tabInfo = frame._myTabs[tabNr];
                if (!tabInfo)
                    return false;
                frame._frameStacker.activateStackNr(tabInfo.stackNr);
                frame._activeTab = tabNr;
                frame._updateTabStates();
                if (frame._useBrowserHistory) {
                    if (!noUpdateHistory) {
                        if (history)
                            history.pushState({viewId: tabInfo.tabId}, "");
                    }
                }
                frame._history_tabId.push(tabInfo.tabId);
                return true;
            };


            /**
             * Updates the displayed tab state
             * @private
             */
            frame._updateTabStates = function() {
                frame._panelTabs.get$El().find('.AXMFlexTab')
                    .removeClass('AXMFlexTabActive')
                    .addClass('AXMFlexTabInActive');
                if ((frame._activeTab>=0) && (frame._activeTab<frame._myTabs.length)) {
                    $('#'+frame._myTabs[frame._activeTab].tabId)
                        .removeClass('AXMFlexTabInActive')
                        .addClass('AXMFlexTabActive');
                    if (frame.hiderCloseView)
                        frame.hiderCloseView.show(!frame.getCurrentTabInfo()._isFixed);
                }

                if (frame.viewTitle) {
                    var newTitle = "";
                    if (frame.getCurrentTabInfo()) {
                        var currentTabInfo = frame.getCurrentTabInfo();
                        if (currentTabInfo.headerInfo.showTitle)
                            newTitle = frame.getCurrentTabInfo().headerInfo.getSingleTitle();
                    }
                    frame.viewTitle.get$El().fadeTo(200,0, function() {
                        frame.viewTitle.modifyText(newTitle);
                        if (newTitle)
                            frame.viewTitle.get$El().fadeTo(200,1);
                    });
                }

            };

            /**
             * Activates an individual panel inside the hierarchical frame structure
             * @param {string} panelTypeId - ID of the panel
             * @returns {boolean} - determines whether or not the panel was found
             */
            frame.activatePanelTypeId = function(panelTypeId) {
                var isFound = false;
                $.each(frame._myTabs, function(idx, tabInfo) {
                    if (tabInfo.tabFrame.activatePanelTypeId(panelTypeId)) {
                        frame.activateTab_byID(tabInfo.tabId);
                        isFound = true;
                    }
                });
                return isFound;
            };



            /**
             * Closes a tab, provided an ID
             * @param {string} tabId - id of the tab to be removed
             * @param {boolean} doNotRemoveFrame - if true, the frame contained in the tab is not removed (used in the case the frame is transferred to a popup window)
             * @param {function} onCompleted - executed when the animation of the removal is completed
             */
            frame.closeTab_byID = function(tabId, doNotRemoveFrame, onCompleted) {
                var tabNr = frame._tabId2Nr(tabId);
                var tabInfo = frame._myTabs[tabNr];

                if (!tabInfo)
                    return;

                //remove tab from history
                for (var idx=0; idx<frame._history_tabId.length;) {
                    if (frame._history_tabId[idx] == tabId)
                        frame._history_tabId.splice(idx, 1);
                    else
                        idx++;
                }

                if (!doNotRemoveFrame) {
                    var closePreventReason = tabInfo.tabFrame._getAnyClosePreventReason();
                    if (closePreventReason) {
                        alert('Cannot close: '+closePreventReason);
                        return;
                    }
                    tabInfo.tabFrame.informWillClose();
                }
                tabInfo.get$El().slideUp(200, function() {
                    frame._myTabs[tabNr].detachEventHandlers();
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
                        //We need to change the current tab
                        var newTabNr = -1;
                        //First try the most recent historic tab
                        if (frame._history_tabId.length>0) {
                            newTabNr = frame._tabId2Nr_noFail(frame._history_tabId[frame._history_tabId.length-1]);
                        }
                        if (newTabNr<0) {//If that failed, just use the next tab available
                            newTabNr = frame._activeTab;
                            if (newTabNr >= frame._myTabs.length)
                                newTabNr--;
                        }
                        frame._activeTab = newTabNr;
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


            /**
             * Converts a tab to a popup window
             * @param {string} tabId - id of the tab to be converted
             */
            frame.convertToPopup_byID = function(tabId) {
                var tabNr = frame._tabId2Nr(tabId);
                var tabInfo = frame._myTabs[tabNr];

                var popup = PopupWindow.create({
                    //title: tabInfo.headerInfo.title1,
                    blocking:false,
                    autoCenter: true,
                    canDock: true,
                    sizeX: 750,
                    sizeY:570
                });
                popup.__originalFlexTabberId = tabId;

                popup.setHeaderInfo(tabInfo.headerInfo);

                popup.setRootFrame(tabInfo.tabFrame);


                popup.start();
                tabInfo.tabFrame.getRoot$El().css('display', ''); // make sure the frame if visible, in case the tab was hidden
                tabInfo.tabFrame.getRoot$El().css('opacity', 1); // make sure the frame if visible, in case the tab was hidden
                if (tabInfo.tabFrame.repositionSubFrames)
                    tabInfo.tabFrame.repositionSubFrames();//done here because elements in an initially invisible tab may not be measured correctly for positioning

                AXMUtils.animateBoxTransition(tabInfo.get$El(), popup.get$El(), {}, function() {
                    frame.closeTab_byID(tabId, true);
                });
            };


            /**
             * Attempts to activate a tab or a popup window, according to a tab id
             * @param tabId
             * @returns {boolean} - determines whether the tab was found and activated
             */
            frame.tryActivateTabId = function(tabId) {
                if (tabId===undefined)
                    return false;
                if (frame.hasTabId(tabId)) {
                    frame.activateTab_byID(tabId);
                    return true;
                }
                var popupWindow = null;
                $.each(PopupWindow.getActiveWindowList(), function(idx, popup) {
                    if (popup.__originalFlexTabberId == tabId)
                        popupWindow = popup;
                });
                if (popupWindow) {
                    popupWindow.bringToTop();
                    return true;
                }
                return false;
            };


            /**
             * Defines this flex tabber as the one and only tabber that can be used to dock popup windows
             */
            frame.setAsPopupDocker = function(buttonCloseView, hiderCloseView, viewTitle) {
                PopupWindow.docker = function (popup) {
                    var tabId = frame.addTabFrame(popup.__originalFlexTabberId, popup.getHeaderInfo(), popup.getRootFrame(), {
                        autoActivate: false
                    });
                    setTimeout(function () {
                        AXMUtils.animateBoxTransition(
                            popup.get$El(),
                            frame.getTabInfo_byId(tabId).get$El(),
                            {},
                            function () {
                                popup.close(true);
                            });
                    }, 100);
                };

                if (buttonCloseView) {
                    frame.hiderCloseView = hiderCloseView;
                    buttonCloseView.addNotificationHandler(function() {
                        var currentTabId = frame.getCurrentTabId();
                        if (currentTabId) {
                            var tabInfo = frame.getTabInfo_byId(currentTabId);
                            if (!tabInfo._isFixed)
                                frame.closeTab_byID(currentTabId);
                        }
                    })
                }

                frame.viewTitle = viewTitle;
            };


            /**
             * Closes a view (tab or undocked popup), provided a tab ID
             * @param tabId
             */
            frame.closeView_byID = function(tabId) {
                if (frame.hasTabId(tabId)) {
                    frame.closeTab_byID(tabId);
                }
                else {
                    $.each(PopupWindow.getActiveWindowList(), function(idx, popupWindow) {
                        if (tabId == popupWindow.__originalFlexTabberId) {
                            popupWindow.close();
                        }
                    });
                }
            };


            return frame;
        };




        return Module;
    });

