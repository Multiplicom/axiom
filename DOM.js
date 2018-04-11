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

let __instance = null;
class Diagnostics {
    constructor () {
        if (!__instance) {
            __instance = this;
        }

        this.tracingEnabled = false;
        this.collected = new Map();
        return __instance;
    }

    hashCode(str) {
        return str.split('').reduce((prevHash, currVal) =>
          (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
    }

    collect(c) {
        function approximateStack() {
            var err = new Error();
            return err.stack;
        }

        if (!this.tracingEnabled) {
            return;
        }

        if (!this.collected.has(c)) {
            this.collected.set(c, {count: 0, stack: approximateStack()});
        } 

        let updated = this.collected.get(c);
        updated.count = updated.count + 1;
        this.collected.set(c, updated);                
    }

    report(n) {
        if (!this.tracingEnabled) {
            return;
        }

        let now = new Date();

        let obj = Array.from(this.collected.entries())
            .filter(([_, trace]) => trace.count > 5)
            .reduce((report, [k, trace]) => {
                report[this.hashCode(k)] = ({ count: trace.count, stack: trace.stack })
                return report;
            }, {});
            
        console.log(`[${now.toISOString()}] ${JSON.stringify(obj, null, 2)}`);
    }
}

define([
        "require", "jquery", "_",
        "AXM/AXMUtils"
    ],
    function (
        require, $, _,
        AXMUtils
    ) {

        var tracer = new Diagnostics();
        setInterval(tracer.report.bind(__instance), 10000);


        /**
         * Module encapsulation a set of classes that represent HTML elements
         * @type {{}}
         */
        var Module = {};


        /**
         * Abstact base class for a html element
         * @param {string} itype - element type
         * @param {{}} args - various possible arguments
         * @param {Module._Element} args.parent - (optional) parent element
         * @private
         */
        Module._Element = function (itype, args) {
            this.myType = itype;
            this.myAttributes = {};
            this.myClasses = [];
            this.myStyles = {};
            this.myComponents = [];

            this.tracer = new Diagnostics();

            //do the stuff with the arguments provided
            if (typeof args != 'undefined') {
                if ('id' in args) this.setID(args.id);
                if ('parent' in args) {
                    if (!(args.parent instanceof Module._Element)) AXMUtils.reportBug("DocEl parent is not a DocEl");
                    args.parent.addElem(this);
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


        /**
         * Converts the object to html markup string
         * @returns {string} - html string
         */
        Module._Element.prototype.toString = function () {
            return this.createElement().outerHTML;
        };

        Module._Element.prototype.createElement = function () {
            var el = document.createElement(this.myType);

            for (var id in this.myAttributes) {
                el.setAttribute(id, this.myAttributes[id]);
            }

            if (this.myClasses.length) {
                el.className = this.myClasses.join(" ");
            }

            if (this.myStyles) {
                for (var style in this.myStyles) {
                    el.style[style] = this.myStyles[style];
                }
            }

            if (this.myComponents && this.myComponents.length) {
                for (var component of this.myComponents) {
                    if (component && component.createElement) {
                        el.appendChild(component.createElement());
                    }

                    if (component && typeof component === 'string') {
                        __instance.collect(component);
                        el.insertAdjacentHTML("beforeend", component);
                    }
                }
            }

            return el;
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



        return Module;
    });

