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

        var Module = {};

        Module._autoDecorateString = function(ctrl) {
            if (typeof ctrl != 'string')
                return ctrl;
            else {
                return require('AXM/Controls/Controls').Static({text: ctrl});
            }
        };


        Module.CompoundControlBase = function() {
            var compound = AXMUtils.object('@Control');
            compound._id = 'CT'+AXMUtils.getUniqueID();
            compound._members = [];


            compound.set = function(ctrlSet) {
                compound._members = [];
                $.each(ctrlSet, function(idx, ctrl) {
                    ctrl = Module._autoDecorateString(ctrl);
                    AXMUtils.Test.checkIsType(ctrl, '@Control');
                    compound.add(ctrl);
                });
                return compound;
            };

            compound.add = function(ctrl) {
                ctrl = Module._autoDecorateString(ctrl);
                AXMUtils.Test.checkIsType(ctrl, '@Control');
                compound._members.push(ctrl);
                return ctrl;
            };

            compound.attachEventHandlers = function() {
                $.each(compound._members, function(idx, member) {
                    member.attachEventHandlers();
                });
            };

            return compound;
        };

        Module.GroupVert = function(settings, members) {
            var compound = Module.CompoundControlBase();
            if (!settings)
                settings = {};
            compound._separator = settings.separator || 0;
            if (members)
                compound.set(members);

            compound.setSeparator = function(sep) {
                compound._separator = sep;
                return compound;
            }

            compound.createHtml = function() {
                var div = DOM.Div();
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


            return compound;
        };


        Module.GroupHor = function(settings, members) {
            var compound = Module.CompoundControlBase();
            if (!settings)
                settings = {};
            compound._separator = settings.separator || 0;
            if (members)
                compound.set(members);

            compound.setSeparator = function(sep) {
                compound._separator = sep;
                return compound;
            }

            compound.createHtml = function() {
                var div = DOM.Div();
                div.addStyle('white-space', 'nowrap');
                $.each(compound._members, function(idx, member) {
                    var elemDiv = DOM.Div({parent:div});
                    elemDiv.addStyle('display', 'inline-block');
                    elemDiv.addStyle('vertical-align', (settings.verticalAlignCenter)?'center':'top');
                    div.addStyle('white-space', 'normal');
                    elemDiv.addStyle('margin-right', compound._separator+'px');
                    elemDiv.addElem(member.createHtml());
                });
                return div.toString();
            };


            return compound;
        };

        Module.Grid = function(settings) {
            var grid = Module.CompoundControlBase();

            if (!settings)
                settings = {};

            grid._rows = [];
            grid.sepH = settings.sepH || 12;
            grid.sepV = settings.sepV || 5;


            grid.set = null; //not applicable here
            grid._parentAdd = grid.add;
            grid.add = null; //not applicable here

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

            grid.getRowCount = function() {
                return grid._rows.length;
            };

            grid.createHtml = function() {
                var div = DOM.Div();
                div.addStyle('display','inline-block');

                var st = '<table style="">';
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


            return grid;
        };




        ///////////////////////////////////////////////////////////////////////////////////

        Module.WrapperControlBase = function(ctrl) {
            var wrapper = AXMUtils.object('@Control');
            AXMUtils.Test.checkIsType(ctrl, '@Control');
            wrapper._id = 'CT'+AXMUtils.getUniqueID();
            wrapper._member = ctrl;

            wrapper.attachEventHandlers = function() {
                wrapper._member.attachEventHandlers();
            };

            wrapper.get$El = function() {
                return $('#' + wrapper._id);
            };


            return wrapper;
        };


        Module.WrapperStyled = function(ctrl, styleClass) {
            var wrapper = Module.WrapperControlBase(ctrl);

            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addCssClass(styleClass);
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };

        Module.Margin = function(ctrl, marginLeft) {
            var wrapper = Module.WrapperControlBase(ctrl);

            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addStyle('margin', marginLeft+'px');
                //div.addStyle('display', 'inline-block');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };

        Module.StandardMargin = function(ctrl) {
            var wrapper = Module.WrapperControlBase(ctrl);

            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addCssClass('AXMFormStandardMargin')
                //div.addStyle('margin-left', marginLeft+'px');
                //div.addStyle('display', 'inline-block');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        }

        Module.AlignRight = function(ctrl) {
            var wrapper = Module.WrapperControlBase(ctrl);

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

        Module.Section = function(ctrl, title) {
            var wrapper = Module.WrapperControlBase(ctrl);
            wrapper._title = title;

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

        Module.BackgroundIcon = function(ctrl, icon) {
            var wrapper = Module.WrapperControlBase(ctrl);

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


        Module.VScroller = function(ctrl, heigth) {
            var wrapper = Module.WrapperControlBase(ctrl);

            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                div.addCssClass('AXMFormVScroller');
                div.addStyle('height', heigth+'px');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };

        Module.Hider = function(ctrl, hidden) {
            var wrapper = Module.WrapperControlBase(ctrl);
            wrapper._show = !hidden;

            wrapper.createHtml = function() {
                var div = DOM.Div({id: wrapper._id});
                if (!wrapper._show)
                    div.addStyle('display', 'none');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            wrapper.show = function(status) {
                if (wrapper._show != status) {
                    wrapper._show = status;
                    if (status)
                        wrapper.get$El().show(400);
                    else
                        wrapper.get$El().hide(400);

                }
            };

            return wrapper;
        };


        ///////////////////////////////////////////////////////////////////////////////////

        Module.DecoratorBase = function() {
            var wrapper = AXMUtils.object('@Control');
            wrapper._id = 'CT'+AXMUtils.getUniqueID();

            wrapper.attachEventHandlers = function() {
            };

            return wrapper;
        };


        Module.DividerH = function() {
            var wrapper = Module.DecoratorBase();

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


        Module.SeparatorH = function(w) {
            var wrapper = Module.DecoratorBase();
            wrapper.createHtml = function() {
                var div = DOM.Div()
                    .addStyle('display','inline-block')
                    .addStyle('width',w + 'px')
                    .addStyle('height','1px')
                return div.toString();
            };
            return wrapper;
        };

        Module.SeparatorV = function(h) {
            var wrapper = Module.DecoratorBase();
            wrapper.createHtml = function() {
                var div = DOM.Div()
                    .addStyle('width','1px')
                    .addStyle('height',h + 'px')
                return div.toString();
            };
            return wrapper;
        };

        Module.BigIcon = function(icon) {
            var wrapper = Module.DecoratorBase();
            wrapper.createHtml = function() {
                return '<i class="AXMBigIcon fa {icon}"></i>'.AXMInterpolate({icon: icon});
            };
            return wrapper;
        };

        return Module;
    });

