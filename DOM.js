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


        /**
         * Module encapsulation a set of classes that represent HTML elements
         * @type {{}}
         */
        var Module = {};


        /**
         * Abstact base class for a html element
         * @param {string} itype - element type
         * @param {{}} args - various possible arguments
         * @param {Object} args.attr - sets the attr for the underlying DOM element
         * @param {Object} args.style - sets the style(s) for the underlying DOM element
         * @param {string|Array} args.className - sets the value of the class attribute 
         * @param {Module._Element} args.parent - (optional) parent element
         * @private
         */
        Module._Element = function(itype, args) {
            this.myType = itype;
            this.myAttributes = {};
            this.myClasses = [];
            this.myStyles = {};
            this.myComponents = [];

            //do the stuff with the arguments provided
            if (typeof args != "undefined") {
                if ("id" in args) this.setID(args.id);
                if ("parent" in args) {
                    if (!(args.parent instanceof Module._Element))
                        AXMUtils.reportBug("DocEl parent is not a DocEl");
                    args.parent.addElem(this);
                }
                
                if (Object.prototype.hasOwnProperty.call(args, "className")) {
                    this.myClasses = this.myClasses.concat(args.className);
                }
                
                if (Object.prototype.hasOwnProperty.call(args, "style")) {
                    $.extend(this.myStyles, args.style);
                }
                
                if (Object.prototype.hasOwnProperty.call(args, "attr")) {
                    $.extend(this.myAttributes, args.attr)
                }
            }
        };

        /**
         * Sets the html id
         * @param {string} iID
         */
        Module._Element.prototype.setID = function (iID) {
            this.myID = iID;
            this.addAttribute("id", iID);
        };


        /**
         * Returns the html id
         * @returns {string}
         */
        Module._Element.prototype.getID = function () {
            return this.myID;
        };


        /**
         * Adds a html attribute
         * @param {string} id - attribute id
         * @param {string} content - attribute content
         * @returns {Module._Element} - self
         */
        Module._Element.prototype.addAttribute = function (id, content) {
            this.myAttributes[id] = '' + content;
            return this;
        };


        /**
         * Adds a css style
         * @param {string} id - syle id
         * @param {string} content - style content
         * @returns {Module._Element} - self
         */
        Module._Element.prototype.addStyle = function (id, content) {
            this.myStyles[id] = '' + content.toString();
            return this;
        };


        /**
         * Adds a member element
         * @param icomp - element
         * @returns {Module._Element} - self
         */
        Module._Element.prototype.addElem = function (icomp) {
            this.myComponents.push(icomp);
            return this;
        };

        /**
         * Adds a text node
         * @param icomp - element
         * @returns {Module._Element} - self
         */
        Module._Element.prototype.addText = function (text) {
            return this.addElem(document.createTextNode(text));
        }

        /**
         * Returns a member element
         * @param {int} nr
         * @returns {*} - element
         */
        Module._Element.prototype.getElem = function (nr) {
            return this.myComponents[nr];
        };

        /**
         * Adds a css class
         * @param {string} iclss
         * @returns {Module._Element} - self
         */
        Module._Element.prototype.addCssClass = function (iclss) {
            this.myClasses.push(iclss);
            return this;
        };

        function isNode (el) {
            return el && el.nodeName && el.nodeType
        }

        function isFauxHTMLElement(el) {
            return !!el.htmlElement; 
        }


        Module._Element.prototype.htmlElement = function() {
            var el = document.createElement(this.myType);

            for (var id in this.myAttributes) {
                el.setAttribute(id, this.myAttributes[id]);
            }

            if (this.myClasses.length > 0) {
                el.className = this.myClasses.join(" ");
            }

            for (var id in this.myStyles) {
                el.style.setProperty(id, this.myStyles[id]);
            }

            for (var i = 0; i < this.myComponents.length; i++) {
                var component = this.myComponents[i];
                if (isNode(component)) { 
                    el.appendChild(component);
                } else if (isFauxHTMLElement(component)) {
                    el.appendChild(component.htmlElement());
                } else {
                    // if (typeof component === 'string') {
                    // Need to assume it's an HTML snippet
                    if (component !== "") {
                        el.insertAdjacentHTML("beforeend", component.toString());
                    }
                }
            }

            return el;
        };

        /**
         * Converts the object to html markup string
         * @returns {string} - html string
         */
        Module._Element.prototype.toString = function () {
            var htmlElement = this.htmlElement()
            return htmlElement.outerHTML;
        };


        /**
         * Returns an object containing a generic html element
         * @param {string} itype - element type
         * @param {{}} args - see Module._Element
         * @returns {Module._Element} - the element instance
         * @constructor
         */
        Module.Create = function (itype, args) {
            var that = new Module._Element(itype, args);
            return that;
        };


        /**
         * Returns a div element
         * @param {{}} args - see Module._Element
         * @returns {Module._Element} - the element instance
         * @constructor
         */
        Module.Div = function (args) {
            var that = Module.Create("div", args);
            return that;
        };

        /**
         * Returns a label element
         * @param {{}} args - see Module._Element
         * @param {string} args.target - target of the label
         * @returns {Module._Element} - the element instance
         * @constructor
         */
        Module.Label = function (args) {
            var that = Module.Create("label", args);
            if ('target' in args)
                that.addAttribute("for", args.target);
            return that;
        };

        [
            "a",
            "abbr",
            "address",
            "area",
            "article",
            "aside",
            "audio",
            "b",
            "base",
            "bdi",
            "bdo",
            "blockquote",
            "body",
            "br",
            "button",
            "canvas",
            "caption",
            "cite",
            "code",
            "col",
            "colgroup",
            "data",
            "datalist",
            "dd",
            "del",
            "dfn",
            "div",
            "dl",
            "dt",
            "em",
            "embed",
            "fieldset",
            "figcaption",
            "figure",
            "footer",
            "form",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "head",
            "header",
            "hr",
            "html",
            "i",
            "iframe",
            "img",
            "input",
            "ins",
            "kbd",
            "keygen",
            "label",
            "legend",
            "li",
            "link",
            "main",
            "map",
            "mark",
            "meta",
            "meter",
            "nav",
            "noscript",
            "object",
            "ol",
            "optgroup",
            "option",
            "output",
            "p",
            "param",
            "pre",
            "progress",
            "q",
            "rb",
            "rp",
            "rt",
            "rtc",
            "ruby",
            "s",
            "samp",
            "script",
            "section",
            "select",
            "small",
            "source",
            "span",
            "strong",
            "style",
            "sub",
            "sup",
            "table",
            "tbody",
            "td",
            "template",
            "textarea",
            "tfoot",
            "th",
            "thead",
            "time",
            "title",
            "tr",
            "track",
            "u",
            "ul",
            "var",
            "video",
            "wbr"
        ].forEach(function addElementHelper(domType) {
            var methodName = domType.charAt(0).toUpperCase() + domType.slice(1);
            Module[methodName] = function createElement(settings) {
                return Module.Create(domType, settings);
            };
        });

        return Module;
    });

