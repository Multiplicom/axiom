define([
        "require", "jquery", "_",
        "AXM/AXMUtils", "AXM/Panels/Frame", "AXM/Panels/PanelForm", "AXM/Panels/PanelHtml", "AXM/Windows/Popupwindow", "AXM/Controls/Controls"],
    function (
        require, $, _,
        Utils, Frame, PanelForm, PanelHtml, Popupwin, Controls) {

        var Module = {};


        Module.create = function(docId) {

            var win = Popupwin.create({
                title: 'Documentation',
                sizeX: 600,
                sizeY: 500,
                autoCenter: true,
                closeOnEscape:true
            });

            var rootFrame = Frame.FrameSplitterVert();

            var form1 = PanelForm.create('controls');

            var bt1 = Controls.Button({
                icon:'fa-arrow-left',
                width:40,
                height:40,
                enabled: false
            }).addNotificationHandler(function() {
            });
            var bt2 = Controls.Button({
                icon:'fa-arrow-right',
                width:40,
                height:40,
                enabled: false
            }).addNotificationHandler(function() {
            });
            form1.setRootControl(Controls.Compound.GroupHor({}, [bt1, bt2]));

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

            win.loadDoc = function(docId) {
                var url = '/static/docs/{docid}.html'.AXMInterpolate({docid: docId});
                $.get(url, {})
                    .done(function (data) {
                        //DQX.stopProcessing();
                        var content = $('<div/>').append(data).find('.AXMDocContent').html();
                        win.panelContent.setContent('<div style="margin:8px">' + content + '</div>');
                        //win.ctrl_content._getSub$El('').find('.doccontent')
                        //    .html($);
                        //if (scrollPos)
                        //    $('#DocuBoxContent').scrollTop(scrollPos);
                        //else
                        //    $('#DocuBoxContent').scrollTop(0);
                        //Documentation.scrollHelper.update();
                    })
                    .fail(function () {
                        //DQX.stopProcessing();
                        alert("Failed to download documentation item '" + docId + "'");
                    });
            };

            win.start();
            win.loadDoc(docId);
        };


        return Module;
    });



//
//define(["jquery", "DQX/Utils", "DQX/DocEl", "DQX/Msg", "DQX/Popup"],
//    function ($, DQX, DocEl, Msg, Popup) {
//        var Documentation = {};
//
//        Documentation.topicStack = [];
//        Documentation.topicStackPointer = -1;
//
//        Documentation._onCancel = function () {
//            $('#DocuBoxBackGround').remove();
//            DQX.unRegisterGlobalKeyDownReceiver('DocuBox');
//        }
//
//        closeDocumentation = function () {
//            Documentation._onCancel();
//        }
//
//        Documentation._onPrevious = function () {
//            if (Documentation.topicStackPointer > 0) {
//                Documentation.topicStackPointer--;
//                Documentation._displayHelp(Documentation.topicStack[Documentation.topicStackPointer].url, Documentation.topicStack[Documentation.topicStackPointer].scrollPos);
//            }
//        }
//
//        Documentation._onNext = function () {
//            if (Documentation.topicStackPointer < Documentation.topicStack.length - 1) {
//                Documentation.topicStackPointer++;
//                Documentation._displayHelp(Documentation.topicStack[Documentation.topicStackPointer].url, Documentation.topicStack[Documentation.topicStackPointer].scrollPos);
//            }
//        }
//
//        Documentation._createBox = function () {
//
//            if ($('#DocuBoxBackGround').length > 0)
//                return;
//
//            Documentation.topicStack = [];
//            Documentation.topicStackPointer = -1;
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
//            var thecloser = DocEl.JavaScriptBitmaplink(DQX.BMP("close2.png"), "Close", "closeDocumentation();");
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
//                //                    { id: 'DocuBoxButtonCancel', name: '', bitmap: DQX.BMP('cancel.png'), handler: Documentation._onCancel },
//                {id: 'DocuBoxButtonPrevious', name: '', bitmap: DQX.BMP('arrow5left.png'), handler: Documentation._onPrevious },
//                { id: 'DocuBoxButtonNext', name: '', bitmap: DQX.BMP('arrow5right.png'), handler: Documentation._onNext },
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
//                if (ev.isEscape) Documentation._onCancel('DocuBox');
//            }, 'DocuBox');
//
//            //Documentation.scrollHelper = DQX.scrollHelper($('#DocuBoxContent'));
//        }
//
//
//        //Show a help box corresponding to a help id item in the DOM
//        Documentation.showHelp = function (url) {
//            if (Documentation.topicStackPointer >= 0)
//                Documentation.topicStack[Documentation.topicStackPointer].scrollPos = $('#DocuBoxContent').scrollTop();
//            Documentation._createBox();
//            Documentation.topicStack = Documentation.topicStack.slice(0, Documentation.topicStackPointer + 1);
//            Documentation.topicStack.push({ url: url, scrollPos: 0 });
//            Documentation.topicStackPointer = Documentation.topicStack.length - 1;
//            Documentation._displayHelp(url,0);
//        }
//
//        Documentation._displayHelp = function (url, scrollPos) {
//            $('#DocuBoxButtonPrevious').css('opacity', (Documentation.topicStackPointer > 0) ? 1 : 0.3);
//            $('#DocuBoxButtonNext').css('opacity', (Documentation.topicStackPointer < Documentation.topicStack.length - 1) ? 1 : 0.3);
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
//                    //Documentation.scrollHelper.update();
//                })
//                .fail(function () {
//                    DQX.stopProcessing();
//                    alert("Failed to download documentation item '" + url + "'");
//                });
//
//
//        }
//
//
//        Msg.listen('', { type: 'ShowHelp' }, function (context, helpid) {
//            Documentation.showHelp(helpid);
//        });
//
//
//        return Documentation;
//    });
