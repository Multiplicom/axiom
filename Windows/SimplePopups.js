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
        "AXM/AXMUtils", "AXM/Windows/PopupWindow", "AXM/Controls/Controls"],
    function (
        require, $, _,
        Utils, Popupwin, Controls) {

        var Module = {};

        Module.MessageBox = function(content, title, onProceed) {
            if (!title)
                title = "Message";

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true,
                preventClose: true
            });

            win.doClose = function() {
                win.close();
                if (onProceed)
                    onProceed();
            };

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: content+'<p/>'}));

            var btOK = Controls.Button({
                text: 'OK',
                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.doClose();
                });
            grp.add(btOK);

            win.setHandler_OnPressedEnter(win.doClose);
            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();

        };


        Module.ConfirmationBox = function(content, title, settings, onOK, onCancel) {
            if (!title)
                title = "Confirmation";
            if (!settings)
                settings = {};

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: content+'<p/>'}));

            var btOK = Controls.Button({
                text: settings.textOK || 'OK',
                icon: settings.iconOK || 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onOK)
                        onOK();
                });

            var btCancel = Controls.Button({
                text: settings.textCancel || 'Cancel',
                icon: settings.iconCancel || 'fa-times'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onCancel)
                        onCancel();
                });

            grp.add(Controls.Compound.GroupHor({}, [btOK, btCancel]) );

            win.setHandler_OnPressedEnter(win.close);
            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();

        };


        Module.YesNoCancelBox = function(content, title, settings, onYes, onNo, onCancel) {
            if (!title)
                title = "Confirmation";
            if (!settings)
                settings = {};

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: content+'<p/>'}));

            var btYes = Controls.Button({
                text: settings.textYes || 'Yes',
                icon: settings.iconYes || 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onYes)
                        onYes();
                });

            var btNo = Controls.Button({
                text: settings.textNo || 'No',
                icon: settings.iconNo || 'fa-times'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onNo)
                        onNo();
                });

            var btCancel = Controls.Button({
                text: 'Cancel',
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onCancel)
                        onCancel();
                });

            grp.add(Controls.Compound.GroupHor({}, [btYes, btNo, btCancel]) );

            win.setHandler_OnPressedEnter(win.close);
            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };


        Module.ActionChoiceBox = function(title, intro, actions, settings) {
            if (!title)
                title = "Action";
            if (!intro)
                intro = "";
            if (!settings)
                settings = {};

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: intro+'<p/>'}));

            var buttons = [];
            $.each(actions, function(idx, action) {
                var bt = Controls.Button({
                    text: action.name,
//                    icon: settings.iconYes || 'fa-check'
                })
                    .addNotificationHandler(function() {
                        win.close();
                        action.action();
                    });
                buttons.push(bt);
            });




            grp.add(Controls.Compound.GroupHor({}, buttons) );

            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };



        Module.TextEditBox = function(value, header, title, settings, onOK, onCancel) {

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({separator:12});
            grp.add(Controls.Static({text: header}));

            var btOK = Controls.Button({
                text: 'OK',
                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.onOK();
                });

            var btCancel = Controls.Button({
                text: 'Cancel',
                icon: 'fa-times'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onCancel)
                        onCancel();
                });

            win.ctrlEdit = Controls.Edit({width:230, value: value}).setHasDefaultFocus();
            grp.add(win.ctrlEdit);

            grp.add(Controls.Compound.GroupHor({}, [btOK, btCancel]) );

            win.onOK = function() {
                var newValue = win.ctrlEdit.getValue();
                win.close();
                if (onOK)
                    onOK(newValue);
            };

            win.setHandler_OnPressedEnter(win.onOK);
            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };


        Module.ErrorBox = function(content, title, onProceed) {
            if (!title)
                title = "Error";

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true,
                preventClose: true
            });

            var grp1 = Controls.Compound.GroupHor({}).setSeparator(20);
            grp1.add(Controls.Static({text: '<div style="font-size: 44px;padding:15px;display: inline-block;color:rgb(200,0,0)"><i class="fa fa-exclamation-triangle"></i></div'}));

            var grp2 = Controls.Compound.GroupVert({});
            grp1.add(grp2);
            grp2.add(Controls.Static({text: content+'<p/>'}));

            var btOK = Controls.Button({
                text: 'Close',
//                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onProceed)
                        onProceed();
                });
            grp2.add(btOK);

            win.setHandler_OnPressedEnter(win.close);
            win.setRootControl(Controls.Compound.StandardMargin(grp1));
            win.start();

        };

        Module.blockingBusy_list = [];

        Module.busyWin = null;

        Module.setBlockingBusy = function(msg) {
            var id = Utils.getUniqueID();
            Module.blockingBusy_list.push({id: id, msg: msg});
            //console.log(JSON.stringify(Module.blockingBusy_list));
            Module.updateBusyWin();
            return id;
        };

        Module.stopBlockingBusy = function(id) {
            var idx = -1;
            $.each(Module.blockingBusy_list, function(i, data) {
                if (data.id == id)
                    idx = i;
            });
            if (idx >= 0) {
                Module.blockingBusy_list.splice (idx, 1);
                Module.updateBusyWin();
            }
        };

        Module.updateBusyWin = function() {
            if ( (!Module.busyWin) && (Module.blockingBusy_list.length>0) )
                Module.createBusyWin(Module.blockingBusy_list[0]);
            if (Module.busyWin) {
                if (Module.blockingBusy_list.length == 0) {
                    Module.busyWin.close();
                    Module.busyWin = null;
                }
                else {
                    var idx = -1;
                    $.each(Module.blockingBusy_list, function(i, data) {
                        if (Module.busyWin.busyId == data.id)
                            idx = i;
                    });
                    if (idx < 0) {
                        Module.busyWin.close();
                        Module.createBusyWin(Module.blockingBusy_list[0]);
                    }
                }
            }
        };

        Module.createBusyWin = function(data) {
            var win = Popupwin.create({
                blocking:true,
                blockingTransparent: true,
                autoCenterTop: true,
                preventClose: true
            });
            win.busyId = data.id;
            Module.busyWin = win;

            var grp = Controls.Compound.GroupHor({});
            var txt = '';
            txt += '<div style="padding:5px;display:inline-block;vertical-align: middle"><i class="fa fa-spinner fa-spin fa-2x"></i></div>';
            txt += '<div style="padding:5px;display:inline-block;vertical-align: middle">' + data.msg + '</div>';
            grp.add(Controls.Static({text: txt}));

            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };



        return Module;
    });

