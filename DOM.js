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

        function containsKey(o, p) {
            return Object.prototype.hasOwnProperty.call(o, p);
        }
    
        function getObjectType(o) {
            return Object.prototype.toString.call(o);
        }


        /**
         * Abstact base class for a html element
         * @param {string} itype - element type
         * @param {{}} args - various possible arguments
         * @param {Object} args.attr - sets the attr for the underlying DOM element
         * @param {Object} args.style - sets the style(s) for the underlying DOM element
         * @param {string|Array} args.className - sets the value of the class attribute 
         * @param {DOMElement} args.parent - (optional) parent element
         * @private
         */
        DOMElement = function() {
            var args = Array.prototype.slice.call(arguments);

            // args[0] {String} tagName
            this.myType = args.shift(1);

            // args[1] {Object} properties
            var properties = args.shift(1) || {};
            if (containsKey(properties, "parent")) {
                // `parent` is a special property that sets the child
                properties.parent.addElem(this);
            }

            this.properties = Object.keys(properties).reduce(
                function createProps(props, p) {
                    if (p !== "parent") {
                        props[p] = properties[p];
                    }

                    return props;
                },
                {
                    style: {}
                }
            );

            if (containsKey(properties, "id")) {
                this.setID(properties.id);
            }

            this.myClasses = properties.className ? [].concat(properties.className) : [];

            // args[2] {Array} - children
            this.myComponents = args.shift(1) || [];
        };

        /**
         * Sets the html id
         * @param {string} iID
         */
        DOMElement.prototype.setID = function (iID) {
            this.myID = iID;
            this.addAttribute("id", iID);
        };


        /**
         * Returns the html id
         * @returns {string}
         */
        DOMElement.prototype.getID = function () {
            return this.myID;
        };


        /**
         * Adds a html attribute
         * @param {string} id - attribute id
         * @param {string} content - attribute content
         * @returns {DOMElement} - self
         */
        DOMElement.prototype.addAttribute = function (id, content) {
            this.properties[id] = '' + content.toString();
            return this;
        };


        /**
         * Adds a css style
         * @param {string} id - syle id
         * @param {string} content - style content
         * @returns {DOMElement} - self
         */
        DOMElement.prototype.addStyle = function (id, content) {
            this.properties.style[id] = content.toString();
            return this;
        };


        /**
         * Adds a member element
         * @param icomp - element
         * @returns {DOMElement} - self
         */
        DOMElement.prototype.addElem = function (icomp) {
            this.myComponents.push(icomp);
            return this;
        };

        /**
         * Adds a text node
         * @param icomp - element
         * @returns {DOMElement} - self
         */
        DOMElement.prototype.addText = function (text) {
            return this.addElem(document.createTextNode(text));
        }

        /**
         * Returns a member element
         * @param {int} nr
         * @returns {*} - element
         */
        DOMElement.prototype.getElem = function (nr) {
            return this.myComponents[nr];
        };

        /**
         * Adds a css class
         * @param {string} iclss
         * @returns {DOMElement} - self
         */
        DOMElement.prototype.addCssClass = function (iclss) {
            this.myClasses.push(iclss);
            return this;
        };

        function isDOMNode (el) {
            return el && el.nodeName && el.nodeType
        }

        this._el = null;

        Object.defineProperties(DOMElement.prototype, {
            styles: {
                get: function getStyles() {
                    return containsKey(this.properties, "style")
                        ? this.properties.style
                        : {};
                }
            },
            el$: {
                get: function getElement() {
                    if (!this._el) {
                        // If no tagName is defined, create a fragment instead
                        this._el = this.myType
                            ? document.createElement(this.myType)
                            : document.createDocumentFragment();
                    }

                    return this._el;
                }
            },
            node$: {
                get: function getNode() {
                    for (var propName in this.properties) {
                        if (propName !== "style" && propName !== "className") {
                            this.el$.setAttribute(propName, this.properties[propName]);
                        }
                    }

                    for (var styleName in this.styles) {
                        this.el$.style.setProperty(styleName, this.styles[styleName]);
                    }

                    if (this.myClasses.length > 0) {
                        this.el$.className = this.myClasses.join(" ");
                    }

                    this.addChildren();

                    return this.el$;
                }
            }
        });

        DOMElement.prototype.addChildren = function addChildren () {
            if (this.myComponents.length === 1) {
                return appendChild(this.el$, this.myComponents[0]);
            }

            if (this.myComponents.length > 1) {
                var documentFragment = document.createDocumentFragment();

                for (var i = 0; i < this.myComponents.length; i++) {
                    documentFragment = appendChild(documentFragment, this.myComponents[i]);
                }

                return appendChild(this.el$, documentFragment);
            } 

        }


        function appendChild(parent, component) {
            if (isDOMNode(component)) {
                parent.appendChild(component);
                return parent;
            }

            if (component instanceof DOMElement) {
                parent.appendChild(component.node$);
                return parent;
            }

            // Need to assume it's an HTML snippet
            if (component == "") {
                // No op
                return parent;
            }

            var contextFragment = document
                .createRange()
                .createContextualFragment(component.toString());
            
            parent.appendChild(contextFragment);
            return parent;
        };

        /**
         * Converts the object to html markup string
         * @returns {string} - html string
         */
        DOMElement.prototype.toString = function () {
            // TODO Deprecate this method to avoid rount tripping
            // between DOM Objects and HTML snippets.
            var htmlElement = this.node$
            return htmlElement.outerHTML;
        };


        /**
         * Returns an object containing a generic html element
         * @param {string} itype - element type
         * @param {{}} args - see DOMElement
         * @returns {DOMElement} - the element instance
         * @constructor
         */
        Module.Create = function (itype, args) {
            var that = new DOMElement(itype, args);
            return that;
        };


        /**
         * Returns a div element
         * @param {{}} args - see DOMElement
         * @returns {DOMElement} - the element instance
         * @constructor
         */
        Module.Div = function (args) {
            var that = Module.Create("div", args);
            return that;
        };

        /**
         * Returns a label element
         * @param {{}} args - see DOMElement
         * @param {string} args.target - target of the label
         * @returns {DOMElement} - the element instance
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

