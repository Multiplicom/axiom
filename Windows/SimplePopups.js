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
        Utils, PopupWindow, Controls) {

        var Module = {};

        Module.MessageBox = function(content, title) {
            if (!title)
                title = "Message";

            var window = PopupWindow.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: content+'<p/>'}));

            var btOK = Controls.Button({
                text: 'OK',
                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    window.close();
                });
            grp.add(btOK);

            window.setHandler_OnPressedEnter(window.close);
            window.setRootControl(Controls.Compound.StandardMargin(grp));
            window.start();

        };


        Module.ConfirmationBox = function(content, title, settings, onOK, onCancel) {
            if (!title)
                title = "Confirmation";

            var window = PopupWindow.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: content+'<p/>'}));

            var btOK = Controls.Button({
                text: 'OK',
                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    window.close();
                    if (onOK)
                        onOK();
                });

            var btCancel = Controls.Button({
                text: 'Cancel',
                icon: 'fa-times'
            })
                .addNotificationHandler(function() {
                    window.close();
                    if (onCancel)
                        onCancel();
                });

            grp.add(Controls.Compound.GroupHor({}, [btOK, btCancel]) );

            window.setHandler_OnPressedEnter(window.close);
            window.setRootControl(Controls.Compound.StandardMargin(grp));
            window.start();

        };


        Module.ErrorBox = function(content, title, onProceed) {
            if (!title)
                title = "Error";

            var window = PopupWindow.create({
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
                    window.close();
                    if (onProceed)
                        onProceed();
                });
            grp2.add(btOK);

            window.setHandler_OnPressedEnter(window.close);
            window.setRootControl(Controls.Compound.StandardMargin(grp1));
            window.start();

        };

        Module.blockingBusy_items = {};

        Module.setBlockingBusy = function(msg) {
            var win = PopupWindow.create({
                blocking:true,
                blockingTransparent: true,
                autoCenter: true,
                preventClose: true
            });

            var grp = Controls.Compound.GroupHor({});
            var txt = '';
            txt += '<div style="padding:15px;display:inline-block;vertical-align: middle"><i class="fa fa-spinner fa-spin fa-3x"></i></div>';
            txt += '<div style="padding:15px;display:inline-block;vertical-align: middle">' + msg + '</div>';
            grp.add(Controls.Static({text: txt}));

            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
            var id = Utils.getUniqueID();
            Module.blockingBusy_items[id] = win;
            return id;
        };

        Module.stopBlockingBusy = function(id) {
            if (id in Module.blockingBusy_items) {
                Module.blockingBusy_items[id].close();
                Module.blockingBusy_items[id] = null;
                delete Module.blockingBusy_items[id];
            }

        };



        return Module;
    });

