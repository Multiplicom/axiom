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
                    fnc(msg);
                });
            }

            return control;
        };

        Module.Static = function(settings) {
            var control = Module.SingleControlBase(settings);

            control.createHtml = function() {
                var div = DOM.Div({ id:control._getSubId('') })
                    .addStyle('display', 'inline-block').addStyle('vertical-align','middle');
                div.addElem(settings.text);
                return div.toString();
            };

            control.modifyText = function(newText) {
                $('#'+control._id).html(newText);
            };

            return control;
        };



        Module.Button = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 45;
            control._buttonClass = settings.buttonClass || 'AXMButton';


            control.createHtml = function() {
                var div = DOM.Div({ id:control._getSubId('') })
                    .addStyle('width',control._width+'px')
                    .addStyle('height',control._height+'px')
                    .addStyle('white-space', 'normal');
                div.addCssClass(control._buttonClass);

                var aligner = DOM.Div({parent: div})
                    .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                    .addStyle('height', '100%')
                    .addStyle('width', '1px');

                if (settings.icon && !settings.text) {
                    div.addStyle('text-align','center')
                    var divIcon = DOM.Div({parent: div})
                        .addCssClass('fa').addCssClass(settings.icon).addCssClass('AXMButtonIcon')
                        .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                        .addStyle('font-size', 17 + 'px');
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
                return div.toString();
            };

            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
            };

            control._onClicked = function(ev) {
                control.performNotify();
                ev.stopPropagation();
                return false;
            };

            return control;
        };



        Module.Check = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 45;
            control._buttonClass = settings.buttonClass || 'AXMCheck';
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




        Module.Edit = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            //control._height = settings.height || 45;
            control._buttonClass = settings.buttonClass || 'AXMEdit';
            control._value = settings.value || '';
            control._isPassWord = settings.passWord || false;


            control.createHtml = function() {

                var rootEl = DOM.Create("input", {id: control._getSubId('')});
                if (!control._isPassWord)
                    rootEl.addAttribute("type", 'text');
                else
                    rootEl.addAttribute("type", 'password');
                //that.addAttribute("pattern", "[0-9]*");
                rootEl.addAttribute("value", control._value);
                if (settings.placeHolder)
                    rootEl.addAttribute("placeholder", settings.placeHolder);

                return rootEl.toString();
            };

            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
                control._getSub$El('').bind("propertychange input paste", control._onModified);
                control._getSub$El('').bind("keyup", control._onModified);
                if (control._hasDefaultFocus)
                    control._getSub$El('').select();
            };

            control._onModified = function(ev) {
                control.performNotify();
            };

            control.getValue = function () {
                if (control._getSub$El('').length>0)
                    control._value = control._getSub$El('').val();
                return control._value;
            }


            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._getSub$El('').val(newVal);
            };

            return control;
        };


        return Module;
    });

