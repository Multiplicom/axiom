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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Controls/Compound"],
    function (
        require, $, _,
        AXMUtils, DOM, Compound) {

        var Module = {
            Compound: Compound
        };

        Module.SingleControlBase = function() {
            var control = AXMUtils.object('@Control');
            control._id = 'CT'+AXMUtils.getUniqueID();
            control._hasDefaultFocus = false;
            control._notificationHandlers = [];

            control._getSubId = function (extension) {
                return control._id+extension;
            };

            control._getSub$El = function (extension) {
                return $('#' + control._getSubId(extension));
            };

            control.addNotificationHandler = function(handlerFunc) {
                if (!handlerFunc)
                    debugger;
                control._notificationHandlers.push(handlerFunc);
                return control;
            };

            //Defines this control to have the focus
            control.setHasDefaultFocus = function () {
                control._hasDefaultFocus = true;
                return control;
            }


            control.attachEventHandlers = function() {
            };


            control.performNotify = function(msg) {
                $.each(control._notificationHandlers, function(idx, fnc) {
                    if (!fnc)
                        debugger;
                    fnc(msg);
                });
            }

            return control;
        };

        Module.Static = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._text = settings.text || '';

            control.createHtml = function() {
                var div = DOM.Div({ id:control._getSubId('') })
                    .addStyle('display', 'inline-block').addStyle('vertical-align','middle');
                if (settings.maxWidth)
                    div.addStyle('max-width', settings.maxWidth+'px').addStyle('overflow-x', 'hidden').addStyle('text-overflow', 'ellipsis');
                if (settings.cssClass)
                    div.addCssClass(settings.cssClass);
                div.addElem(control._text);
                return div.toString();
            };

            control.modifyText = function(newText) {
                control._text = newText;
                $('#'+control._id).html(newText);
            };

            return control;
        };


        Module.RawHtml = function(content) {
            var control = Module.SingleControlBase({});

            control.createHtml = function() {
                return content;
            };

            return control;
        };



        Module.Button = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 45;
            control._buttonClass = settings.buttonClass || 'AXMButton';
            control._enabled = true;
            if (settings.enabled === false)
                control._enabled = false;
            control._checked = false;
            if (settings.checked)
                control._checked = true;


            control.createHtml = function() {
                var div = DOM.Div({ id:control._getSubId('') })
                    .addStyle('width',control._width+'px')
                    .addStyle('height',control._height+'px')
                    .addStyle('white-space', 'normal')
                    .addStyle('position', 'relative');
                div.addCssClass(control._buttonClass);

                var aligner = DOM.Div({parent: div})
                    .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                    .addStyle('height', '100%')
                    .addStyle('width', '1px');

                if (settings.icon && !settings.text) {
                    var iconSize = 17;
                    if (settings.iconSizeFraction)
                        iconSize = Math.round(iconSize * settings.iconSizeFraction);
                    div.addStyle('text-align','center')
                    var divIcon = DOM.Div({parent: div})
                        .addCssClass('fa').addCssClass(settings.icon).addCssClass('AXMButtonIcon')
                        .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                        .addStyle('font-size', iconSize + 'px');
                }

                if (!settings.icon && settings.text) {
                    //div.addStyle('text-align','center');
                    var divText = DOM.Div({parent: div})
                        .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                        .addStyle('padding-left','5px')
                        .addElem(settings.text);
                    if (control._width)
                        divText.addStyle('max-width', (control._width-12)+'px');
                }

                if (settings.icon && settings.text) {
                    var iconWidth = Math.round(control._height*0.75);
                    var iconSize = 17;
                    if (settings.iconSizeFraction)
                        iconSize = Math.round(iconSize * settings.iconSizeFraction);
                    if (settings.icon) {
                        var divIcon = DOM.Div({parent: div})
                            .addCssClass('fa').addCssClass(settings.icon).addCssClass('AXMButtonIcon')
                            .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                            .addStyle('font-size', iconSize + 'px')
                            .addStyle('width', iconWidth + 'px')
                            .addStyle('text-align','center');
                    }
                    if (settings.text) {
                        var divText = DOM.Div({parent: div})
                            .addStyle('display', 'inline-block').addStyle('line-height', '14px').addStyle('vertical-align', 'middle')
                            .addElem(settings.text)
                            .addStyle('width', (control._width-iconWidth-10)+'px');
                    }
                }

                if (settings.hint)
                    div.addAttribute('title', settings.hint);

                if (settings.helpId) {
                    var helpDiv = DOM.Div({parent: div})
                        .addStyle('position', 'absolute')
                        .addStyle('font-size', '18px')
                        .addStyle('top', '2px')
                        .addStyle('right', '2px')
                        .addCssClass('AXMButtonHelp');
                    helpDiv.addElem('<i class="fa fa-question-circle"></i>');
                }


                return div.toString();
            };

            control._updateEnabledState = function() {
                if (control._enabled)
                    control._getSub$El('').css('opacity', 1);
                else
                    control._getSub$El('').css('opacity', 0.4);
            };

            control.setEnabled = function(newStatus) {
                control._enabled = newStatus;
                control._updateEnabledState();
            };

            control._updateCheckedState = function() {
                if (control._checked)
                    control._getSub$El('').addClass('AXMButtonChecked');
                else
                    control._getSub$El('').removeClass('AXMButtonChecked');
            };

            control.setChecked = function(newStatus) {
                control._checked = newStatus;
                control._updateCheckedState();
            };

            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
                control._getSub$El('').find('.AXMButtonHelp').click(control._onHelp);
                control._updateEnabledState();
                control._updateCheckedState();
            };

            control._onClicked = function(ev) {
                if (!control._enabled)
                    return;
                control.performNotify();
                ev.stopPropagation();
                return false;
            };

            control._onHelp = function(ev) {
                require('AXM/Windows/DocViewer').create(settings.helpId);
                ev.stopPropagation();
                return false;
            };

            return control;
        };

        Module.EditTextItemButton = function() {
            var control = Module.Button({
                icon:'fa-pencil',
                buttonClass: 'AXMButtonCommandBar',
                width:25,
                height:20,
                iconSizeFraction: 0.75
            });
            return control;
        };

        Module.HelpButton = function(helpId) {
            var control = Module.Button({
                icon: 'fa-question-circle',
                buttonClass: 'AXMButtonHelp',
                width:24,
                height:18,
                iconSizeFraction: 1.1

            });
            control.addNotificationHandler(function() {
                require('AXM/Windows/DocViewer').create(helpId);
            });
            return control;
        };



        Module.Check = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 45;
            //control._buttonClass = settings.buttonClass || 'AXMCheck';
            control._value = false;

            control.createHtml = function() {

                var rootEl = DOM.Create("input", {id: control._getSubId('')});
                rootEl.addAttribute("type", 'checkbox');
                if (control._value)
                    rootEl.addAttribute('checked', "checked");

                var label = DOM.Label({ id: control._getSubId('label'), parent:rootEl, target: control._getSubId('') })
                    .addElem(settings.text);

                return rootEl.toString();
            };

            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
            };

            control._onClicked = function(ev) {
                control.isChecked = control._getSub$El('').is(':checked');
                control.performNotify();
            };

            control.getValue = function () {
                if (control._getSub$El('').length>0)
                    control.isChecked = control._getSub$El('').is(':checked');
                return control.isChecked;
            }


            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
                if (control._value)
                    control._getSub$El('').attr('checked', 'checked');
                else
                    control._getSub$El('').removeAttr('checked');
                if (!preventNotify)
                    control.performNotify();
                return true;
            };

            return control;
        };


        Module.DropList = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 45;
            control._states = [];
            control._value = settings.value || '';

            control.addState = function(id, name) {
                control._states.push({id:id, name:name, group:null});
                control._getSub$El('').html(control._buildSelectContent());
            };

            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
                control._getSub$El('').html(control._buildSelectContent());
                if (!preventNotify)
                    control.performNotify();
                return true;
            };

            control.getValue = function () {
                var item = control._getSub$El('').find(":selected");
                if (item.length>0)
                    control._value = item.attr('value');
                return control._value;
            }

            control.createHtml = function() {

                var wrapper = DOM.Div();
                wrapper.addStyle('display', 'inline-block');
                //wrapper.setCssClass('DQXSelectWrapper');

                var cmb = DOM.Create('select', { id: control._getSubId(''), parent: wrapper });
                if (control._width)
                    cmb.addStyle('width',control._width+'px');
                //if (this._hint)
                //    cmb.addHint(this._hint);
                cmb.addElem(control._buildSelectContent());
                //var label = DocEl.Label({ target: this.getFullID('Label') });
                //label.addElem(this.myLabel);
                //return label.toString() + ' ' + wrapper.toString();

                return wrapper.toString();
            };

            control._buildSelectContent = function() {
                var st = '';
                var lastGroupName = '';
                $.each(control._states, function(idx, state) {
                    var groupName = state.group || '';
                    if (groupName != lastGroupName) {
                        if (lastGroupName)
                            st += '</optgroup>';
                        lastGroupName = groupName;
                        if (groupName)
                            st += '<optgroup = label="{name}">'.DQXformat({name: groupName});
                    }
                    st += '<option value="{id}" {selected}>{name}</option>'.AXMInterpolate({
                        id: state.id,
                        name: state.name,
                        selected: (state.id == control._value) ? 'selected="selected"' : ''
                    });
                });

                if (lastGroupName)
                    st += '</optgroup>';
                return st;
            };

            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
            };

            control._onClicked = function(ev) {
                control.isChecked = control._getSub$El('').is(':checked');
                control.performNotify();
            };


            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
                if (control._value)
                    control._getSub$El('').attr('checked', 'checked');
                else
                    control._getSub$El('').removeAttr('checked');
                if (!preventNotify)
                    control.performNotify();
                return true;
            };

            return control;
        };


        Module.Edit = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 20;
            //control._buttonClass = settings.buttonClass || 'AXMEdit';
            control._value = settings.value || '';
            control._isPassWord = settings.passWord || false;
            control._disabled = settings.disabled || false;
            control._nonEmptyClass = settings.nonEmptyClass || null;

            if (settings.hasClearButton)
                control._clearButton = Module.Button({
                    icon: 'fa-times',
                    width : 25,
                    height: 19,
                    buttonClass : 'AXMButtonCommandBar',
                    iconSizeFraction: 0.9,
                    enabled: false
                }).addNotificationHandler(function() {
                    control.setValue('');
                    control._clearButton.setEnabled(false);
                });




            control.createHtml = function() {

                var rootEl = DOM.Create("input", {id: control._getSubId('')});
                rootEl.addCssClass('AXMEdit');

                if (settings.bold)
                    rootEl.addStyle('font-weight', 'bold');

                if (control._disabled)
                    rootEl.addAttribute('disabled', "disabled");

                if (control._width)
                    rootEl.addStyle('width',control._width+'px');
                if (control._height)
                    rootEl.addStyle('height',control._height+'px');
                if (!control._isPassWord)
                    rootEl.addAttribute("type", 'text');
                else
                    rootEl.addAttribute("type", 'password');
                //that.addAttribute("pattern", "[0-9]*");
                rootEl.addAttribute("value", control._value);
                if (settings.placeHolder)
                    rootEl.addAttribute("placeholder", settings.placeHolder);

                var str = rootEl.toString();
                if (control._clearButton)
                    str += control._clearButton.createHtml();
                return str;
            };

            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
                control._getSub$El('').bind("propertychange input paste", control._onModified);
                control._getSub$El('').bind("keyup", control._onModified);
                control._checkNonEmptyClass();
                if (control._hasDefaultFocus)
                    control._getSub$El('').select();
                if (control._clearButton)
                    control._clearButton.attachEventHandlers();
            };

            control._onModified = function(ev) {
                var txt = control.getValue();
                if (control._clearButton) {
                    control._clearButton.setEnabled(txt.length > 0);
                }
                control._checkNonEmptyClass();
                control.performNotify();
            };

            control._checkNonEmptyClass = function() {
                if (!control._nonEmptyClass)
                    return;
                var txt = control.getValue();
                if (txt.length>0)
                    control._getSub$El('').addClass(control._nonEmptyClass);
                else
                    control._getSub$El('').removeClass(control._nonEmptyClass);
            }


            control.getValue = function () {
                if (control._getSub$El('').length>0)
                    control._value = control._getSub$El('').val();
                return control._value;
            }


            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._getSub$El('').val(newVal);
                control._checkNonEmptyClass();
                if (control._clearButton) {
                    var txt = control.getValue();
                    control._clearButton.setEnabled(txt.length > 0);
                }
                if (!preventNotify)
                    control.performNotify();
            };

            return control;
        };


        return Module;
    });

