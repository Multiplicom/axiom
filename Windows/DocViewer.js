define([
        "require", "jquery", "_",
        "AXM/AXMUtils", "AXM/Panels/Frame", "AXM/Panels/PanelForm", "AXM/Panels/PanelHtml", "AXM/Windows/PopupWindow", "AXM/Windows/SimplePopups", "AXM/Controls/Controls"],
    function (
        require, $, _,
        Utils, Frame, PanelForm, PanelHtml, Popupwin, SimplePopups, Controls) {

        var Module = {};


        Module.create = function(docId) {

            Module.topicStack = [];
            Module.topicStackPointer = -1;

            var win = Popupwin.create({
                title: 'Documentation',
                sizeX: 600,
                sizeY: 500,
                autoCenter: true,
                closeOnEscape:true
            });


            var _init = function() {
                var rootFrame = Frame.FrameSplitterVert();

                var form1 = PanelForm.create('controls');

                win.bt_previous = Controls.Button({
                    icon:'fa-arrow-left',
                    width:40,
                    height:40,
//                enabled: false
                }).addNotificationHandler(win.onPrevious);
                win.bt_next = Controls.Button({
                    icon:'fa-arrow-right',
                    width:40,
                    height:40,
//                enabled: false
                }).addNotificationHandler(win.onNext);
                form1.setRootControl(Controls.Compound.GroupHor({}, [win.bt_previous, win.bt_next]));

                rootFrame.addMember(Frame.FrameFinal(form1)).setFixedDimSize(Frame.dimY,42);

                //var formContent = PanelForm.create('content');
                //win.ctrl_content = Controls.Static({text:
                //    '<div style="overflow-y: scroll;height:100%"><div style="margin:5px;" class="doccontent"></div></div>'
                //});
                //formContent.setRootControl(win.ctrl_content);
                win.panelContent = PanelHtml.create();
                win.panelContent.enableVScrollBar();
                rootFrame.addMember(Frame.FrameFinal(win.panelContent));

                win.setRootFrame(rootFrame);
                win.start();
                win._updateButtons();
            };


            win.onPrevious = function() {
                if (Module.topicStackPointer > 0) {
                    Module.topicStackPointer--;
                    win._loadDocUrlSub(Module.topicStack[Module.topicStackPointer].url, Module.topicStack[Module.topicStackPointer].scrollPos);
                    win._updateButtons();
                }
            };

            win.onNext = function() {
                if (Module.topicStackPointer < Module.topicStack.length - 1) {
                    Module.topicStackPointer++;
                    win._loadDocUrlSub(Module.topicStack[Module.topicStackPointer].url, Module.topicStack[Module.topicStackPointer].scrollPos);
                    win._updateButtons();
                }
            };

            win._updateButtons = function() {
                win.bt_previous.setEnabled(Module.topicStackPointer > 0);
                win.bt_next.setEnabled(Module.topicStackPointer < Module.topicStack.length - 1);
            };

            win.loadDocId = function(docId) {
                win.loadDocUrl('/static/docs/{docid}.html'.AXMInterpolate({docid: docId}));
            }

            win.loadDocUrl = function(url) {
                if (Module.topicStackPointer >= 0)
                    Module.topicStack[Module.topicStackPointer].scrollPos = win.panelContent.get$El().scrollTop();
                Module.topicStack = Module.topicStack.slice(0, Module.topicStackPointer + 1);
                Module.topicStack.push({ url: url, scrollPos: 0 });
                Module.topicStackPointer = Module.topicStack.length - 1;
                win._loadDocUrlSub(url);
                win._updateButtons();
            };

            win._loadDocUrlSub = function(url, scrollPos) {
                var busyid = SimplePopups.setBlockingBusy('Fetching document');
                $.get(url, {})
                    .done(function (data) {
                        SimplePopups.stopBlockingBusy(busyid);
                        var content = $('<div/>').append(data).find('.AXMDocContent').html();
                        content = _TRL(content);
                        win._loadContent('<div style="margin:8px">' + content + '</div>', scrollPos);
                    })
                    .fail(function () {
                        SimplePopups.stopBlockingBusy(busyid);
                        alert("Failed to download Module item '" + docId + "'");
                    });
                win._updateButtons();
            };

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



