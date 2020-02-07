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
define(["require", "jquery", "_", "AXM/AXMUtils", "AXM/Events"], function(require, $, _, AXMUtils) {
    const delegate = require("delegate");
    const { kebabCase: paramCase }  = require("lodash");

    Fragment = (props, children) => h("", props, children);
    h = (Node, props, ...children) => {
        // Reify a Node if it inherits from Control
        const nodeType = Object.getPrototypeOf(Node);
        if (nodeType.name === "Control") {
            const controlNode = new Node(props, children);
            return controlNode.render();
        } else if (typeof Node === 'function') {
            return Node(props, children);
        }

        return new DOMElement(
            Node,
            props,
            children.flatMap(node => {
                if (node === "string") {
                    return document.createTextNode(node);
                }

                return node;
            })
        );
    };

    /**
     * Module encapsulation a set of classes that represent HTML elements
     * @type {{}}
     */
    var Module = {};

    function containsKey(o, p) {
        return Object.prototype.hasOwnProperty.call(o, p);
    }

    /**
     * Represents a virtual HTML element or DOM Node.
     * @param {string} itype element type
     * @param {[] args various possible arguments
     * @param {{}} args.attr sets the attr for the underlying DOM element
     * @param {{}} args.style sets the style(s) for the underlying DOM element
     * @param {string|Array} args.className sets the value of the class attribute
     * @param {DOMElement} args.parent (optional) parent element
     * @class
     */
    DOMElement = function DOMElement() {
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
            function getAttributes(attrs, p) {
                if (p !== "parent" && p !== "className" && p.slice(0, 2) !== "on") {
                    const normalizedAttributeName = paramCase(p);
                    attrs[normalizedAttributeName] = properties[p];
                }

                return attrs;
            },
            {
                style: {}
            }
        );

        this.listeners = Object.keys(properties).reduce(function getEventListeners(
            handlers,
            propName
        ) {
            if (propName.slice(0, 2) === "on") {
                handlers[propName] = properties[propName];
            }

            return handlers;
        },
        {});

        if (containsKey(properties, "id")) {
            this.setID(properties.id);
        }

        this.myClasses = properties.className ? [].concat(properties.className) : [];

        // args[2] {Array} children
        this.myComponents = args.shift(1) || [];
    };

    /**
     * Sets the html id
     * @param {string} iID
     */
    DOMElement.prototype.setID = function(iID) {
        this.myID = iID;
        this.addAttribute("id", iID);
    };

    /**
     * Returns the html id
     * @returns {string}
     */
    DOMElement.prototype.getID = function() {
        return this.myID;
    };

    /**
     * Adds a html attribute
     * @param {string} id attribute id
     * @param {string} content attribute content
     * @returns {DOMElement} self
     */
    DOMElement.prototype.addAttribute = function(id, content) {
        this.properties[id] = `${content}`;
        return this;
    };

    /**
     * Adds a css style
     * @param {string} id syle id
     * @param {string} content style content
     * @returns {DOMElement} self
     */
    DOMElement.prototype.addStyle = function(id, content) {
        const styleAttribute = paramCase(id);
        this.properties.style[styleAttribute] = `${content}`.trim();
        return this;
    };

    /**
     * Adds a member element
     * @argument {DOMElement|DOMElement[]} args Element(s) to add as children
     * @returns {DOMElement} self
     */
    DOMElement.prototype.addElem = function addComponent() {
        var components = Array.prototype.slice.call(arguments);
        Array.prototype.push.apply(this.myComponents, components);
        return this;
    };

    /**
     * Adds a text node
     * @param icomp element
     * @returns {DOMElement} self
     */
    DOMElement.prototype.addText = function(text) {
        return this.addElem(document.createTextNode(text));
    };

    /**
     * Returns a member element
     * @param {int} nr
     * @returns {*} element
     */
    DOMElement.prototype.getElem = function(nr) {
        return this.myComponents[nr];
    };

    /**
     * Adds a css class
     * @param {string} iclss
     * @returns {DOMElement} self
     */
    DOMElement.prototype.addCssClass = function(iclss) {
        this.myClasses.push(iclss);
        return this;
    };

    function isDOMNode(el) {
        return el && el.nodeName && el.nodeType;
    }

    this._el = null;

    Object.defineProperties(DOMElement.prototype, {
        styles: {
            get: function getNormalizedStyles() {
                return Object.entries(this.properties?.style ?? {}).reduce(
                    (styles, [attr, value]) => {
                        // this is too
                        const normalisedAttr = paramCase(attr);
                        styles[normalisedAttr] = `${value}`.trim();
                        return styles;
                    },
                    {}
                );
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
                // Node needs to be cloned otherwise the its children are
                // appended twice if the node is "materialized" again.
                var el = this.el$.cloneNode();

                // Set properties/attributes on the HTMLElement
                for (var propName in this.properties) {
                    if (propName !== "style" && propName !== "className") {
                        el.setAttribute(propName, this.properties[propName]);
                    }
                }

                for (var eventType in this.listeners) {
                    // Event delegation
                    delegate(
                        // This is the root of the component
                        // tree, events don't need to bubble any
                        // further.
                        ".AXMContainer",
                        `${this.myType}#${this.getID()}`,
                        eventType.slice(2).toLowerCase(),
                        this.listeners[eventType]
                    );
                }

                // Add styles to the HTMLElement
                for (var styleName in this.styles) {
                    el.style.setProperty(styleName, this.styles[styleName]);
                }

                // Constructs a CSS class name and adds it to the HTMLElement
                if (this.myClasses.length > 0) {
                    el.className = this.myClasses.join(" ");
                }

                // Adds the subcomponents to the materialized HTMLElement
                this.__addChildren(el);
                return el;
            }
        }
    });

    /**
     * For private use only. Adds the child components when
     * materializing the class as an actual HTMLElement.
     * @param {HTMLElement} el The physical HTMLElement to which the subcomponents will be added.
     * @see {DOMElement.prototype.addElem} A method for adding children to a component. :-)
     */
    DOMElement.prototype.__addChildren = function addChildren(el) {
        if (this.myComponents.length === 1) {
            return appendChild(el, this.myComponents[0]);
        }

        if (this.myComponents.length > 1) {
            var documentFragment = document.createDocumentFragment();

            for (var i = 0; i < this.myComponents.length; i++) {
                documentFragment = appendChild(documentFragment, this.myComponents[i]);
            }

            return appendChild(el, documentFragment);
        }
    };

    function appendChild(parent, component) {
        // (Native Browser DOM) Node (https://developer.mozilla.org/en-US/docs/Web/API/Node)
        //   - HTMLElement      => document.createElement()
        //   - TextNode         => document.createTextNode()
        //   - DocumentFragment => document.createDocumentFragment()
        //   - Comment          => document.createComment()
        if (isDOMNode(component)) {
            parent.appendChild(component);
            return parent;
        }

        // Virtual Node => h("div"), h("p"), h("i"), etc.
        if (component instanceof DOMElement) {
            parent.appendChild(component.node$);
            return parent;
        }

        // Component => <Icon />, <Button />, etc.
        if (component && component.render) {
            var renderedControl = component.render();
            return appendChild(parent, renderedControl);
        }

        // No op
        if (component == "" || component == null) {
            return parent;
        }

        // Backwards compatability, unfortunately, with many HTML snippets
        // still out there, need to assume it's an HTML snippet.
        //
        // This is produces unsafe subtrees in the DOM.
        var contextFragment = document.createRange().createContextualFragment(component.toString());
        parent.appendChild(contextFragment);

        return parent;
    }

    /**
     * Converts the object to html markup string
     * @deprecated This should not be used anymore when writing new controls or components, use either h-script or JSX.
     * @returns {string} html string
     */
    DOMElement.prototype.toString = function() {
        return this.node$.outerHTML || "";
    };

    /**
     * Returns an object containing a generic html element
     * @param {string} itype element type
     * @param {{}} args see DOMElement
     * @returns {DOMElement} the element instance
     * @constructor
     */
    Module.Create = function(itype, args, children) {
        var that = new DOMElement(itype, args, children);
        return that;
    };

    Module.Fragment = function createDOMFragment(children) {
        return new DOMElement(null, {}, children);
    };

    Module.Text = function createTextNode() {
        var args = Array.prototype.slice.call(arguments);
        return document.createTextNode(args.join(""));
    };

    Module.Empty = function createEmptyNode() {
        return Module.Fragment([]);
    };

    Module.Svg = function createSvgNode(args) {
        return Module.Create("svg", args);
    };

    /**
     * Returns a div element
     * @param {{}} args see DOMElement
     * @returns {DOMElement} the element instance
     * @constructor
     */
    Module.Div = function(args) {
        var that = Module.Create("div", args);
        return that;
    };

    /**
     * Returns a label element
     * @param {{}} args see DOMElement
     * @param {string} args.target target of the label
     * @returns {DOMElement} the element instance
     * @constructor
     */
    Module.Label = function(args) {
        var that = Module.Create("label", args);
        if ("target" in args) that.addAttribute("for", args.target);
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
        Module[methodName] = function createElement(settings, children) {
            return Module.Create(domType, settings, children);
        };
    });

    return Module;
});
