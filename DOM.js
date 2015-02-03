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
        "AXM/AXMUtils"
    ],
    function (
        require, $, _,
        AXMUtils
    ) {

        var Module = {};

        Module._Element = function (itype, args) {
            this.myType = itype;
            this.myAttributes = {};
            this.myClasses = [];
            this.myStyles = {};
            this.myComponents = [];

            //do the stuff with the arguments provided
            if (typeof args != 'undefined') {
                if ('id' in args) this.setID(args.id);
                if ('parent' in args) {
                    if (!(args.parent instanceof Module._Element)) AXMUtils.reportBug("DocEl parent is not a DocEl");
                    args.parent.addElem(this);
                }
            }
        };

        Module._Element.prototype.setID = function (iID) {
            this.myID = iID;
            this.addAttribute("id", iID);
        };

        Module._Element.prototype.getID = function () {
            return this.myID;
        };

        Module._Element.prototype.addAttribute = function (id, content) {
            this.myAttributes[id] = '' + content;
            return this;
        };

        Module._Element.prototype.addStyle = function (id, content) {
            this.myStyles[id] = '' + content.toString();
            return this;
        };

        Module._Element.prototype.addElem = function (icomp) {
            this.myComponents.push(icomp);
            return this;
        };

        Module._Element.prototype.getElem = function (nr) {
            return this.myComponents[nr];
        };

        Module._Element.prototype.addCssClass = function (iclss) {
            this.myClasses.push(iclss);
            return this;
        };

        Module._Element.prototype.toString = function () {
            var rs = '<' + this.myType;

            for (var id in this.myAttributes) {
                rs += ' ';
                rs += id + '="' + this.myAttributes[id] + '"';
                first = false;
            }

            if (this.myClasses.length>0) {
                rs += ' class="';
                rs += this.myClasses.join(' ');
                rs += '"';
            }

            if (true) {//todo? only if there are styles present?
                rs += ' style="';
                var first = true;
                for (id in this.myStyles) {
                    if (!first) rs += ';';
                    rs += id + ":" + this.myStyles[id];
                    first = false;
                }
                rs += '"';
            }
            rs += '>';

            rs += this.CreateInnerHtml();

            rs += '</' + this.myType + '>';
            return rs;
        };



        Module._Element.prototype.CreateInnerHtml = function () {
            var rs = '';
            for (var compnr = 0; compnr < this.myComponents.length; compnr++) {
                rs += this.myComponents[compnr].toString();
            }
            return rs;
        };




        Module.Create = function (itype, args) {
            var that = new Module._Element(itype, args);
            return that;
        };





        Module.Div = function (args) {
            var that = Module.Create("div", args);
            return that;
        };



        Module.Label = function (args) {
            var that = Module.Create("label", args);
            if ('target' in args)
                that.addAttribute("for", args.target);
            return that;
        }



        return Module;
    });

