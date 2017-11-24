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
         * Module encapsulating a panel that contains a list
         * @type {{}}
         */
        var Module = {};


        /**
         * Implements a panel that contains a list
         * @param {string} id - panel id
         * @returns {id}
         */
        Module.create = function(id) {
            var panel = PanelBase.create(id);

            panel._itemMap = {};
            panel._itemList = [];
            panel._activeItemId = null;
            panel._notificationHandlers = [];


            /**
             * Adds a new item to the list
             * @param {string} id - unique id of the list item
             * @param {string} content - displayed content
             */
            panel.addItem = function(id, content) {
                if (panel._itemMap[id])
                    AXMUtils.Test.reportBug("List item already present: " + id);
                var item = {
                    id: id,
                    content: content
                };
                panel._itemList.push(item);
                panel._itemMap[id] = item;
                if (panel.isRendered()) {
                    var itemDiv = DOM.Div({id: panel.getItemElementId(item.id) });
                    itemDiv.addCssClass("AXMPanelListItem");
                    itemDiv.addElem(item.content);
                    panel.get$El().append(itemDiv.toString());
                }
            };


            panel.clearItems = function(sendNotification) {
                panel.setActiveListItemId(null, sendNotification);
                panel._itemList = [];
                panel._itemMap = {};
                if (panel.isRendered()) {
                    panel.get$El().empty();
                }
            };


            /**
             * Sets an item as being active
             * @param {string} itemId
             */
            panel.setActiveListItemId = function(itemId, sendNotification){
                if (itemId === panel._activeItemId)
                    return;
                if (panel._itemMap[id] && (itemId))
                    AXMUtils.Test.reportBug("List item not present: " + id);
                panel._activeItemId = itemId;
                if (panel.isRendered())
                    panel._updateSelection();
                if (sendNotification!==false)
                    panel._notify("ActiveItemModified");
            };


            /**
             * Changes the content of an item
             * @param {string} itemId
             * @param {string} newContent
             */
            panel.modifyItemContent = function(itemId, newContent) {
                if (!panel._itemMap[itemId])
                    return;
                panel._itemMap[itemId].content = newContent;
                if (panel.isRendered())
                    $('#'+panel.getItemElementId(itemId)).html(newContent);
            };


            /**
             * Returns the id of the currently active item
             * @returns {null|string}
             */
            panel.getActiveListItemId = function(){
                return panel._activeItemId;
            };

            /**
             * Adds a handler function that is called when the status of the panel changes
             * @param {function} handlerFunc - callback
             * @returns {Object} - self
             */
            panel.addNotificationHandler = function(handlerFunc) {
                panel._notificationHandlers.push(handlerFunc);
                return panel;
            };


            /**
             * Enables a vertical scroll bar for the panel
             * @returns {Object} - self
             */
            panel.enableVScrollBar = function() {
                panel._scrollbarV  = true;
                return panel;
            };


            /**
             * Notifies event handlers about an event that occurred
             * @param {string} eventType - event type identifier
             * @private
             */
            panel._notify = function(eventType) {
                $.each(panel._notificationHandlers, function(idx, handler) {
                    handler(eventType);
                });
            };


            /**
             * Returns the jquery element of the html content
             * @returns {jQuery}
             */
            panel.get$El = function() {
                return $('#' + panel.getId() + '_content');
            };


            /**
             * Determines if the panel is live in the DOM tree
             * @returns {boolean}
             */
            panel.isRendered = function() {
                return panel.get$El().length > 0;
            };


            /**
             * Returns the ID of the element with the content
             * @returns {string}
             */
            panel.getContentElementId = function() {
                return panel.getId() + '_content';
            };


            /**
             * Returns the html ID of the element containing a list item
             * @param item
             * @returns {string}
             */
            panel.getItemElementId = function(itemId) {
                return panel.getId() + '_it_'+itemId;
            };

            /**
             * Returns the html implementing the panel
             * @returns {string}
             */
            panel.createHtml = function() {
                var rootDiv = DOM.Div({id: panel.getId()+'_content'});
                rootDiv.addCssClass('AXMHtmlPanelBody');
                rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', '100%');
                rootDiv.addStyle('overflow', 'hidden');
                if (panel._scrollbarV)
                    rootDiv.addStyle('overflow-y', 'scroll');
                else
                    rootDiv.addStyle('overflow-y', 'auto');

                $.each(panel._itemList, function(idx, item) {
                    var itemDiv = DOM.Div({id: panel.getItemElementId(item.id), parent: rootDiv});
                    itemDiv.addCssClass("AXMPanelListItem");
                    itemDiv.addElem(item.content);
                });

                return rootDiv.toString();
            };


            panel._updateSelection= function() {
                panel.get$El().children().removeClass("AXMPanelListItemSelected");
                if (panel._activeItemId)
                    panel.get$El().find('#'+panel.getItemElementId(panel._activeItemId)).addClass("AXMPanelListItemSelected");
            };


            /**
             * Attaches the html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function() {
                panel._updateSelection();
                panel.get$El().click(panel._onClick);
            };



            /**
             * Detaches the html event handlers
             */
            panel.detachEventHandlers = function() {
                panel._notificationHandlers = [];
                panel.get$El().unbind('click');
            };

            panel._onClick = function(ev) {
                if (event.target) {
                    var clicked$El = $(event.target);
                    if (clicked$El.length<1)
                        AXMUtils.Test.reportBug('Unable to obtain click target');
                    var newActiveItemId = null;
                    $.each(panel._itemList, function(idx, item) {
                        var listItem$El = $("#" + panel.getItemElementId(item.id));
                        if ((listItem$El[0]==clicked$El[0]) || $.contains(listItem$El[0], clicked$El[0])) {
                            newActiveItemId = item.id;
                        }
                    });
                    if ((newActiveItemId!==null) && (newActiveItemId!=panel._activeItemId)) {
                        panel.setActiveListItemId(newActiveItemId);
                    }
                }
            };

            panel.resize = function(xl, yl) {
            };

            return panel;
        } ;

        return Module;
    });

