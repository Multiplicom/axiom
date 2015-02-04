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

        Module.CompoundControlBase = function() {
            var compound = AXMUtils.object('@Control');
            compound._id = 'CT'+AXMUtils.getUniqueID();
            compound._members = [];


            compound.set = function(ctrlSet) {
                compound._members = [];
                $.each(ctrlSet, function(idx, ctrl) {
                    compound.add(ctrl);
                });
                return compound;
            };

            compound.add = function(ctrl) {
                compound._members.push(ctrl);
                return compound;
            };

            compound.attachEventHandlers = function() {
                $.each(compound._members, function(idx, member) {
                    member.attachEventHandlers();
                });
            };

            return compound;
        };

        Module.GroupVert = function(settings) {
            var compound = Module.CompoundControlBase();

            compound.createHtml = function() {
                var div = DOM.Div();
                $.each(compound._members, function(idx, member) {
                    if (idx>0)
                        div.addElem('<br/>');
                    div.addElem(member.createHtml());
                });
                return div.toString();
            };


            return compound;
        };


        Module.GroupHor = function(settings) {
            var compound = Module.CompoundControlBase();
            compound._separator = 0;

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
                    elemDiv.addStyle('margin-right', compound._separator+'px');
                    elemDiv.addElem(member.createHtml());
                });
                return div.toString();
            };


            return compound;
        };



        ///////////////////////////////////////////////////////////////////////////////////

        Module.WrapperControlBase = function(ctrl) {
            var wrapper = AXMUtils.object('@Control');
            wrapper._id = 'CT'+AXMUtils.getUniqueID();
            wrapper._member = ctrl;

            wrapper.attachEventHandlers = function() {
                wrapper._member.attachEventHandlers();
            };

            return wrapper;
        };


        Module.WrapperStyled = function(ctrl, styleClass) {
            var wrapper = Module.WrapperControlBase(ctrl);

            wrapper.createHtml = function() {
                var div = DOM.Div();
                div.addCssClass(styleClass);
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };

        Module.Margin = function(ctrl, marginLeft) {
            var wrapper = Module.WrapperControlBase(ctrl);

            wrapper.createHtml = function() {
                var div = DOM.Div();
                div.addStyle('margin', marginLeft+'px');
                div.addElem(wrapper._member.createHtml());
                return div.toString();
            };

            return wrapper;
        };

        Module.StandardMargin = function(ctrl) {
            return Module.Margin(ctrl,10);
        }



        ///////////////////////////////////////////////////////////////////////////////////

        Module.DecoratorBase = function() {
            var wrapper = {};
            wrapper._id = 'CT'+AXMUtils.getUniqueID();

            wrapper.attachEventHandlers = function() {
            };

            return wrapper;
        };


        Module.DividerH = function() {
            var wrapper = Module.DecoratorBase();

            wrapper.createHtml = function() {
                var div = DOM.Div().addStyle('display','inline-block').addStyle('vertical-align','middle');
                div.addStyle('width','3px').addStyle('height','25px').addStyle('background-color','rgb(0,0,0)').addStyle('opacity',0.15)
                    .addStyle('margin-left','7px').addStyle('margin-right','7px');
                return div.toString();
            };

            return wrapper;
        };


        return Module;
    });

