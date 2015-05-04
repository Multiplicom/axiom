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



//
//define(["jquery", "DQX/Utils", "DQX/DocEl", "DQX/Msg", "DQX/Popup"],
//    function ($, DQX, DocEl, Msg, Popup) {
//        var Module = {};
//
//        Module.topicStack = [];
//        Module.topicStackPointer = -1;
//
//        Module._onCancel = function () {
//            $('#DocuBoxBackGround').remove();
//            DQX.unRegisterGlobalKeyDownReceiver('DocuBox');
//        }
//
//        closeModule = function () {
//            Module._onCancel();
//        }
//
//        Module._onPrevious = function () {
//            if (Module.topicStackPointer > 0) {
//                Module.topicStackPointer--;
//                Module._displayHelp(Module.topicStack[Module.topicStackPointer].url, Module.topicStack[Module.topicStackPointer].scrollPos);
//            }
//        }
//
//        Module._onNext = function () {
//            if (Module.topicStackPointer < Module.topicStack.length - 1) {
//                Module.topicStackPointer++;
//                Module._displayHelp(Module.topicStack[Module.topicStackPointer].url, Module.topicStack[Module.topicStackPointer].scrollPos);
//            }
//        }
//
//        Module._createBox = function () {
//
//            if ($('#DocuBoxBackGround').length > 0)
//                return;
//
//            Module.topicStack = [];
//            Module.topicStackPointer = -1;
//
//            var background = DocEl.Div({ id: 'DocuBoxBackGround' });
//            background.addStyle("position", "absolute");
//            background.addStyle("left", '0px');
//            background.addStyle("top", '0px');
//            background.addStyle('width', '100%');
//            background.addStyle('height', '100%');
//            var wizbackcol = 'rgba(100,100,100,0.4)';
//            background.addStyle('background-color', wizbackcol);
//            background.addStyle('z-index', '2000');
//            $('#DQXUtilContainer').append(background.toString());
//
//            $('#DocuBoxBackGround').mousedown(function (ev) {
//                if (ev.target.id == 'DocuBoxBackGround') {
//                    $('#DocuBoxBackGround').css('background-color', 'rgba(50,50,50,0.6)');
//                    setTimeout(function () {
//                        $('#DocuBoxBackGround').css('background-color', wizbackcol);
//                        setTimeout(function () {
//                            $('#DocuBoxBackGround').css('background-color', 'rgba(50,50,50,0.6)');
//                            setTimeout(function () {
//                                $('#DocuBoxBackGround').css('background-color', wizbackcol);
//                            }, 150);
//                        }, 150);
//                    }, 150);
//                    //alert("Please close the wizard if you want to return to the application");
//                }
//            });
//
//            var pageSizeX = DQX.getwinClientW();
//            var pageSizeY = DQX.getwinClientH();
//            var boxSizeX = Math.min(800, pageSizeX - 100);
//
//            var box = DocEl.Div({ id: 'DocuBox' });
//            box.addStyle("position", "absolute");
//            box.addStyle("left", (pageSizeX - boxSizeX) / 2 + 'px');
//            box.addStyle("top", 50 + 'px');
//            box.addStyle('width', boxSizeX + 'px');
//            box.setCssClass("DQXDocuBox");
//            //box.addStyle("overflow", "hidden");
//
//            var thecloser = DocEl.JavaScriptBitmaplink(DQX.BMP("close2.png"), "Close", "closeModule();");
//            box.addElem(thecloser);
//            thecloser.addStyle('position', 'absolute');
//            thecloser.addStyle('right', '-16px');
//            thecloser.addStyle('top', '-16px');
//
//
//            var boxHeader = DocEl.Div({ id: 'DocuBoxHeader', parent: box });
//            boxHeader.setCssClass("DQXDocuBoxHeader DQXDragHeader");
//            //boxHeader.addElem('Help');
//
//            var boxFooter = DocEl.Div({ id: 'DocuBoxFooter', parent: box });
//            boxFooter.setCssClass("DQXDocuBoxFooter");
//            var boxButtons = DocEl.Div({ id: 'DocuBoxButtons', parent: boxFooter });
//
//            var buttons = [
//                //                    { id: 'DocuBoxButtonCancel', name: '', bitmap: DQX.BMP('cancel.png'), handler: Module._onCancel },
//                {id: 'DocuBoxButtonPrevious', name: '', bitmap: DQX.BMP('arrow5left.png'), handler: Module._onPrevious },
//                { id: 'DocuBoxButtonNext', name: '', bitmap: DQX.BMP('arrow5right.png'), handler: Module._onNext },
//            ];
//
//            for (var buttonNr = 0; buttonNr < buttons.length; buttonNr++) {
//                var button = buttons[buttonNr];
//                var boxButtonCancel = DocEl.Div({ id: button.id, parent: boxButtons });
//                boxButtonCancel.setCssClass("DQXDocuButton");
//                boxButtonCancel.addElem('<IMG SRC="' + button.bitmap + '" border=0 ALT="" style="margin-right:3px;margin-left:3px"></IMG>');
//                boxButtonCancel.addElem(button.name);
//            }
//            //boxButtons.addElem("<b>This is the title</b>");
//
//            var boxContent = DocEl.Div({ id: 'DocuBoxContent', parent: box });
//            boxContent.setCssClass("DQXDocuBoxBody");
//            boxContent.addStyle('max-height', (pageSizeY - 100 - 100) + 'px');
//
//            //boxContent.setHeightPx(boxSizeY - 4 - 105);
//
//
//            $('#DocuBoxBackGround').append(box.toString());
//            Popup.makeDraggable('DocuBox');
//
//            for (var buttonNr = 0; buttonNr < buttons.length; buttonNr++) {
//                var button = buttons[buttonNr];
//                $('#' + button.id).click($.proxy(button.handler, this));
//            }
//
//            DQX.registerGlobalKeyDownReceiver(function (ev) {
//                if (ev.isEscape) Module._onCancel('DocuBox');
//            }, 'DocuBox');
//
//            //Module.scrollHelper = DQX.scrollHelper($('#DocuBoxContent'));
//        }
//
//
//        //Show a help box corresponding to a help id item in the DOM
//        Module.showHelp = function (url) {
//            if (Module.topicStackPointer >= 0)
//                Module.topicStack[Module.topicStackPointer].scrollPos = $('#DocuBoxContent').scrollTop();
//            Module._createBox();
//            Module.topicStack = Module.topicStack.slice(0, Module.topicStackPointer + 1);
//            Module.topicStack.push({ url: url, scrollPos: 0 });
//            Module.topicStackPointer = Module.topicStack.length - 1;
//            Module._displayHelp(url,0);
//        }
//
//        Module._displayHelp = function (url, scrollPos) {
//            $('#DocuBoxButtonPrevious').css('opacity', (Module.topicStackPointer > 0) ? 1 : 0.3);
//            $('#DocuBoxButtonNext').css('opacity', (Module.topicStackPointer < Module.topicStack.length - 1) ? 1 : 0.3);
//
//            DQX.setProcessing("Downloading...");
//            $.get(url, {})
//                .done(function (data) {
//                    DQX.stopProcessing();
//                    $('#DocuBoxContent').html($('<div/>').append(DQX.interpolate(data)).find('.DQXHelpContent').html());
//                    if (scrollPos)
//                        $('#DocuBoxContent').scrollTop(scrollPos);
//                    else
//                        $('#DocuBoxContent').scrollTop(0);
//                    //Module.scrollHelper.update();
//                })
//                .fail(function () {
//                    DQX.stopProcessing();
//                    alert("Failed to download Module item '" + url + "'");
//                });
//
//
//        }
//
//
//        Msg.listen('', { type: 'ShowHelp' }, function (context, helpid) {
//            Module.showHelp(helpid);
//        });
//
//
//        return Module;
//    });
