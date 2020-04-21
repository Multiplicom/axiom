define([
        "require", "jquery", "_",
        "AXM/AXMUtils", "AXM/Panels/Frame", "AXM/Panels/PanelForm", "AXM/Panels/PanelHtml", "AXM/Windows/PopupWindow", "AXM/Windows/SimplePopups", "AXM/Controls/Controls"],
    function (
        require, $, _,
        Utils, Frame, PanelForm, PanelHtml, Popupwin, SimplePopups, Controls) {


        /**
         * Module encapsulating a popup window that is displaying static documentation content
         * @type {{}}
         */
        var Module = {};


        Module._docRoot = '/static/docs';

        /**
         * Sets the root folder where documentation is located
         * @param {string docRoot - documentation root
         */
        Module.setDocRoot = function(docRoot) {
            Module._docRoot = docRoot
        };

        /**
         * Fetches a document from the server in an async way
         * @param {string} docId - document identifier
         * @param {function} onCompleted - called when the fetch was completed (content provided as argument)
         * @param {function} onFailed - called when the fetch failed
         * @param {{}} settings
         * @param {boolean} settings.blocking - if true, a blocking message is displayed for the duration of the fetching process
         */
        Module.fetchDocument = function(docId, onCompleted, onFailed, settings) {
            var url = Module._docRoot + `/${docId}.html`;
            if (settings.blocking)
                var busyid = SimplePopups.setBlockingBusy('Fetching document');
            $.get(url, {})
                .done(function (data) {
                    if (busyid)
                        SimplePopups.stopBlockingBusy(busyid);
                    var content = $('<div/>').append(data).find('.AXMDocContent').html();
                    content = _TRL(content);
                    onCompleted(content);
                })
                .fail(function () {
                    if (busyid)
                        SimplePopups.stopBlockingBusy(busyid);
                    if (onFailed)
                        onFailed();
                });
        };


        /**
         * Creates a popup window that is displaying static documentation content
         * @param {string} docId - identifier of the documentation item to be shown
         * @returns {{}} - popup window instance
         * @constructor
         */
        Module.create = function(docId) {

            Module.topicStack = [];
            Module.topicStackPointer = -1;

            var win = Popupwin.create({
                title: 'Documentation',
                sizeX: 750,
                sizeY: 650,
                autoCenter: true,
                closeOnEscape:true,
                canDock:true
            });


            /**
             * Initialises the popup
             * @private
             */
            var _init = function() {
                var form1 = PanelForm.create('controls');

                win.panelContent = PanelHtml.create();
                win.panelContent.enableVScrollBar();
                var theFrame = Frame.FrameFinalCommands(win.panelContent);
                //rootFrame.addMember(theFrame);

                win.bt_previous = theFrame.addCommand({
                    icon: 'fa-arrow-left'
                }, win.onPrevious);

                win.bt_next = theFrame.addCommand({
                    icon: 'fa-arrow-right'
                }, win.onNext);


                win.setRootFrame(theFrame);
                win.start();
                win._updateButtons();
            };


            /**
             * Navigates to the previously accessed documentation topic
             */
            win.onPrevious = function() {
                if (Module.topicStackPointer > 0) {
                    Module.topicStackPointer--;
                    win._loadDocUrlSub(Module.topicStack[Module.topicStackPointer].url, Module.topicStack[Module.topicStackPointer].scrollPos);
                    win._updateButtons();
                }
            };


            /**
             * When the user navigated back to the previously accessed documentation topic, nagivates forward to the topic before this back navigation
             */
            win.onNext = function() {
                if (Module.topicStackPointer < Module.topicStack.length - 1) {
                    Module.topicStackPointer++;
                    win._loadDocUrlSub(Module.topicStack[Module.topicStackPointer].url, Module.topicStack[Module.topicStackPointer].scrollPos);
                    win._updateButtons();
                }
            };

            /**
             * Updates the enabled state of the navigation buttons
             * @private
             */
            win._updateButtons = function() {
                win.bt_previous.setEnabled(Module.topicStackPointer > 0);
                win.bt_next.setEnabled(Module.topicStackPointer < Module.topicStack.length - 1);
            };


            /**
             * Loads the content of the documentation item
             * @param {string} docId - documentation item id
             */
            win.loadDocId = function(docId) {
                win.loadDocUrl(Module._docRoot + `/${docId}.html`);
            };

            /**
             * Loads the content of an url
             * @param {string} url - url providing the content
             */
            win.loadDocUrl = function(url) {
                if (Module.topicStackPointer >= 0)
                    Module.topicStack[Module.topicStackPointer].scrollPos = win.panelContent.get$El().scrollTop();
                Module.topicStack = Module.topicStack.slice(0, Module.topicStackPointer + 1);
                Module.topicStack.push({ url: url, scrollPos: 0 });
                Module.topicStackPointer = Module.topicStack.length - 1;
                win._loadDocUrlSub(url);
                win._updateButtons();
            };


            /**
             * Implements loading the content of an url
             * @param {string} url
             * @param {int} scrollPos - vertical scroll position
             * @private
             */
            win._loadDocUrlSub = function(url, scrollPos) {
                var busyid = SimplePopups.setBlockingBusy('Fetching document');
                $.get(url, {})
                    .done(function (data) {
                        SimplePopups.stopBlockingBusy(busyid);
                        var content = $('<div/>').append(data).find('.AXMDocContent').html();
                        content = _TRL(content);
                        win._loadContent('<div class="AXMDocContent">' + content + '</div>', scrollPos);
                    })
                    .fail(function () {
                        SimplePopups.stopBlockingBusy(busyid);
                        alert("Failed to download documentation item '" + docId + "'");
                    });
                win._updateButtons();
            };

            /**
             * Sets content to the popup
             * @param {string} content - html content
             * @param {int} scrollPos
             * @private
             */
            win._loadContent = function(content, scrollPos) {
                win.panelContent.setContent(content);
                if (Utils.isSuperUser())
                win.panelContent.get$El().find('.SuperUserOnly').css('display', 'inherit');
                if (scrollPos)
                    win.panelContent.get$El().scrollTop(scrollPos);
                else
                    win.panelContent.get$El().scrollTop(0);
                win.panelContent.get$El().find('.AXMDocLink').click(function(ev) {
                    var href = $(this).attr('href');
                    win.loadDocUrl(href);
                    ev.stopPropagation();
                    ev.preventDefault();
                    return false;
                })
            };

            _init();

            win.loadDocId(docId);
        };


        return Module;
    });



