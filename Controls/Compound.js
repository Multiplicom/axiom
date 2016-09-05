// Copyright (c) 2015 Multiplicom NV
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
        "AXM/AXMUtils", "AXM/DOM"],
    function (
        require, $, _,
        AXMUtils, DOM) {


        /**
         * Module encapsulating a set of classes that represent HTML controls that group other controls
         * @type {{}}
         */
        var Module = {};


        /**
         * Automatically converts a string to a static control. if the input was not a strung (e.g. a control), it is returned
         * @param {string} ctrl - string to be converted
         * @returns {AXM.Controls.Controls.Static}
         * @private
         */
        Module._autoDecorateString = function(ctrl) {
            if (typeof ctrl != 'string')
                return ctrl;
            else {
                return require('AXM/Controls/Controls').Static({text: ctrl});
            }
        };


        /**
         * Base class for all compound controls
         * @returns {Object}
         * @constructor
         */
        Module.CompoundControlBase = function() {
            var compound = AXMUtils.object('@Control');
            compound._id = 'CT'+AXMUtils.getUniqueID();
            compound._members = [];


            /**
             * Sets the list of controls that are member of this compound control
             * @param [] ctrlSet - list of member controls
             * @returns {Object} - self
             */
            compound.set = function(ctrlSet) {
                compound._members = [];
                $.each(ctrlSet, function(idx, ctrl) {
                    ctrl = Module._autoDecorateString(ctrl);
                    AXMUtils.Test.checkIsType(ctrl, '@Control');
                    compound.add(ctrl);
                });
                return compound;
            };


            /**
             * Removes all controls from the list of member controls
             */
            compound.clear = function() {
                compound._members = [];
            };

            /**
             * Adds a control to the list of member controls
             * @param {{}} ctrl - controll to add
             * @returns {Object} - added control
             */
            compound.add = function(ctrl) {
                ctrl = Module._autoDecorateString(ctrl);
                AXMUtils.Test.checkIsType(ctrl, '@Control');
                compound._members.push(ctrl);
                return ctrl;
            };


            /**
             * Attaches member controls html event handlers after DOM insertion
             */
            compound.attachEventHandlers = function() {
                $.each(compound._members, function(idx, member) {
                    member.attachEventHandlers();
                });
            };

            /**
             * Detaches member controls html event handlers
             */
            compound.detachEventHandlers = function() {
                $.each(compound._members, function(idx, member) {
                    member.detachEventHandlers();
                });
            };

            /**
             * Called by the framework when a control needs to be teared down.
             */
            compound.tearDown = function() {
                $.each(compound._members, function(idx, member) {
                    member.tearDown();
                });
            };


            return compound;
        };


        /**
         * Implements a compound control grouping members controls vertically
         * @param {{}} settings - control settings
         * @param {int} settings.separator - size of the vertical separation between members
         * @param [Object] members - list of member controls
         * @returns {Object} - compound control instance
         * @constructor
         */
        Module.GroupVert = function(settings, members) {
            var compound = Module.CompoundControlBase();
            if (!settings)
                settings = {};
            compound._separator = settings.separator || 0;
            if (members)
                compound.set(members);


            /**
             * Specifies the vertical separation size between the members
             * @param {int} sep - separations size
             * @returns {Object} - self
             */
            compound.setSeparator = function(sep) {
                compound._separator = sep;
                return compound;
            };


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            compound.createHtml = function() {
                var div = DOM.Div({id: compound._id+'_wrapper'});
                $.each(compound._members, function(idx, member) {
                    var elemDiv = DOM.Div({parent:div});
                    if (idx>0) {
                        if (compound._separator)
                            elemDiv.addElem('<div style="height:{h}px"/>'.AXMInterpolate({h:compound._separator}));
                    }
                    elemDiv.addElem(member.createHtml());
                });
                return div.toString();
            };

            compound.liveUpdate = function() {
                var $El = $('#' + compound._id+'_wrapper');
                $El.html(compound.createHtml());
                compound.attachEventHandlers();
            };


            return compound;
        };


        /**
         * Implements a compound control grouping members controls horizontally
         * @param {{}} settings - control settings
         * @param {int} settings.separator - size of the horizontal separation between members
         * @param [Object] members - list of member controls
         * @returns {Object} - compound control instance
         * @constructor
         */
        Module.GroupHor = function(settings, members) {
            var compound = Module.CompoundControlBase();
            if (!settings)
                settings = {};
            compound._separator = settings.separator || 0;
            compound._noWrap = settings.noWrap || false;
            if (members)
                compound.set(members);


            /**
             * Specifies the horizontal separation size between the members
             * @param {int} sep - separations size
             * @returns {Object} - self
             */
            compound.setSeparator = function(sep) {
                compound._separator = sep;
                return compound;
            };


            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            compound.createHtml = function() {
                var div = DOM.Div();
                if (compound._noWrap)
                    div.addStyle('white-space', 'nowrap');
                $.each(compound._members, function(idx, member) {
                    var elemDiv = DOM.Div({parent:div});
                    elemDiv.addStyle('display', 'inline-block');
//                    elemDiv.addStyle('position', 'relative');
                    var alignStr = (settings.verticalAlignCenter)?'center':'top';
                    if (settings.verticalAlignBaseline)
                        alignStr = 'baseline';
                    elemDiv.addStyle('vertical-align', alignStr);
                    elemDiv.addStyle('white-space', 'normal');
                    elemDiv.addStyle('margin-right', compound._separator+'px');
                    elemDiv.addElem(member.createHtml());
                });
                return div.toString();
            };

            return compound;
        };


        /**
         * Implements a compound control grouping member controls in a grid way
         * @param {{}} settings - control settings
         * @param {int} settings.sepH - horizontal separation size between columns
         * @param {int} settings.sepV - vertical separation size between rows
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Grid = function(settings) {
            var grid = Module.CompoundControlBase();

            if (!settings)
                settings = {};

            grid._rows = [];
            grid.sepH = settings.sepH || 12;
            grid.sepV = settings.sepV || 7;
            grid.alternatingLines = settings.alternatingLines;


            grid.set = null; //not applicable here
            grid._parentAdd = grid.add;
            grid.add = null; //not applicable here


            /**
             * Sets the member control for an individual cell
             * @param {int} rowNr - row number
             * @param {int} colNr - column number
             * @param {Object} ctrl - member control to set
             * @returns {AXM.Controls.Controls.Static|*}
             */
            grid.setItem = function(rowNr, colNr, ctrl) {
                ctrl = Module._autoDecorateString(ctrl);
                grid._parentAdd(ctrl);
                while (grid._rows.length <= rowNr)
                    grid._rows.push([]);
                while (grid._rows[rowNr].length <= colNr)
                    grid._rows[rowNr].push(null);
                grid._rows[rowNr][colNr] = ctrl;
                return ctrl;
            };

            grid.clearData = function() {
                grid._rows = [];
            };


            /**
             * Returns the number of rows
             * @returns {Number}
             */
            grid.getRowCount = function() {
                return grid._rows.length;
            };


            /**
             * Returns the html implementing the control
             * @returns {String|string|*}
             */
            grid.createHtml = function() {
                var div = DOM.Div({id: grid._id+'_wrapper'});
                div.addStyle('display','inline-block');

                var className = "";
                if (grid.alternatingLines)
                    className = "AlternatingLineGrid";
                var st = '<table class="{clss}">'.AXMInterpolate({clss: className});
                $.each(grid._rows, function(rowNr, row) {
                    st += '<tr>';
                    $.each(row, function(colNr, item) {
                        st += '<td style="padding-right:{sepH}px;padding-bottom:{sepV}px;">'.AXMInterpolate({ sepH: grid.sepH, sepV: grid.sepV });
                        if (item != null)
                            st += item.createHtml();
                        st += '</td>';
                    });
                    st += '</tr>';
                });
                st += '</table>';
                div.addElem(st);

                return div.toString();
            };

            grid.liveUpdate = function() {
                var $El = $('#' + grid._id+'_wrapper');
                $El.html(grid.createHtml());
                grid.attachEventHandlers();
            };


            return grid;
        };




        ///////////////////////////////////////////////////////////////////////////////////


        /**
         * Base class for a control that wraps a single other control
         * @param {Object} ctrl - control to be wrapped
         * @returns {*|Object}
         * @constructor
         */
        Module.WrapperControlBase = function(ctrl) {
            var wrapper = AXMUtils.object('@Control');
            if (ctrl !==null)
                AXMUtils.Test.checkIsType(ctrl, '@Control');
            wrapper._id = 'CT'+AXMUtils.getUniqueID();
            wrapper._member = ctrl;


            /**
             * Attaches the wrapped control html event handlers after DOM insertion
             */
            wrapper.attachEventHandlers = function() {
                if (wrapper._member)
                    wrapper._member.attachEventHandlers();
            };

            /**
             * Detaches the wrapped control html event handlers
             */
            wrapper.detachEventHandlers = function() {
                if (wrapper._member)
                    wrapper._member.detachEventHandlers();
            };

            /**
             * Gets the jQuery element of the wrapper control
             * @returns {jQuery}
             */
            wrapper.get$El = function() {
                return $('#' + wrapper._id);
            };

            wrapper.getMember = function() {
                return wrapper._member;
            };

            /**
             * Called by the framework when a control needs to be teared down.
             */
            wrapper.tearDown = function() {
                if (wrapper._member)
                    wrapper._member.tearDown();
            };

            return wrapper;
        };

        Module.Transferrer = function(ctrl) {
            var wrapper = Module.WrapperControlBase(ctrl);
            wrapper.extend('@ControlTransferrer');

            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                if (wrapper._member) {
                    wrapper._memDivId = AXMUtils.getUniqueID();
                    var memdiv = DOM.Div({id: wrapper._memDivId, parent: div});
                    memdiv.addElem(wrapper._member.createHtml());
                }
                return div.toString();
            };

            wrapper.transferFrom = function(src) {
                AXMUtils.Test.checkIsType(src, '@ControlTransferrer');
                if (wrapper._member)
                    AXMUtils.reportBug("Non-empty dest transferrer");
                var ctrl = src.getMember();
                if (!src)
                    AXMUtils.reportBug("Empty source transferrer");
                wrapper._member = ctrl;
                src._member = null;
                $("#"+src._memDivId).detach().appendTo('#'+wrapper._id);
                wrapper._memDivId = src._memDivId;
                src._memDivId = null;
            };

            return wrapper;
        };

        /**
         * Wraps a control in a styled DIV
         * @param {Object} ctrl - control to be wrapped
         * @param {string} styleClass - css class name
         * @returns {Object} - control instance
         * @constructor
         */
        Module.WrapperStyled = function(ctrl, styleClass) {
            var wrapper = Module.WrapperControlBase(ctrl);


            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addCssClass(styleClass);
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };


            return wrapper;
        };


        /**
         * Wraps a margin around a control
         * @param {Object} ctrl - control to be wrapped
         * @param {int} marginLeft - margin size
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Margin = function(ctrl, marginLeft) {
            var wrapper = Module.WrapperControlBase(ctrl);

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addStyle('margin', marginLeft+'px');
                //div.addStyle('display', 'inline-block');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };


        /**
         * Wraps a fixed width box around a control
         * @param {Object} ctrl - control to be wrapped
         * @param {int} width - width
         * @returns {Object} - control instance
         * @constructor
         */
        Module.FixedWidth = function(ctrl, width, isMinimum, isMaximum) {
            var wrapper = Module.WrapperControlBase(ctrl);

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                if (isMinimum)
                    div.addStyle('min-width', width+'px');
                else if (isMaximum)
                    div.addStyle('max-width', width+'px');
                else
                    div.addStyle('width', width+'px');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };


        /**
         * Wraps a standard sized margin around a control
         * @param {Object} ctrl - control to be wrapped
         * @returns {Object} - control instance
         * @constructor
         */
        Module.StandardMargin = function(ctrl) {
            var wrapper = Module.WrapperControlBase(ctrl);

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addCssClass('AXMFormStandardMargin')
                //div.addStyle('margin-left', marginLeft+'px');
                //div.addStyle('display', 'inline-block');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };


        /**
         * Wraps a control in a right align box
         * @param {Object} ctrl - control to be wrapped
         * @returns {Object} - control instance
         * @constructor
         */
        Module.AlignRight = function(ctrl) {
            var wrapper = Module.WrapperControlBase(ctrl);

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addStyle('position', 'absolute');
                div.addStyle('right', '0px');
                div.addStyle('top', '0px');
                div.addStyle('display', 'inline-block');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };


        /**
         * Wraps a control in a section with a header
         * @param {Object} ctrl - wrapped control
         * @param {string} title - section title
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Section = function(ctrl, title) {
            var wrapper = Module.WrapperControlBase(ctrl);
            wrapper._title = title;

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var divContainer = DOM.Div({id: wrapper._id});
                var divTitle = DOM.Div({parent: divContainer});
                divTitle.addCssClass('AXMFormSectionHeader');
                divTitle.addElem(wrapper._title);
                var divBody = DOM.Div({parent: divContainer});
                divBody.addElem(wrapper._member.createHtml());
                return divContainer.toString();
            };

            return wrapper;
        };


        /**
         * Creates an icon in the background of a control
         * @param {Object} ctrl - wrapped control
         * @param {string} icon - icon name
         * @returns {Object} - control instance
         * @constructor
         */
        Module.BackgroundIcon = function(ctrl, icon) {
            var wrapper = Module.WrapperControlBase(ctrl);

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var divContainer = DOM.Div({id: wrapper._id});
                divContainer.addStyle('position', 'relative');
                var str = '<div style="position:absolute;top:-15px;left:-7px;z-index:0"><i class="fa fa-history" style="font-size: 80px;color:rgb(225, 240, 253)"></i></div>';
                divContainer.addElem(str);
                var divBody = DOM.Div({parent: divContainer});
                divBody.addStyle('position', 'relative');
                //divBody.addStyle('top', '0px');
                divBody.addStyle('z-index', '1');
                divBody.addElem(wrapper._member.createHtml());
                return divContainer.toString();
            };

            return wrapper;
        };


        /**
         * Wraps a scrollable DIV around a control
         * @param {Object} ctrl - wrapped control
         * @param {int} heigth - DIV height
         * @returns {Object} - object instance
         * @constructor
         */
        Module.VScroller = function(ctrl, heigth) {
            var wrapper = Module.WrapperControlBase(ctrl);

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addCssClass('AXMFormVScroller');
                div.addStyle('height', heigth+'px');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };


        /**
         * Wraps a DIV around a control that can be dynamically shown or hidden
         * @param {Object} ctrl - wrapped control
         * @param {boolean} hidden - default DIV visibility
         * @returns {Object} - control instance
         * @constructor
         */
        Module.Hider = function(ctrl, hidden) {
            var wrapper = Module.WrapperControlBase(ctrl);
            wrapper._show = !hidden;
            wrapper._animation = true;
            wrapper._animateOpacity = false;

            wrapper.setAnimateOpacity = function() {
                wrapper._animateOpacity = true;
                return wrapper;
            };

            wrapper.setNoAnimation = function() {
                wrapper._animation = false;
                return wrapper;
            };

            /**
             * Returns the html implementing the wrapped control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                if (!wrapper._show)
                    div.addStyle('display', 'none');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };


            /**
             * Changes the visibility of the control
             * @param {boolean} status - new visibility
             */
            wrapper.show = function(status) {
                if (wrapper._show != status) {
                    wrapper._show = status;
                    if (!wrapper._animation) {
                        if (status)
                            wrapper.get$El().show();
                        else
                            wrapper.get$El().hide();
                    }
                    else {
                        if (!wrapper._animateOpacity) {
                            if (status)
                                wrapper.get$El().show(200);
                            else
                                wrapper.get$El().hide(200);
                        } else {
                            if (status) {
                                wrapper.get$El().css("opacity", 0);
                                wrapper.get$El().show();
                                wrapper.get$El().fadeTo(200, 1);
                            }
                            else {
                                wrapper.get$El().fadeTo(200, 0, function () {
                                    wrapper.get$El().hide();
                                });
                            }
                        }
                    }
                }
            };

            return wrapper;
        };


        ///////////////////////////////////////////////////////////////////////////////////


        /**
         * Base class implementing a decoration element control
         * @returns {Object} - control instance
         * @constructor
         */
        Module.DecoratorBase = function() {
            var wrapper = AXMUtils.object('@Control');
            wrapper._id = 'CT'+AXMUtils.getUniqueID();

            wrapper.attachEventHandlers = function() {
            };

            /**
             * Detaches member controls html event handlers
             */
            wrapper.detachEventHandlers = function() {
            };

            /**
             * Called by the framework when a control needs to be teared down.
             */
            wrapper.tearDown = function() {
            };

            return wrapper;
        };


        /**
         * Implements a horizontal divider element control
         * @returns {Object} - control instance
         * @constructor
         */
        Module.DividerH = function() {
            var wrapper = Module.DecoratorBase();

            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div()
                    .addStyle('display','inline-block')
                    .addStyle('vertical-align','middle')
                    .addStyle('width','3px')
                    .addStyle('height','25px')
                    .addStyle('background-color','rgb(0,0,0)')
                    .addStyle('opacity',0.15)
                    .addStyle('margin-left','7px')
                    .addStyle('margin-right','7px');
                return div.toString();
            };

            return wrapper;
        };


        /**
         * Implements a horizontal separation control
         * @param {int} w - horizontal size
         * @returns {Object} - control instance
         * @constructor
         */
        Module.SeparatorH = function(w) {
            var wrapper = Module.DecoratorBase();

            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div()
                    .addStyle('display','inline-block')
                    .addStyle('width',w + 'px')
                    .addStyle('height','1px')
                return div.toString();
            };
            return wrapper;
        };


        /**
         * Implements a vertical separation control
         * @param {int} h - vertical size
         * @returns {Object} - control instance
         * @constructor
         */
        Module.SeparatorV = function(h) {
            var wrapper = Module.DecoratorBase();

            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                var div = DOM.Div()
                    .addStyle('width','1px')
                    .addStyle('height',h + 'px');
                return div.toString();
            };
            return wrapper;
        };


        /**
         * Implements a control displaying an icon
         * @param {string} icon - icon name
         * @returns {Object} - control instance
         * @constructor
         */
        Module.BigIcon = function(icon) {
            var wrapper = Module.DecoratorBase();

            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            wrapper.createHtml = function() {
                return '<i class="AXMBigIcon fa {icon}"></i>'.AXMInterpolate({icon: icon});
            };
            return wrapper;
        };

        return Module;
    });

