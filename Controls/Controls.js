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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Icon", "AXM/Color", "AXM/Controls/Compound", "he", "AXM/Controls/Control"
    ],
    function (
        require, $, _,
        AXMUtils, DOM, Icon, Color, Compound
    ) {
        var Control = require("AXM/Controls/Control");

        /**
         * Module encapsulating a set of classes that represent HTML controls
         * @type {{}}
         */
        var Module = {
            Compound: Compound
        };


        /**
         * Base class for a single control
         * @returns {Object}
         * @constructor
         * @deprecated Superceded by Control (ES5 constructor function) but kept for backwards compatibility.
         */
        Module.SingleControlBase = function() {
            return new Control();
        };

        function ToggleControl(props) {
            Control.call(this, props);

            this.props = props || {
                defaultState: false
            };
            this.value = !!this.props.defaultState; // Coerce to boolean

            this.defaultStyles = {
                width: "40px",
                height: "21px"
            };

            this.render = function createHTML() {
                return DOM.Div(
                    $.extend(this.handlers, {
                        id: this._getSubId("-control"),
                        className: "toggle-control",
                        style: {
                            display: "flex",
                            "align-items": "center",
                            cursor: "pointer"
                        }
                    }),
                    [
                        DOM.Input(
                            $.extend(this.value ? { checked: "checked" } : {}, {
                                id: this._getSubId(""),
                                type: "checkbox",
                                style: this.props.style
                                    ? $.extend(this.defaultStyles, this.props.style)
                                    : this.defaultStyles
                            })
                        ),
                        DOM.Label({ for: this._getSubId("") }, [this.props.text || ""])
                    ]
                );
            };
        };

        Object.defineProperties(ToggleControl.prototype, {
            value: {
                writable: true
            }
        });

        ToggleControl.prototype = Object.create(Control.prototype);

        Module.Toggle = ToggleControl;

        Module.Text = function(text, settings) {
            var control = Module.SingleControlBase(settings || {});
            control._text = text;
            control.textEl = DOM.Text(text || "");
            
            control.setReactOnClick = function() {
                control._reactOnClick = true;
                return control;
            };

            /**
             * Creates the html of the control
             * @returns {String}
             */
            control.render = function() {
                return DOM.Span({ id: control._getSubId("") }, [control.textEl]);
            };


            /**
             * Returns the jQuery element containing the control
             * @returns {jQuery}
             */
            control.get$El = function() {
                return $("#" + control._getSubId(''));
            };

            /**
             * Modifies the text of the control
             * @param {string} newText - new text content
             */
            control.modifyText = function(newText) {
                control._text = newText;
                var selectedEl = document.getElementById(control._id)
                selectedEl.textContent = newText;
            };

            /**
             * Modifies the css Class of the control
             * @param {string} newClass - new css class
             */
            control.modifyCssClass = function(newClass) {
                control._getSub$El('').removeClass(control._cssClass);
                control.setCssClass(newClass);
                control._getSub$El('').addClass(newClass);
            };

            /**
             * Modifies the tooltip of the control
             * @param {string} newText - new tooltip content
             */
            control.modifyTooltip = function(newText) {
                control._title = newText;
                control.get$El().prop('title', newText);
            };

            /**
             * Attaches html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                if (control._reactOnClick)
                    control._getSub$El('').click(control._onClicked);
            };

            /**
             * Detaches html event handlers
             */
            control.detachEventHandlers = function() {
                if (control && control._reactOnClick)
                    control._getSub$El('').unbind('click');
            };

            /**
             * Handles the on click event
             * @param ev
             * @returns {boolean}
             * @private
             */
            control._onClicked = function(ev) {
                control.performNotify();
                ev.stopPropagation();
                return false;
            };

            return control;
        };

        /**
         * Implements a static text control
         * @param {{}} settings - control settings
         * @param {string} settings.text - control text
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Static = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._text = settings.text || '';
            control._cssClass = settings.cssClass || '';
            control._reactOnClick = settings.reactOnClick || false;
            control._inLine = true;
            control._title = settings.title || '';
            if (settings.fullWidth)
                control._inLine = false;

            control.setCssClass = function(cssClass) {
                control._cssClass = cssClass;
                return control;
            };

            control.setReactOnClick = function() {
                control._reactOnClick = true;
                return control;
            };

            /**
             * Creates the html of the control
             * @returns {String}
             */
            control.render = function() {
                var div = DOM.Div({ id: control._getSubId("") });
                if (control._title) div.addAttribute("title", control._title);
                if (control._inLine) {
                    div.addStyle("display", "inline-block").addStyle(
                        "vertical-align",
                        "middle"
                    );
                }
                if (settings.maxWidth) {
                    div.addStyle("max-width", settings.maxWidth + "px")
                        .addStyle("overflow-x", "hidden")
                        .addStyle("text-overflow", "ellipsis");
                }

                if (control._cssClass) {
                    div.addCssClass(control._cssClass);
                }
                div.addElem(control._text);
                return div;
            };


            /**
             * Returns the jQuery element containing the control
             * @returns {jQuery}
             */
            control.get$El = function() {
                return $("#" + control._getSubId(''));
            };

            /**
             * Modifies the text of the control
             * @param {string} newText - new text content
             */
            control.modifyText = function(newText) {
                control._text = newText;
                $('#'+control._id).html(newText);
            };

            /**
             * Modifies the css Class of the control
             * @param {string} newClass - new css class
             */
            control.modifyCssClass = function(newClass) {
                control._getSub$El('').removeClass(control._cssClass);
                control.setCssClass(newClass);
                control._getSub$El('').addClass(newClass);
            };

            /**
             * Modifies the tooltip of the control
             * @param {string} newText - new tooltip content
             */
            control.modifyTooltip = function(newText) {
                control._title = newText;
                control.get$El().prop('title', newText);
            };

            /**
             * Attaches html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                if (control._reactOnClick)
                    control._getSub$El('').click(control._onClicked);
            };

            /**
             * Detaches html event handlers
             */
            control.detachEventHandlers = function() {
                if (control && control._reactOnClick)
                    control._getSub$El('').unbind('click');
            };

            /**
             * Handles the on click event
             * @param ev
             * @returns {boolean}
             * @private
             */
            control._onClicked = function(ev) {
                control.performNotify();
                ev.stopPropagation();
                return false;
            };


            return control;
        };





        /**
         * Implements a control representing HTML content
         * @param {string} content - html content
         * @returns {Object} - control instance
         * @constructor
         */
        Module.RawHtml = function(content) {
            var control = Module.SingleControlBase({});

            control.render = function() {
                return content;
            };


            return control;
        };


        /**
         * Implements a button control. clicking the button invokes a notification
         * @param {{}} settings - control settings
         * @param {int} settings.width - (optional) button width
         * @param {int} settings.height - (optional) button height
         * @param {string} settings.buttonClass - (optional) css class of the button
         * @param {boolean} settings.enabled - (optional) initial enabled state of the control
         * @param {AXM.Icon|string} settings.icon - (optional) icon displayed in the button
         * @param {float} settings.iconSizeFraction - (optional) icon magnification factor
         * @param {string} settings.text - (optional) button text
         * @param {string} settings.hint - (optional) button hover hint
         * @param {string} settings.helpId - (optional) document Id of a help text associated with the control. displayed as a little help icon on top of the button
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Button = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 110;
            control._height = settings.height || 50;
            control._buttonClass = settings.buttonClass || 'AXMButton';
            control._extraClasses = [];
            control._enabled = true;
            if (settings.enabled === false)
                control._enabled = false;
            control._checked = false;
            if (settings.checked)
                control._checked = true;

            control._icon = null;//default: no icon
            if (settings.icon) {
                if (AXMUtils.isObjectType(settings.icon, "icon"))
                    control._icon = settings.icon.clone();
                else {
                    control._icon = Icon.createFA(settings.icon);
                }
                var sizeFactor = 1.0;
                if (settings.iconSizeFraction)
                    sizeFactor *= settings.iconSizeFraction;
                control._icon.changeSize(sizeFactor);
            }


            /**
             * Adds a css class to the button html
             * @param {string} className - css class
             * @returns {Object} - self
             */
            control.addClass = function(className) {
                control._extraClasses.push(className);
                return control;
            };


            /**
             * Creates the control html
             * @returns {String}
             */
            control.render = function() {
                var div = DOM.Div({ id:control._getSubId('') })
                    .addStyle('width',control._width+'px')
                    .addStyle('height',control._height+'px')
                    .addStyle('white-space', 'normal')
                    .addStyle('position', 'relative');
                div.addCssClass(control._buttonClass);
                $.each(control._extraClasses, function(idx, className) {
                    div.addCssClass(className);
                });

                var aligner = DOM.Div({parent: div})
                    .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                    .addStyle('height', '100%')
                    .addStyle('width', '1px');

                if (control._icon && !settings.text) {
                    var iconSize = control._icon.getSize();
                    div.addStyle('text-align','center');
                    var divIcon = DOM.Div({parent: div})
                        .addCssClass('AXMButtonIcon')
                        .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle');
                    divIcon.addElem(control._icon.render());
                }

                if (!control._icon && settings.text) {
                    //div.addStyle('text-align','center');
                    var divText = DOM.Div({parent: div})
                        .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                        .addStyle('padding-left','5px')
                        .addElem(settings.text);
                    if (control._width)
                        divText.addStyle('max-width', (control._width-12)+'px');
                }

                if (control._icon && settings.text) {
                    var iconWidth = Math.round(control._height*0.75);
                    var iconSize = control._icon.getSize();
                    if (control._icon) {
                        var divIcon = DOM.Div({parent: div})
                            .addCssClass('AXMButtonIcon')
                            .addStyle('display', 'inline-block').addStyle('line-height', 'inherit').addStyle('vertical-align', 'middle')
                            .addStyle('width', iconWidth + 'px')
                            .addStyle('text-align','center');
                        divIcon.addElem(control._icon.render());
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

                return div;
            };


            /**
             * Updates the html for a change in enabled state
             * @private
             */
            control._updateEnabledState = function() {
                if (control._enabled)
                    control._getSub$El('').css('opacity', 1);
                else
                    control._getSub$El('').css('opacity', 0.4);
            };


            /**
             * Modifies the enabled state of the button
             * @param {boolean} newStatus - new enabled status
             */
            control.setEnabled = function(newStatus) {
                control._enabled = newStatus;
                control._updateEnabledState();
            };


            /**
             * Updates the html for a change in checked state
             * @private
             */
            control._updateCheckedState = function() {
                if (control._checked)
                    control._getSub$El('').addClass('AXMButtonChecked');
                else
                    control._getSub$El('').removeClass('AXMButtonChecked');
            };


            /**
             * Modifies the checked state of the button
             * @param {boolean} newStatus - new checked state
             */
            control.setChecked = function(newStatus) {
                control._checked = newStatus;
                control._updateCheckedState();
            };


            /**
             * Attaches html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
                control._getSub$El('').find('.AXMButtonHelp').click(control._onHelp);
                control._updateEnabledState();
                control._updateCheckedState();
            };

            /**
             * Detaches html event handlers
             */
            control.detachEventHandlers = function() {
                if(control){
                    control._getSub$El('').unbind('click');
                    control._getSub$El('').find('.AXMButtonHelp').unbind('click');
                }
            };

            /**
             * Handles the on click event
             * @param ev
             * @returns {boolean}
             * @private
             */
            control._onClicked = function(ev) {
                if (!control._enabled)
                    return;
                control.performNotify();
                ev.stopPropagation();
                return false;
            };


            /**
             * Handles the on click event for the optional help button
             * @param ev
             * @returns {boolean}
             * @private
             */
            control._onHelp = function(ev) {
                require('AXM/Windows/DocViewer').create(settings.helpId);
                ev.stopPropagation();
                return false;
            };

            return control;
        };


        /**
         * Creates a standard template button displaying an 'open' action
         * @returns {Object} - control instance
         * @constructor
         */
        Module.OpenButton = function() {
            var control = Module.Button({
                icon:'fa-external-link-square',
                buttonClass: 'AXMButtonInline',
                width:25,
                height:20,
                iconSizeFraction: 0.9
            });
            return control;
        };


        /**
         * Creates a standard template button displaying an 'edit' action
         * @returns {Object} - control instance
         * @constructor
         */
        Module.EditTextItemButton = function() {
            var control = Module.Button({
                icon:'fa-pencil',
                buttonClass: 'AXMButtonInline',
                width:25,
                height:16,
                iconSizeFraction: 0.75
            });
            return control;
        };


        /**
         * Creates a standard template button
         * @param {string} helpId - doc id of the help text
         * @returns {Object} - control instance
         * @constructor
         */
        Module.HelpButton = function(helpId) {
            var control = Module.Button({
                icon: 'fa-question-circle',
                buttonClass: 'AXMButtonHelp',
                width:26,
                height:20,
                iconSizeFraction: 1.05

            });
            control.addNotificationHandler(function() {
                require('AXM/Windows/DocViewer').create(helpId);
            });
            return control;
        };


        /**
         * Implements a hyperlink control. clicking on the link invokes a notification
         * @param {{}} settings - control settings
         * @param {string} settings.text - hyperlink text
         * @param {string} settings.class - (optional) hyperlink css class
         * @returns {Object} - control instance
         * @constructor
         */
        Module.HyperLink = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._class = settings.class || 'AXMHyperLinkButton';
            control._extraClasses = [];


            /**
             * Adds a css class to the hyperlink
             * @param {string} className
             * @returns {Object} - self
             */
            control.addClass = function(className) {
                control._extraClasses.push(className);
                return control;
            };


            /**
             * Creates the control html
             * @returns {string} - html
             */
            control.render = function() {
                var div = DOM.Create('div', { id:control._getSubId('') });
                div.addCssClass(control._class);
                $.each(control._extraClasses, function(idx, className) {
                    div.addCssClass(className);
                });

                div.addElem(settings.text);

                return div;
            };


            /**
             * Attached the html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
            };

            /**
             * Detach the html event handlers
             */
            control.detachEventHandlers = function() {
                if(control){
                    control._getSub$El('').unbind('click');
                }
            };

            /**
             * Handles the on click event
             * @param ev
             * @returns {boolean}
             * @private
             */
            control._onClicked = function(ev) {
                control.performNotify();
                ev.stopPropagation();
                return false;
            };

            return control;
        };


        /**
         * Implements a check box control. changing the checked state invokes a notification
         * @param {{}} settings - control settings
         * @param {boolean} settings.enabled - (optional) initial enabled state
         * @param {boolean} settings.checked - (optional) initial checked state
         * @param {string} settings.checkedClass - (optional) css class of the checked state
         * @param {string} settings.text - text of the control
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Check = function(settings, children) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 45;
            control._enabled = settings.enabled === false ? false : true;
            control._value = settings.checked || false;
            control._checkedClass = settings.checkedClass || null;

            children = children ? children : [];

            control.render = function() {
                return DOM.Div({}, [
                    DOM.Input(
                        $.extend(
                            {
                                type: "checkbox",
                                id: control._getSubId("")
                            },
                            control._value ? { checked: "" } : {}
                        )
                    ),
                    DOM.Label(
                        {
                            id: control._getSubId("label"),
                            for: control._getSubId("")
                        },
                        []
                            .concat(settings.text ? [DOM.Text(settings.text)] : [])
                            .concat(children)
                    )
                ]);
            };

            /**
             * Attaches the html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                control._getSub$El("").click(control._onClicked);
                control._checkCheckedClass();
                control._updateEnabledState();
            };

            /**
             * Detach the html event handlers
             */
            control.detachEventHandlers = function() {
                if (control) {
                    control._getSub$El("").unbind("click");
                }
            };

            /**
             * Handles the on click event
             * @param ev
             * @private
             */
            control._onClicked = function(ev) {
                control._value = control._getSub$El("").is(":checked");
                control._checkCheckedClass();
                control.performNotify();
            };

            /**
             * Updates the html reflecting the enabled state
             * @private
             */
            control._updateEnabledState = function() {
                if (control._enabled) {
                    control._getSub$El("").prop("disabled", false);
                    control._getSub$El("label").removeClass("AXMDisabledText");
                } else {
                    control._getSub$El("").prop("disabled", true);
                    control._getSub$El("label").addClass("AXMDisabledText");
                }
            };

            /**
             * Modifies the enabled state of the control
             * @param {boolean} newStatus - new state
             */
            control.setEnabled = function(newStatus) {
                control._enabled = newStatus;
                control._updateEnabledState();
            };

            /**
             * Returns the current checked state of the control
             * @returns {boolean}
             */
            control.getValue = function() {
                if (control._getSub$El("").length > 0) control._value = control._getSub$El("").is(":checked");
                return control._value;
            };

            /**
             * Modifies the checked state of the control
             * @param {boolean} newVal - new checked state
             * @param {boolean} preventNotify - if true, no notification will be invoked for this change
             */
            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
                if (control._value) control._getSub$El("").prop("checked", "checked");
                else control._getSub$El("").prop("checked", "");
                if (!preventNotify) control.performNotify();
                control._checkCheckedClass();
                return true;
            };

            /**
             * Modifies the css checked class
             * @private
             */
            control._checkCheckedClass = function() {
                if (!control._checkedClass) return;
                if (control.getValue()) control._getSub$El("label").addClass(control._checkedClass);
                else control._getSub$El("label").removeClass(control._checkedClass);
            };

            return control;
        };


        /**
         * Implements a drop-down list control. changing the selected state invokes a notification
         * @param {{}} settings - control settings
         * @param {int} settings.width - width of the box
         * @param {int} settings.height - height of the box
         * @param {int} settings.value - initial state id
         * @param {boolean} settings.disabled - if true, the control is disabled
         * @returns {Object} - control instance
         * @constructor
         */
        Module.DropList = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 45;
            control._states = [];
            control._value = settings.value || '';
            control._disabled = settings.disabled || false;
            control._title = settings.title || '';


            /**
             * Removes all the states from the list
             */
            control.clearStates = function() {
                control._states = [];
                control._getSub$El('').html(control._buildSelectContent());
            };


            /**
             * Add a new state to the list
             * @param {string} id - state id
             * @param {string} name - state display name
             * @param {string} group - (optional) group name the state should belong to
             * @param {boolean} disabled - (optional) set this state to be a placeholder
             */
            control.addState = function(id, name, group, disabled = false) {
                if (!group) group = '';
                control._states.push({id:id, name:name, group:group, disabled: disabled});
                control._getSub$El('').html(control._buildSelectContent());
            };


            /**
             * Returns the current active state
             * @returns {boolean}
             */
            control.getValue = function () {
                var item = control._getSub$El('').find(":selected");
                if (item.length>0)
                    control._value = item.attr('value');
                return control._value;
            };


            /**
             * Returns the html implementing this control
             * @returns {string}
             */
            control.render = function() {
                var wrapper = DOM.Div();
                wrapper.addStyle('display', 'inline-block');
                if(control._title)
                    wrapper.addAttribute('title', control._title);
                var cmb = DOM.Create('select', { id: control._getSubId(''), parent: wrapper });
                if (control._width)
                    cmb.addStyle('width',control._width+'px');
                if (control._disabled)
                    cmb.addAttribute('disabled', "disabled");
                cmb.addElem(control._buildSelectContent());
                return wrapper;
            };


            /**
             * Helper function building the content of the select control
             * @returns {string}
             * @private
             */
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
                            st += `<optgroup label="${groupName}">`;
                    }
                    st += `<option value="${state.id}" ${(state.id == control._value) ? 'selected="selected"' : ''} ${!!state.disabled ? 'disabled' : ''}>${state.name}</option>`;
                });
                if (lastGroupName)
                    st += '</optgroup>';
                return st;
            };


            /**
             * Attached the html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                var target = 'change.controlevent';
                control._getSub$El('').unbind(target).bind(target, control._onChange);
                //control._getSub$El('').click(control._onClicked);
                if (control._hasDefaultFocus)
                    control._getSub$El('').focus();
            };

            /**
             * Detach the html event handlers
             */
            control.detachEventHandlers = function() {
                if(control){
                    var target = 'change.controlevent';
                    control._getSub$El('').unbind(target);
                }
            };

            /**
             * Html handler implementing the state change event
             * @private
             */
            control._onChange = function(ev) {
                var oldVal = control._value;
                var newVal = control.getValue();
                if (newVal != oldVal)
                    control.performNotify();
            };


            /**
             * Sets a new active state
             * @param {string} newVal - new state id
             * @param {boolean} preventNotify - if true, no notification is issued about the state change
             */
            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
                control._getSub$El('').html(control._buildSelectContent());
                if (!preventNotify)
                    control.performNotify();
                return true;
            };

            /**
             * Modifies the enabled state of the droplist
             * @param {boolean} newStatus - new enabled status
             */
            control.setEnabled = function(newStatus) {
                control._disabled = !newStatus;
                control._getSub$El('').prop("disabled", control._disabled);
            };

            return control;
        };


        /**
         * Implements a radiobutton group control. changing the selected radiobutton invokes a notification
         * @param {{}} settings - control settings
         * @param {int} settings.width - width of the group
         * @param {int} settings.height - height of the group
         * @param {int} settings.value - initial state id
         * @param {boolean} settings.disabled - if true, the control is disabled
         * @returns {Object} - control instance
         * @constructor
         */
        Module.RadioGroup = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || null;
            control._height = settings.height || 45;
            control._states = [];
            control._value = settings.value || '';
            control._disabled = settings.disabled || false;


            /**
             * Removes all the states from the list
             */
            control.clearStates = function() {
                control._states = [];
                control._getSub$El('').html(control._buildButtonContent());
            };


            /**
             * Add a new state to the list
             * @param {string} id - state id
             * @param {string} name - state display name
             * @param {string} group - (optional) group name the state should belong to
             */
            control.addState = function(id, name, group) {
                if (!group) group = '';
                control._states.push({id:id, name:name, group:group});
                control._getSub$El('').html(control._buildButtonContent());
            };


            /**
             * Returns the current active state
             * @returns {boolean}
             */
            control.getValue = function () {
                var item = control._getSub$El('').find(":checked");
                if (item.length>0)
                    control._value = item.attr('value');
                return control._value;
            };


            /**
             * Returns the html implementing this control
             * @returns {string}
             */
            control.render = function() {
                var wrapper = DOM.Div();
                wrapper.addStyle('display', 'inline-block');
                var div = DOM.Create('div', { id: control._getSubId(''), parent: wrapper });
                if (control._width)
                    div.addStyle('width',control._width+'px');

                div.addElem(control._buildButtonContent());
                return wrapper;
            };


            /**
             * Helper function building the content of the radiogroup control
             * @returns {string}
             * @private
             */
            control._buildButtonContent = function() {
                var st = '';
                var lastGroupName = '';
                $.each(control._states, function(idx, state) {
                    //var groupName = state.group || ''; //todo: what whith groups?
                    //if (groupName != lastGroupName) {
                    //    if (lastGroupName)
                    //        st += '</radiogroup>';
                    //    lastGroupName = groupName;
                    //    if (groupName)
                    //        st += '<radiogroup = label="{name}">'.AXMInterpolate({name: groupName});
                    //}

                    var item_id = control._getSubId('_id_' + state.id);
                    st += `<div class="RadioButtonItem"><input type="radio" id="${item_id}" name="${control._getSubId('')}" value="${state.id}" ${(state.id == control._value) ? 'checked="checked"' : ''}></input><label for="${item_id}">${state.name}</label></div>`;
                });
                //if (lastGroupName)
                //    st += '</radiogroup>';
                return st;
            };


            /**
             * Attached the html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                var target = 'change.controlevent';
                control._getSub$El('').unbind(target).bind(target, control._onChange);
                //control._getSub$El('').click(control._onClicked);
            };

            /**
             * Detach the html event handlers
             */
            control.detachEventHandlers = function() {
                if(control){
                    var target = 'change.controlevent';
                    control._getSub$El('').unbind(target);
                }
            };

            /**
             * Html handler implementing the state change event
             * @private
             */
            control._onChange = function(ev) {
                var oldVal = control._value;
                var newVal = control.getValue();
                if (newVal != oldVal)
                    control.performNotify();
            };


            /**
             * Sets a new active state
             * @param {string} newVal - new state id
             * @param {boolean} preventNotify - if true, no notification is issued about the state change
             */
            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
                control._getSub$El('').html(control._buildButtonContent());
                if (!preventNotify)
                    control.performNotify();
                return true;
            };

            return control;
        };


        /**
         * Implements a text edit control. a notification is sent each time the content of the edit box changes
         * @param {{}} settings - control settings
         * @param {int} settings.width - width of the edit box
         * @param {int} settings.height - height of the edit box
         * @param {string} settings.value - initial content of the edit box
         * @param {object} settings.choices - autocomplete choices (optional, keys: label, value)
         * @param {boolean} settings.passWord - if true, a password control is created
         * @param {boolean} settings.disabled - if true, the edit control is disabled
         * @param {boolean} settings.bold - if true, text in the control appears in bold
         * @param {boolean} settings.hasClearButton - if true, the control also has a button that clears the content when the user clicks it
         * @param {string} settings.nonEmptyClass - (optional) a css style class automatically attached to the box if the content is not empty
         * @param {string} settings.placeHolder - (optional) a text that appears as a place holder in the box if the content is empty
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Edit = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 20;
            control._value = settings.value || '';
            control._isPassWord = settings.passWord || false;
            control._disabled = settings.disabled || false;
            control._nonEmptyClass = settings.nonEmptyClass || null;
            control._choices = null;

            if (settings.hasClearButton)
                control._clearButton = Module.Button({
                    icon: 'fa-times',
                    width : 20,
                    height: 19,
                    buttonClass : 'AXMButtonCommandBar',
                    iconSizeFraction: 0.9,
                    enabled: false
                }).addNotificationHandler(function() {
                    control.setValue('');
                    control._clearButton.setEnabled(false);
                });


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            control.render = function() {
                var he = require("he");

                var elementId = control._getSubId("");
                
                var parentEl = DOM.Div();
                var inputEl = DOM.Create("input", { parent: parentEl, id: elementId });

                inputEl.addCssClass("AXMEdit");

                if (settings.bold) {
                    inputEl.addStyle("font-weight", "bold");
                }

                if (control._disabled) {
                    inputEl.addAttribute("disabled", "disabled");
                }

                if (control._width) {
                    inputEl.addStyle("width", control._width + "px");
                }
                
                if (control._height) {
                    inputEl.addStyle("height", control._height + "px");
                }

                if (!control._isPassWord) {
                    inputEl.addAttribute("type", "text");
                } else {
                    inputEl.addAttribute("type", "password");
                }

                inputEl.addAttribute("value", he.decode("" +control._value));
                if (settings.placeHolder) {
                    inputEl.addAttribute("placeholder", settings.placeHolder);
                }

                if (control._clearButton) {
                    parentEl.addElem(control._clearButton.render());
                    return parentEl
                }

                return inputEl;
            };


            /**
             * Sets whether the control input is valid.
             * @param valid: boolean indicating whether the control input is valid.
             */
            control.setValid = function(valid) {
                control._valid = valid;
                var $el = $("#" + control._getSubId(''));
                if (valid)
                    $el.removeClass('invalid');
                else
                    $el.addClass('invalid');
            };


            /**
             * Attaches the html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                control._getSub$El('').click(control._onClicked);
                control._getSub$El('').bind("propertychange input paste", control._onModified);
                control._getSub$El('').bind("keyup", control._onModified);
                control._checkNonEmptyClass();
                if (control._clearButton)
                    control._clearButton.attachEventHandlers();
                if (settings.choices){
                    require("awesomplete/awesomplete.css")
                    const Awesomplete = require("awesomplete");
                    
                    var input = document.getElementById(control._id);
                    control._choices = new Awesomplete(input, {
	                      list: settings.choices
                    });
                }
                if (control._hasDefaultFocus){
                    control._getSub$El('').focus();
                    control._getSub$El('').select();
                }

            };

            control.modifyChoices = function (choicesList) {
                if(!control._choices)
                    AXMUtils.reportBug('Do not call if there are no options');
                control._choices.list = choicesList;
                // control._choices.evaluate();
            };

            /**
             * Detach the html event handlers
             */
            control.detachEventHandlers = function() {
                if(control){
                    control._getSub$El('').unbind('click');
                    control._getSub$El('').unbind("propertychange input paste");
                    control._getSub$El('').unbind("keyup");
                    if (control._clearButton)
                        control._clearButton.detachEventHandlers();
                }
            };

            /**
             * Handles the html on modified event
             * @param ev
             * @private
             */
            control._onModified = function(ev) {
                var txt = control.getValue();
                if (control._clearButton) {
                    control._clearButton.setEnabled(txt.length > 0);
                }
                control._checkNonEmptyClass();
                control.performNotify();
            };


            /**
             * Updates the empty box css class
             * @private
             */
            control._checkNonEmptyClass = function() {
                if (!control._nonEmptyClass)
                    return;
                var txt = control.getValue();
                if (txt.length>0)
                    control._getSub$El('').addClass(control._nonEmptyClass);
                else
                    control._getSub$El('').removeClass(control._nonEmptyClass);
            };


            /**
             * Sets the focus to the edit box
             */
            control.setFocus = function() {
                control._getSub$El('').select();
            };


            /**
             * Returns the current content of the edit box
             * @returns {string}
             */
            control.getValue = function () {
                if (control._getSub$El('').length>0)
                    control._value = control._getSub$El('').val();
                return control._value;
            };


            /**
             * Modifies the current content of the edit box
             * @param {string} newVal - new content
             * @param {boolean} preventNotify - if true, no notification is issued about the content change
             */
            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
                control._getSub$El('').val(newVal);
                control._checkNonEmptyClass();
                if (control._clearButton) {
                    var txt = control.getValue();
                    control._clearButton.setEnabled(txt.length > 0);
                }
                if (!preventNotify)
                    control.performNotify();
            };

            /**
             * Modifies the enabled state of the edit control
             * @param {boolean} newStatus - new enabled status
             */
            control.setEnabled = function(newStatus) {
                control._disabled = !newStatus;
                control._getSub$El('').prop("disabled", control._disabled);
            };

            return control;
        };


        /**
         * Implements a multi-line text box control
         * @param {{}} settings - control settings
         * @param {int} settings.width - width of the edit box
         * @param {int} settings.lineCount - number of lines of the text box
         * @param {boolean} settings.fixedfont - if true, a fixed space font is used
         * @param {boolean} settings.noWrap - if true, text is not automatically wrapped over multiple lines
         * @param {boolean} settings.noResize - if true, text box cannot be resized
         * @param {string} settings.value - initial content of the control
         * @returns {Object} - control instance
         * @constructor
         */
        Module.TextArea = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._lineCount = settings.lineCount || 2;
            control._value = settings.value || '';
            control._fixedfont = settings.fixedfont || false;
            control._noWrap = settings._noWrap || false;
            if (settings.noWrap)
                control._noWrap = true;
            control._noResize = settings.noResize || false;


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            control.render = function() {
                var controlEl = DOM.Div();
                var textAreaEl = DOM.Create("textarea", {
                    parent: controlEl,
                    id: control._getSubId("")
                });
                textAreaEl.addCssClass("AXMEdit");

                textAreaEl.addAttribute("rows", control._lineCount);

                if (control._disabled) textAreaEl.addAttribute("disabled", "disabled");

                if (control._width) textAreaEl.addStyle("width", control._width + "px");

                textAreaEl.addElem(control._value);

                textAreaEl.addAttribute("autocorrect", "off");
                textAreaEl.addAttribute("autocapitalize", "off");
                textAreaEl.addAttribute("autocomplete", "off");
                if (control._noResize) textAreaEl.addAttribute("resize", "none");
                if (control._noWrap) {
                    textAreaEl.addStyle("overflow-x", "scroll");
                    textAreaEl.addStyle("white-space", "pre");
                    textAreaEl.addAttribute("wrap", "off");
                }
                if (control._fixedfont) {
                    textAreaEl.addStyle("font-family", "Courier");
                } else {
                    textAreaEl.addStyle(
                        "font-family",
                        "Verdana, Arial, Helvetica, sans-serif"
                    );
                }

                if (control._clearButton) {
                    controlEl.addElem(control._clearButton.render());
                    return controlEl;
                }

                return textAreaEl;
            };


            /**
             * Attaches the html event handlers after DOM insertion
             */
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

            /**
             * Detaches the html event handlers
             */
            control.detachEventHandlers = function() {
                if(control){
                    control._getSub$El('').unbind('click');
                    control._getSub$El('').unbind("propertychange input paste");
                    control._getSub$El('').unbind("keyup");
                    if (control._clearButton)
                        control._clearButton.detachEventHandlers();
                }
            };


            /**
             * Handler the html on modified event
             * @param ev
             * @private
             */
            control._onModified = function(ev) {
                var txt = control.getValue();
                if (control._clearButton) {
                    control._clearButton.setEnabled(txt.length > 0);
                }
                control._checkNonEmptyClass();
                control.performNotify();
            };


            /**
             * Currently not implemented
             * @private
             */
            control._checkNonEmptyClass = function() {
            };


            /**
             * Sets the focus to this control
             */
            control.setFocus = function() {
                control._getSub$El('').select();
            };


            /**
             * Returns the current content of the edit box
             * @returns {string}
             */
            control.getValue = function () {
                if (control._getSub$El('').length>0)
                    control._value = control._getSub$El('').val();
                return control._value;
            };


            /**
             * Modifies the content of the edit box
             * @param {string} newVal - new content
             * @param {boolean} preventNotify - if true, no change notification is sent
             */
            control.setValue = function(newVal, preventNotify) {
                if (newVal == control.getValue()) return false;
                control._value = newVal;
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




        /**
         * Implements a multi-line code edit box control
         * @param {{}} settings - control settings
         * @param {int} settings.width - width of the edit box
         * @param {int} settings.height - height text box
         * @param {int} settings.type - code type. Currently only yaml is supported, but easily extensible
         * @param {string} settings.value - initial content of the control
         * @returns {Object} - control instance
         * @constructor
         */
        Module.CodeEditor = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 120;
            control._height = settings.height || 100;
            control._value = settings.value || '';
            control._tab_size = 2;
            if (settings.type != "yaml")
                throw Exception("Invalid code type");


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            control.render = function() {
                return (
                    <textarea
                        id={control._getSubId('')}
                        spellcheck={false}
                        autofocus={true}
                        className="CodeEditor"
                        style={{
                            minWidth: `${control._width + 5}px`,
                            minHeight: `${control._height + 5}px`
                        }}
                    ></textarea>
                );
            };


            /**
             * Converts tab to 2 whitespace character
             * @param {Object} ta - DOM textarea instance
             * @returns {boolean}
             */
            var _tab_press_handler = function (ta){
                var org_start = ta.selectionStart; // save for reference
                ta.value = ta.value.substring(0, ta.selectionStart)
                    + ' '.repeat(control._tab_size)
                    + ta.value.substring(ta.selectionEnd);
                ta.selectionStart = ta.selectionEnd = org_start + 2; // put caret at right position again
                return true; // prevent default
            };


            /**
             * Backspace delete 2 whitespace characters if possible
             * @param {Object} ta - DOM textarea instance
             * @returns {boolean}
             */
            var _backspace_press_handler = function (ta){
                if (ta.selectionStart !== ta.selectionEnd)
                    return false; // default to backspace
                if(ta.selectionStart === 0) // special case
                    return false; // default to backspace

                var org_start = ta.selectionStart;
                var newline_index = ta.value.lastIndexOf('\n', org_start-1);

                var after_newline = newline_index === -1 ? 0 : newline_index + 1;
                var to_delete = ta.value.substring(after_newline, org_start);

                if( to_delete.trim() || to_delete === '' )
                    return false; // characters on the left or it's an empty string => revert to default backspace

                var space_length =  to_delete.length - (to_delete.length%control._tab_size || control._tab_size);
                var spaces = ' '.repeat(space_length);
                ta.value = ta.value.substring(0, after_newline) + spaces + ta.value.substring(org_start);
                ta.selectionStart = ta.selectionEnd = after_newline + space_length; // put caret at right position again
                return true; // prevent default
            };


            var _keypress_handler = {
                9: _tab_press_handler,
                'Tab': _tab_press_handler,
                8: _backspace_press_handler,
                'Backspace': _backspace_press_handler
            };

            /**
             * Attaches the html event handlers after DOM insertion
             */
            control.attachEventHandlers = function() {
                control.editor = control._getSub$El('')[0];
                control.editor.value = control._value; // set default value

                // register keypress handlers
                $(control.editor).keydown(function(e) {
                    var handler =  _keypress_handler[e.key || e.keyCode];
                    handler && handler(this) && e.preventDefault();  // this = textarea
                });
            };

            /**
             * Returns the current content of the edit box
             * @returns {string}
             */
            control.getValue = function () {
                if (control.editor)
                    control._value = control.editor.value;
                return control._value;
            };


            return control;
        };



        /**
         * Implements a file drag & drop area
         * @param {{}} settings - control settings
         * @param {int} settings.width - width of the drop area
         * @param {int} settings.height - height of the drop area
         * @param {string} settings.text - text displayed in the drop area
         * @param {string} settings.cssClass - cssClass used for the main control
         * @param {string} settings.dragOverClass - cssClass used when dragging files over the control
         * @returns {Object} - returns the control instance
         * @constructor
         */
        Module.FileDrop = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 160;
            control._height = settings.height || 60;
            control._text = settings.text || 'Drop file(s)';
            control._class = settings.cssClass || 'AXMFileDrop';
            control._dragOverClass = settings.dragOverClass || 'AXMFileDropDragOver';
            control._files = null;


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            control.render = function() {
                var div = DOM.Div({ id:control._getSubId('') })
                    .addStyle('width',control._width+'px')
                    .addStyle('height',control._height+'px')
                    .addStyle('white-space', 'normal')
                    .addStyle('position', 'relative');
                div.addCssClass(control._class);
                var txtDiv = DOM.Div({parent: div});
                txtDiv.addElem(control._text);
                return div;
            };


            /**
             * Handles the drag over html event
             */
            control.onDragOver = function() {
                control._getSub$El('').addClass(control._dragOverClass);
            };


            /**
             * Handles the drag leave html event
             */
            control.onDragLeave = function() {
                control._getSub$El('').removeClass(control._dragOverClass);
            };


            /**
             * Handles the drop html event
             * @param ev
             */
            control.onDrop = function(ev) {
                control._getSub$El('').removeClass(control._dragOverClass);
                control._files = ev.originalEvent.dataTransfer.files;
                control.performNotify();
            };


            /**
             * Attaches the html events after DOM insertion
             */
            control.attachEventHandlers = function() {
                control._getSub$El('')
                    .on("dragover", control.onDragOver)
                    .on("dragleave", control.onDragLeave)
                    .on("drop", control.onDrop);
            };

            /**
             * Detaches the html events
             */
            control.detachEventHandlers = function() {
                if(control){
                    control._getSub$El('')
                        .off("dragover")
                        .off("dragleave")
                        .off("drop");
                }
            };

            /**
             * Returns the set of files currently dropped in the area
             * @returns {FileList}
             */
            control.getValue = function () {
                return control._files;
            };

            return control;
        };


        /**
         * Implements a value slider control
         * @param {{}} settings - control settings
         * @param {int} settings.width - width of the slider
         * @param {float} settings.minValue - minimum value of the slider value
         * @param {float} settings.maxValue - maximum value of the slider value
         * @param {float} settings.steps - increment of the slider value
         * @param {float} settings.value - initial slider value
         * @param {string} settings.text - displayed text
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Slider = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._width = settings.width || 160;
            control._minValue = settings.minValue || 0;
            control._maxValue = settings.maxValue || 1000;
            control._step = settings.step || 1;
            control._value = settings.value || 0;
            control._text = settings.text || '';

            control._value = Math.round(control._value/control._step)*control._step;


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            control.render = function() {

                var div = DOM.Div({ id:control._getSubId('') })
                    .addStyle('width',control._width+'px')
                    .addStyle('height',control._height+'px')
                    //.addStyle('line-height',control._height+'px')
                    .addStyle('white-space', 'normal')
                    .addStyle('position', 'relative');

                DOM.Create('Span', {parent:div}).addElem(control._text);
                DOM.Create('Span', {id: control._getSubId('value'), parent:div})
                    .addStyle('float', 'right');

                var slider = DOM.Create("input", {id: control._getSubId('slider'), parent: div});
                slider.addAttribute('type', 'range')
                    .addAttribute('min', control._minValue)
                    .addAttribute('max', control._maxValue)
                    .addAttribute('step', control._step)
                    .addAttribute('value', control._value)
                    .addCssClass('AXMEdit')
                    .addStyle('width',control._width+'px')
                    .addStyle('white-space', 'normal')
                    .addStyle('position', 'relative');
                return div;
            };


            /**
             * Attached the html events after DOM creation
             */
            control.attachEventHandlers = function() {
                control._getSub$El('slider').change(control._onChange);
                setTimeout(function() {control._setNewValue();}, 700);
            };


            /**
             * Handles the html on change event
             * @private
             */
            control._onChange = function() {
                control._value = parseFloat(control._getSub$El('slider').val());
                control._setNewValue();
                control.performNotify();
            };


            /**
             * Sets the new displayed value
             * @private
             */
            control._setNewValue = function() {
                control._getSub$El('value').text(control._value);
            };


            /**
             * Returns the current value of the slider
             * @returns {float}
             */
            control.getValue = function () {
                if (control._getSub$El('slider').length>0)
                    control._value = parseFloat(control._getSub$El('slider').val());
                return control._value;
            };

            control.setValue = function(newVal, preventNotify) {
                control._getSub$El('slider').val(newVal);
                if (!preventNotify)
                    control.performNotify();
            };

        return control;
        };


        Module.DateTimePicker=function(settings){
            var control = Module.SingleControlBase(settings);
            control._height = settings.height || 20;
            control._width = settings.width || 160;
            control._value = settings.value || '';
            control._text = settings.text || '';
            control._disabled = settings.disabled || '';

            control._IsInitDone=false;
            control._timepicker=settings.timepicker;
            control._inline=settings.inline ;

            //control._mask=settings.mask || '9999-19-39 29:59';
            control._format=settings.format || 'Y-m-d H:i';
            control._formatDate=settings.formatDate || 'Y-m-d';
            control._formatTime=settings.formatTime || 'H:i';

            control._defaultTime=settings.defaultTime;
            control._defaultDate=settings.defaultDate;

            control._scrollMonth= settings._scrollMonth||false;
            control._scrollTime= settings._scrollTime||false;
            control._scrollInput= settings._scrollInput||false;
            //control._minDate:settings.minDate:'+1970/01/02';//disable dates in the future
            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            control.render = function() {
                control._datetimepickerid=control._getSubId('datetimepicker');
                var rootEl = DOM.Create("input", {id: control._datetimepickerid});
                rootEl.addCssClass('AXMEdit');
                rootEl.addCssClass('AXMdatetimepicker');

                if (control._disabled)
                    rootEl.addAttribute('disabled', "disabled");

                if (control._width)
                    rootEl.addStyle('width',control._width+'px');
                if (control._height)
                    rootEl.addStyle('height',control._height+'px');
                if (control._value)
                    rootEl.value=(control._value);

                return rootEl;
            };


            control.attachEventHandlers = function() {
                Promise.all([
                    import("jquery-datetimepicker"),
                    import("jquery-datetimepicker/jquery.datetimepicker.css")
                ]).then(() => {
                    $.datetimepicker.setLocale("en");
                    
                    $("#" + control._datetimepickerid).datetimepicker({
                        value: control._value,
                        defaultTime: control._defaultTime,
                        defaultDate: control._defaultDate,
                        timepicker: control._timepicker,
                        inline: control._inline,
                        format: control._format,
                        formatDate: control._formatDate,
                        formatTime: control._formatTime,
                        scrollMonth: control._scrollMonth,
                        scrollTime: control._scrollTime,
                        scrollInput: control._scrollInput
                    });
                });
            };


            /**
             * Handles the html on change event
             * @private
             */
            control._onChange = function() {
                control._value = (control._getSub$El('datetimepicker').val());
                control._setNewValue();
                control.performNotify();
            };

            /**
             * Returns the current value of the control
             * @returns {float}
             */
            control.getValue = function () {
                if (control._getSub$El('datetimepicker').length>0)
                    control._value = (control._getSub$El('datetimepicker').val());
                return control._value;
            };

            control.setValue = function(newVal) {
                control._getSub$El('datetimepicker').val(newVal);
            };


            return control;
        };


        Module.DateRange = function(settings) {

            var pad = function(num, size) {
                var s = num+"";
                while (s.length < size) s = "0" + s;
                return s;
            };

            var control = Module.DropList(settings);
            control.addState('', _TRL("-- All dates --"));
            var monthNames = [_TRL('January'), _TRL('February'), _TRL('March'), _TRL('April'), _TRL('May'), _TRL('June'), _TRL('July'), _TRL('August'), _TRL('September'), _TRL('October'), _TRL('November'), _TRL('December')];
            var currentDate = new Date();
            var currentMonth = currentDate.getMonth();
            var currentYear = currentDate.getYear()+1900;
            for (var i=0; i<18; i++) {
                control.addState(currentYear+'-'+(currentMonth+1), monthNames[currentMonth] +  ' ' + currentYear, ' ' + currentYear);
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
            }

            control.isSet = function() {
                var value = control.getValue();
                return !!value;
            };

            control.getDateRangeStart = function() {
                if (!control.isSet())
                    return "1900-01-01";
                var year = control.getValue().split('-')[0];
                var month = control.getValue().split('-')[1];
                return year + '-' + pad(month,2) + "-01";
            };

            control.getDateRangeEnd = function() {
                if (!control.isSet())
                    return "2100-01-01";
                var year = control.getValue().split('-')[0];
                var month = control.getValue().split('-')[1];
                var date = new Date(year, month-1, 1, 0,0, 0);
                date.setMonth(date.getMonth() + 1);
                date.setDate(date.getDate() - 1);
                var year = date.getYear() + 1900;
                var month = date.getMonth() + 1;
                var day = date.getDate();
                return year + '-' + pad(month,2) + '-' + pad(day,2);
            };


            return control;
        };

        /**
         * Implements a color picker control
         * @param {{}} settings - control settings
         * @param {AXM.Color} settings.value - initial color value
         * @returns {Object} - control instance
         * @constructor
         */
        Module.ColorPickerPredefined = function(settings) {
            var control = Module.SingleControlBase(settings);
            control._value = settings.value || Color.Color(0.5,0.5,0.5);

            control._baseColors = [
                Color.Color(0.9, 0.2, 0.2),
                Color.Color(0.9, 0.5, 0.0),
                Color.Color(0.8, 0.6, 0.0),
                Color.Color(0.4, 0.6, 0.0),
                Color.Color(0.0, 0.7, 0.0),
                Color.Color(0.2, 0.6, 0.6),


                Color.Color(0.3, 0.3, 1.0),
                Color.Color(0.7, 0.2, 0.7),
                Color.Color(0.4, 0.4, 0.4)
            ];

            control._colors = [];
            $.each(control._baseColors, function(idx, baseColor) {
                control._colors.push(baseColor.darken(0.3));
            });
            $.each(control._baseColors, function(idx, baseColor) {
                control._colors.push(baseColor.lighten(0.1).deSaturate(0.15));
            });
            $.each(control._baseColors, function(idx, baseColor) {
                control._colors.push(baseColor.lighten(0.5));
            });


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            control.render = function() {

                var div = DOM.Div({ id:control._getSubId('') });
                var divCurrent = DOM.Div({ parent: div, id:control._getSubId('current') });
                divCurrent.addStyle("width", "30px").addStyle("height", "49px").addStyle("display", "inline-block").addStyle("margin-right","7px").addStyle("margin-bottom","2px");
                divCurrent.addStyle("background-color", control._value.toString());

                var divColors = DOM.Div({ parent: div });
                divColors.addStyle("display", "inline-block");
                $.each(control._colors,function(idx, color) {
                    var divColor = DOM.Div({ parent: divColors, id:control._getSubId('color_'+idx) });
                    divColor.addStyle("width", "15px").addStyle("height", "15px").addStyle("display", "inline-block").addStyle("margin-right","2px").addStyle("margin-bottom","2px").addStyle("cursor", "pointer");
                    divColor.addStyle("background-color", color.toString());
                    if ((idx+1)%control._baseColors.length==0)
                        divColors.addElem('<br>');
                });

                return div;
            };


            /**
             * Attached the html events after DOM creation
             */
            control.attachEventHandlers = function() {
                $.each(control._colors,function(idx, color) {
                    $('#' + control._getSubId('color_'+idx)).click(function() {
                        control._value = color;
                        $('#' + control._getSubId('current')).css("background-color", color.toString());
                        control.performNotify();
                    })
                });
            };




            /**
             * Returns the current value of the slider
             * @returns {AXM.Color}
             */
            control.getValue = function () {
                //if (control._getSub$El('slider').length>0)
                //    control._value = parseFloat(control._getSub$El('slider').val());
                return control._value;
            };

            return control;
        };



        return Module;
    });
