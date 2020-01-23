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
        "AXM/AXMUtils", "AXM/Windows/PopupWindow", "AXM/Windows/TransientPopup", "AXM/Controls/Controls"],
    function (
        require, $, _,
        Utils, Popupwin, TransientPopup, Controls) {


        /**
         * Module encapsulating a number of commonly used stock popup windows
         * @type {{}}
         */
        var Module = {};

        /**
         * Creates a classical message box
         * @param {string} content - content of the box
         * @param {string} title - title
         * @param {function} onProceed - called when the user clicks OK
         * @returns {{}} - the popup window instance
         * @constructor
         */
        Module.MessageBox = function(content, title, onProceed) {
            if (!title)
                title = _TRL("Message");

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
            grp.add(Controls.Static({text: typeof content === "object" ? content : content +'<p/>'}));

            var btOK = Controls.Button({
                text: _TRL('OK'),
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


        /**
         * Creates a confirmation popup box
         * @param {string} content
         * @param {string} title
         * @param {{}} settings
         * @param {string} settings.textOK - txt on the OK button
         * @param {string} settings.iconOK - icon of the OK button
         * @param {string} settings.textCancel - txt on the Cancel button
         * @param {string} settings.iconCancel - icon of the Cancel button
         * @param {function} onOK - called when the user clicks the OK button
         * @param {function} onCancel - called when te user clicks the Cancel button
         * @constructor
         * @returns {{}} - the popup window instance
         */
        Module.ConfirmationBox = function(content, title, settings, onOK, onCancel) {
            if (!title)
                title = _TRL("Confirmation");
            if (!settings)
                settings = {};

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: typeof content === "object" ? content : content +'<p/>'}));

            var btOK = Controls.Button({
                text: settings.textOK || _TRL('OK'),
                icon: settings.iconOK || 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onOK)
                        onOK();
                });

            var btCancel = Controls.Button({
                text: settings.textCancel || _TRL('Cancel'),
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


        /**
         * Creates a popup with options "Yes", "No", "Cancel"
         * @param {string} content - popup content
         * @param {string} title - popup title
         * @param {{}} settings
         * @param {string} settings.textYes - txt on the Yes button
         * @param {string} settings.iconYes - icon of the Yes button
         * @param {string} settings.textNo - txt on the No button
         * @param {string} settings.iconNo - icon of the No button
         * @param {function} onYes - called when the user clicks Yes
         * @param {function} onNo - called when the user clicks No
         * @param {function} onCancel - called when the user clicks Cancel
         * @constructor
         * @returns {{}} - the popup window instance
         */
        Module.YesNoCancelBox = function(content, title, settings, onYes, onNo, onCancel) {
            if (!title)
                title = _TRL("Confirmation");
            if (!settings)
                settings = {};

            var win = Popupwin.create({
                title: title,
                blocking:true,
                headerIcon: settings.headerIcon||null,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            grp.add(Controls.Static({text: typeof content === "object" ? content : content +'<p/>'}));

            var btYes = Controls.Button({
                text: settings.textYes || _TRL('Yes'),
                icon: settings.iconYes || 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onYes)
                        onYes();
                });

            var btNo = Controls.Button({
                text: settings.textNo || _TRL('No'),
                icon: settings.iconNo || 'fa-times'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onNo)
                        onNo();
                });

            var btCancel = Controls.Button({
                text: _TRL('Cancel')
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


        /**
         * Creates a popup presenting a number of choices as buttons
         * @param {string} title
         * @param {string} intro - intro text above the acion buttons
         * @param {[{name, icon, action}]} actions - list of actions (action = handler function). Optional buttonClass key
         * @param {{}} settings
         * @constructor
         * @returns {{}} - the popup window instance
         */
        Module.ActionChoiceBox = function(title, intro, actions, settings) {
            if (!title)
                title = _TRL("Action");
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
            grp.add(Controls.Static({text: typeof intro === "object" ? intro : intro +'<p/>'}));

            var buttons = [];
            $.each(actions, function(idx, action) {
                var bt = Controls.Button({
                    text: action.name,
                    icon: action.icon || null,
                    width:140,
                    height: 65,
                    iconSizeFraction: 1.4
                })
                    .addNotificationHandler(function() {
                        win.close();
                        action.action();
                    });
                if(action.buttonClass){
                    bt.addClass(action.buttonClass);
                }
                buttons.push(bt);
            });




            grp.add(Controls.Compound.GroupHor({}, buttons) );

            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };


        /**
         * Creates a popup with a text edit box
         * @param {string} value - initial content of the edit box
         * @param {string} header - text displayed above the edit box
         * @param {string} title - title of the popup
         * @param {{}} settings
         * @param {function} onOK - called when the user clicks OK (new content provided as argument)
         * @param {function} onCancel - called when the user clicks Cancel
         * @constructor
         * @returns {{}} - the popup instance
         */
        Module.TextEditBox = function(value, header, title, settings, onOK, onCancel) {

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({separator:12});
            grp.add(Controls.Static({text: header}));

            var btOK = Controls.Button({
                text: _TRL('OK'),
                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.onOK();
                });

            var btCancel = Controls.Button({
                text: _TRL('Cancel'),
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


        /**
         * Creates a popup presenting a drop-down list with a number of choices
         * @param {string} value - initial value of chocie ID
         * @param {[{}]} choices - list of choices (see AXM.Controls.DropList for details)
         * @param {string} header - text above the drop down
         * @param {string} title - popup title
         * @param {{}} settings
         * @param {boolean} settings.canBeEmpty - allow to select nothing
         * @param {function} onOK - called when the user clicks OK (active choice id provided as an argument)
         * @param {function} onCancel - called when the user clicks Cancel
         * @constructor
         */
        Module.MultipleChoiceBox = function(value, choices, header, title, settings, onOK, onCancel) {

            if (!settings.useTransientPopup) {
                var win = Popupwin.create({
                    title: title,
                    headerIcon: settings.headerIcon||null,
                    blocking:true,
                    autoCenter: true
                });
            }
            else {
                var win = TransientPopup.create({
                    DOM$Elem: settings.DOM$Elem
                });
            }

            var grp = Controls.Compound.GroupVert({separator:5});

            if (settings.useTransientPopup && (!header) && title)
                grp.add(title);

            if (settings.helpId)
                grp.add(Controls.Compound.GroupHor({verticalAlignCenter: true}, [
                    header,
                    Controls.HelpButton(settings.helpId)
                ]) );
            else
                grp.add(header);

            var btOK = Controls.Button({
                text: _TRL('OK'),
                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    win.onOK();
                });

            var btCancel = Controls.Button({
                text: _TRL('Cancel'),
                icon: 'fa-times'
            })
                .addNotificationHandler(function() {
                    win.close();
                    if (onCancel)
                        onCancel();
                });

            if (settings.controlType == 'dropdown') {
                win.ctrlChoices = Controls.DropList({value: value, width: settings.controlWidth});
            }
            else {
                win.ctrlChoices = Controls.RadioGroup({value: value});
            }

            $.each(choices, function(idx, choice) {
                win.ctrlChoices.addState(choice.id, choice.name, choice.group);
            });
            grp.add(win.ctrlChoices);

            grp.add(Controls.Compound.SeparatorV(10));

            grp.add(Controls.Compound.GroupHor({}, [btOK, btCancel]) );

            win.onOK = function() {
                var newValue = win.ctrlChoices.getValue();
                if(!newValue && !settings.canBeEmpty){
                    Module.ErrorBox(_TRL("Please select an option from the list."));
                }
                else{
                    win.close();
                    if (onOK)
                        onOK(newValue);
                }
            };

            if (win.setHandler_OnPressedEnter)
                win.setHandler_OnPressedEnter(win.onOK);
            if (!settings.useTransientPopup)
                grp = Controls.Compound.StandardMargin(grp);
            win.setRootControl(grp);
            win.start();
        };


        /**
         * Creates a popup window containing an error message
         * @param {string} content - content of the error box
         * @param {string} title
         * @param {function} onProceed - called when the user closes the error box
         * @constructor
         * @returns {{}} - popup instance
         */
        Module.ErrorBox = function(content, title, onProceed) {
            if (!title)
                title = _TRL("Error");

            var win = Popupwin.create({
                title: title,
                blocking:true,
                autoCenter: true,
                preventClose: true
            });

            var grp1 = Controls.Compound.GroupHor({}).setSeparator(20);
            grp1.add(Controls.Static({text: '<div style="font-size: 44px;padding:15px;display: inline-block;color:rgb(200,0,0)"><i class="fa fa-exclamation-triangle"></i></div>'}));

            var grp2 = Controls.Compound.GroupVert({});
            grp1.add(grp2);
            grp2.add(Controls.Static({text: typeof content === "object" ? content : content +'<p/>'}));

            var btOK = Controls.Button({
                text: _TRL('Close')
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

        Object.defineProperties(Module, {
            currentlyBlocking: {
                get: function() {
                    return Module.busyWin !== null || Module.blockingBusy_list.length > 0;
                }
            }
        });

        /**
         * Displays a busy message that blocks the entire app UI
         * @param {string} msg - message content
         * @returns {string} -  id if the busy message
         */
        Module.setBlockingBusy = function(msg) {
            var id = Utils.getUniqueID();
            Module.blockingBusy_list.push({id: id, msg: msg});
            //console.log(JSON.stringify(Module.blockingBusy_list));
            Module.updateBusyWin();
            return id;
        };


        /**
         * Removes a blocking busy message
         * @param {string} id - id of the busy message as returned by setBlockingBusy
         */
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


        /**
         * Updates the status of the blocking busy popup(s). Internal usage only
         */
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


        /**
         * Creates a new busy popup (internal only)
         * @param data
         */
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
            win._fadeTime = 50;
            win.start();
        };



        return Module;
    });
