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
        "require", "jquery", "_", "filesaver",
        "AXM/Test", "AXM/Msg", "he"
    ],
    function (
        require, $, _, FileSaver,
        Test, Msg, he
    ) {
        /**
         * Module encapsulating a number of utility functions
         * @type {{Test: *}}
         */
        var Module = {
            Test: Test
        };


        /**
         * Returns a generic Axiom object
         * @param {string} typeStr - object type id
         * @returns {{}}
         */
        Module.object = function(typeStr) {
            var obj = {
                __typeStrings: [typeStr]
            };

            obj.extend = function(typeStr) {
                obj.__typeStrings.push(typeStr);
            };

            return obj;
        };

        Module.isObjectType = function(obj, typeStr) {
            if (!obj)
                return false;
            if (!obj.__typeStrings)
                return false;
            if (obj.__typeStrings.indexOf(typeStr)<0)
                return false;
            return true;
        };



        /**
         * Determines if a value is an array
         * @param v
         * @returns {boolean}
         */
        Module.isArray = function(v) {
            return (v && v.constructor && (v.constructor == Array));
        };


        /**
         * Determines if a value is a string
         * @param v
         * @returns {boolean}
         */
        Module.isString = function(v) {
            return (typeof v == 'string');
        };


        /**
         * Determines if a value is a boolean
         * @param v
         * @returns {boolean}
         */
        Module.isBoolean = function(v) {
            return (typeof v == 'boolean');
        };


        /**
         * Determines if a value is a number
         * @param v
         * @returns {boolean}
         */
        Module.isNumber = function(v) {
            return (typeof v == 'number');
        };


        /**
         * Determines if a value is a function
         * @param v
         * @returns {boolean}
         */
        Module.isFunction = function(v) {
            return (typeof v == 'function');
        };

        /**
         * Determines if an object has a property with given name
         * @param {{}} obj - object
         * @param {string} property - property name
         */
        Module.objectHasProperty = function(obj, property){
            return typeof obj[property] != 'undefined';
        };

        /**
         * Determines if a string contains ASCII text only
         * @param v
         * @returns {boolean}
         */
        Module.isASCIIText = function(v) {
            if (!Module.isString(v))
                return false;
            for (var i = 0; i < v.length; i++)
                if (v.charCodeAt(i) > 127)
                    return false;
            return true;
        };


        /**
         * Determines if a string contains ASCII text only, and no spaces or tabs
         * @param v
         * @returns {boolean}
         */
        Module.isValidLoginName = function(v) {
            if (!Module.isString(v))
                return false;
            var ascii = /^[!-~]+$/;
            return ascii.test(v);
        };


        /**
         * Calculates the logarithm with base 10
         * @param {float} v - argument
         * @returns {number} - result
         */
        Module.log10 = function(v) {
            return Math.log(v)/Math.log(10);
        };


        /**
         * Returns the query parameters for the url provided to run this app
         * @returns {{}} - paramaters key-value pairs
         */
        Module.getUrlParameters = function() {
            var urlParams;
            var match,
                pl     = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
                query  = decodeURIComponent(window.location.search.substring(1));

            urlParams = {};
            while (match = search.exec(query))
                urlParams[decode(match[1])] = decode(match[2]);
            return urlParams;
        };


        /**
         * Returns a value range object
         * @param {number} minValue - minimum value
         * @param {number}maxValue - maximum value
         * @returns {{}} - value range object
         */
        Module.valueRange = function(minValue, maxValue) {
            var range = Module.object('@ValueRange');
            range._minValue = minValue;
            range._maxValue = maxValue;
            range.getMin = function() { return range._minValue; };
            range.getMax = function() { return range._maxValue; };
            range.extendFraction = function(fr) {
                var ext = (range._maxValue - range._minValue) * fr/2;
                if (ext == 0)
                    ext = range._minValue * fr/2;
                range._minValue -= ext;
                range._maxValue += ext;
            };
            return range;
        };


        /**
         * Sort helper
         * @param {string} prop
         * @returns {Function}
         * @constructor
         */
        Module.ByProperty = function (prop) {
            return function (a, b) {
                if (typeof a[prop] == "number") {
                    return (a[prop] - b[prop]);
                } else {
                    return ((a[prop] < b[prop]) ? -1 : ((a[prop] > b[prop]) ? 1 : 0));
                }
            };
        };


        /**
         * Sort helper
         * @param {string} prop
         * @returns {Function}
         * @constructor
         */
        Module.ByPropertyReverse = function (prop) {
            return function (b, a) {
                if (typeof a[prop] == "number") {
                    return (a[prop] - b[prop]);
                } else {
                    return ((a[prop] < b[prop]) ? -1 : ((a[prop] > b[prop]) ? 1 : 0));
                }
            };
        };

        /**
         * Augments the string class with a function that interpolates tokens of the style {token}
         * @param {{}} args - key-value pairs with interpolation tokens
         * @returns {String} - interpolated string
         * @constructor
         */
        String.prototype.AXMInterpolate = function (args) {
            var newStr = this;
            for (var key in args) {
                var regex = new RegExp('{' + key + '}', 'g');
                 newStr = newStr.replace(regex, args[key]);//keep replacing until all instances of the keys are replaced
            }
            return newStr;
        };

        /**
         * Limits a string to a certain number of characters, using html ellipsis
         * @param {string} str - input string
         * @param {int} len - maxmimum number of characters
         * @returns {string} - limited string
         */
        Module.limitStringHtml = function(str, len){
            if (str.length > len)
                return str.substring(0,Math.max(1,len-4))+'&hellip;';
            else
                return str;
        };


        /**
         * Logs a line to the browser console
         * @param {string} line
         */
        Module.log = function(line) {
            //if (!console || !console.log)
            //    return;
            //console.log(line);
        };


        /**
         * Returns a throttled function that wraps around the argument function, making sure it is called not more often than delay specifies
         * @param {function} fn - argument function to be throttled
         * @param {int} delay - minimum delay (ms)
         * @returns {Function} - throttled function
         */
        Module.debounce = function(fn, delay) {
            var timer = null;
            return function () {
                var context = this, args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function () {
                    fn.apply(context, args);
                }, delay);
            };
        };

        /**
         * Returns a throttled function that wraps around the argument function, making sure it is called not more often than delay specifies
         * @param {function} fn - argument function to be throttled
         * @param {int} delay - minimum delay (ms)
         * @returns {Function} - throttled function
         */
        Module.debounce2 = function(fn, delay) {
            var timer = null;
            return function () {
                var context = this, args = arguments;
                if (!timer) {
                    timer = setTimeout(function () {
                        timer = null;
                        fn.apply(context, args);
                    }, delay);
                }
            };
        };


        Module._uniqueID = 0;


        /**
         * Returns a session-wide unique string
         * @returns {string}
         */
        Module.getUniqueID = function () {
            Module._uniqueID++;
            return 'ID' + Module._uniqueID;
        };

        Module._zindex = 0;

        /**
         * Returns an ever increasing number, used to keep track of stacking of z-indexes
         * @returns {number}
         */
        Module.getNextZIndex = function () {
            Module._zindex+=100;
            return Module._zindex;
        };

        Module.getCurrentZIndex = function () {
            return Module._zindex;
        };

        /**
         * Reports a bug
         * @param msg
         */
        Module.reportBug = function(msg) {
            //throw(msg);
            //alert(msg);
            //debugger;
        };


        /**
         * Returns the size of the browser client area
         * @returns {{sizeX: number, sizeY: number}}
         */
        Module.getBrowserSize = function() {
            return {
                sizeX: $(window).width(),
                sizeY: $(window).height()
            };
        };


        /**
         * Creates a drag handler for a jquery element
         * @param {jQuery} $El - jQuery element
         * @param {function} handlerStart - called when dragging starts
         * @param {function} handlerMove - called when dragging moves
         * @param {function} handlerStop - called when dragging stops
         */
        Module.create$ElDragHandler = function($El, handlerStart, handlerMove, handlerStop) {

            var handlerId = 'DGH'+Module.getUniqueID();

            var positStartX = null;
            var positStartY = null;

            var handleMouseDown = function (ev) {
                Module.closeTransientPopups();
                positStartX = ev.pageX;
                positStartY = ev.pageY;
                $(document).bind("mouseup."+handlerId, handleMouseUp);
                $(document).bind("mousemove."+handlerId, handleMouseMove);
                handlerStart({
                    event: ev,
                    shiftPressed:ev.shiftKey,
                    controlPressed:ev.ctrlKey,
                    altPressed:ev.altKey
                });
                ev.stopPropagation();
                return false;
            };

            var handleMouseUp = function (ev) {
                $(document).unbind("mouseup."+handlerId);
                $(document).unbind("mousemove."+handlerId);
                handlerStop({});
                ev.stopPropagation();
                return false;
            };

            var handleMouseMove = function(ev) {
                var positX = ev.pageX;
                var positY = ev.pageY;
                handlerMove({
                    event: ev,
                    diffTotalX:positX-positStartX,
                    diffTotalY:positY-positStartY
                });
                ev.stopPropagation();
                return false;
            };

            $El.mousedown(handleMouseDown);

        };

        Module.remove$ElDragHandler = function($El) {
            $El.unbind('mousedown');

        };

        /**
         * Creates a mouse wheel handler for a jQuery element
         * @param {jQuery} $El - jQuery element
         * @param {function} handler - called when scrolling happens
         */
        Module.create$ElScrollHandler = function($El, handler, preventDefault) {

            var getOriginalEvent = function(ev) { return ev.originalEvent || ev; };

            var getRawDeltaX = function (ev) { return -getOriginalEvent(ev).deltaX / 16; };
            var getRawDeltaY = function(ev) { return -getOriginalEvent(ev).deltaY / 16; };

            var getScrollDirection = function(ev) {
                // prefer a single direction for scrolling; the direction with the largest delta.
                if (Math.abs(getRawDeltaX(ev)) >= Math.abs(getRawDeltaY(ev))) {
                    return 'X';
                } else {
                    return 'Y';
                }
            };

            var getDeltaX = function(ev) { return getScrollDirection(ev) === 'X' ? getRawDeltaX(ev) : 0; };
            var getDeltaY = function(ev) { return getScrollDirection(ev) === 'Y' ? getRawDeltaY(ev) : 0; };

            $El.bind('wheel', function(ev) {

                Module.closeTransientPopups();
                handler({
                    deltaX: getDeltaX(ev),
                    deltaY: getDeltaY(ev),
                    controlPressed: ev.ctrlKey,
                    altPressed: ev.altKey,
                    event: ev
                });
                if (preventDefault) {
                    ev.preventDefault();
                    return false;
                }
            });
        };


        Module.remove$ElScrollHandler = function($El) {
            $El.unbind('wheel');
        };

        var _keyDownHandlerStack = [];
        var _keyDownHandlersHover = {};


        Module.addKeyDownHandler = function (handler) {
            _keyDownHandlerStack.unshift(handler);
        };

        Module.removeKeyDownHandler = function (handler) {
            var fndIdx = null;
            $.each(_keyDownHandlerStack, function(idx, hnd) {
                if (hnd ===  handler)
                    fndIdx = idx;
            });
            if (fndIdx !== null)
                _keyDownHandlerStack.splice(fndIdx, 1);
        };




        var _onKeyDown = function(ev) {
            if (ev.keyCode == 27)
                ev.isEscape = true;
            if (ev.keyCode == 13)
                ev.isEnter = true;
            if (_keyDownHandlerStack.length > 0) {
                _keyDownHandlerStack[0](ev);
                return;
            }
            //for (var id in _keyDownHandlersHover)
            //    if (DQX._keyDownHandlersHover[id])
            //        if (DQX._keyDownHandlersHover[id](ev)) {
            //            return false;
            //        }
        };

        $(document).keydown(_onKeyDown);

        /**
         * Creates a class helping the scheduling of functions that execute asynchronously
         * @returns {{}} - class instance
         * @constructor
         */
        Module.Scheduler = function() {
            var sched = {};

            sched.scheduledFunctions = [];
            sched.completedTokens = {};

            /**
             * Add a scheduled function. The execution will only start if all required tokens are marked as completed
             * @param requiredTokens
             * @param func
             */
            sched.add = function(requiredTokens, func) {
                sched.scheduledFunctions.push({
                    requiredList: requiredTokens,
                    func: func
                });
            };

            /**
             * Call this function to mark a token as being completed
             * @param token
             */
            sched.setCompleted = function(token) {
                sched.completedTokens[token] = true;
            };

            /**
             * Run scheduled functions for which all required tokens are marked as completed, up
             * to a maximum processing time.
             * @private
             */
            sched._tryNext = function() {
                var runnableActions = _.filter(sched.scheduledFunctions, function(action) {
                    return !action.started &&
                        _.every(action.requiredList, function(token) { return !!sched.completedTokens[token] });
                });

                var startTime = new Date().getTime();

                for (i = 0; i < runnableActions.length; i++) {
                    var action = runnableActions[i];
                    action.started = true;
                    action.func();
                    // only execute up to a certain time limit to avoid unresponsiveness
                    if (new Date().getTime() - startTime > 100)
                        break;
                }

                // if there are unstarted tasks left (either due to timeout or because their dependencies are not met),
                // schedule a new processing iteration to run in the future
                // wait at least 50ms to avoid high-frequency checking for task dependencies that are still running
                if (_.some(sched.scheduledFunctions, function(action) { return !action.started; }))
                    setTimeout(sched._tryNext, 50);
            };

            /**
             * Start the execution of the scheduled functions
             */
            sched.execute = function() {
                sched._tryNext();
            };

            return sched;
        };


        /**
         * Returns a class helping with persistent association of elements in a variable context
         * @param itemCount
         * @returns {{}}
         * @constructor
         */
        Module.PersistentAssociator = function(itemCount) {
            var assoc = {};
            assoc.itemCount = itemCount;
            assoc.associations = {};

            assoc.map = function(idlist) {
                var freeItemMap = {};
                var i;
                for (i = 0; i<assoc.itemCount; i++) freeItemMap[i]=1;
                $.each(idlist, function(idx, id) {
                    if (idx<assoc.itemCount) {
                        if (id in assoc.associations)
                            delete freeItemMap[id];
                    }
                });
                var freeItems=[];
                for (i = 0; i<assoc.itemCount; i++) {
                    if (freeItemMap[i] == 1)
                        freeItems.push(i);
                }
                var freenr = 0;

                var usedItemMap = {};
                $.each(idlist, function(idx, id) {
                    if (idx<assoc.itemCount) {
                        var missing = false;
                        if (!(id in assoc.associations))
                            missing = true;
                        else {
                            if (assoc.associations[id] in usedItemMap)
                                missing = true;
                        }
                        if (missing) {
                            assoc.associations[id] = freeItems[freenr];
                            freenr++;
                        }
                        usedItemMap[assoc.associations[id]] = 1;
                    }
                });

                assoc.mapped = true;
            };

            assoc.getAssociations = function() {
                return assoc.associations;
            };

            assoc.get = function(id) {
                if (!(id in assoc.associations))
                    return -1;
                else
                    return assoc.associations[id];
            };

            return assoc;
        };

        Module._textInterpolators = {};


        /**
         * Defines the set of text interpolators tokens used for the _TRL function
         * @param dct
         */
        Module.setTextInterpolators = function(dct) {
            Module._textInterpolators = dct;
        };


        /**
         * Adds a new text interpolator token
         * @param key
         * @param value
         */
        Module.addTextInterpolator = function(key, value) {
            Module._textInterpolators[key] = value;
        };

        Module._useTextDecoration = function() {
            if(typeof __AXMTextDecoration === "undefined")
                return false;
            return __AXMTextDecoration;
        };


        /**
         * Converts the first character of a string to a capital
         * @param {string} str - input string
         * @returns {string} - result string
         */
        Module.makeStartCapital = function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        /**
         * Interpolates a text string by replacing {_xxx_} tokens with snippets taken from Module._textInterpolators
         * For future use: translates the string using a translation table
         * @param {string} txt - Text to be translated and interpolated
         * @returns {string} - Result text
         * @private
         * @global
         */
        /*global _TRL*/
        _TRL = function(txt) {
            var reg = new RegExp(/{_.*?_}/g);
            var tokens = [];
            var match;
            while (match = reg.exec(txt))
                tokens.push(match[0]);
            $.each(tokens,function(idx, token) {
                if (token.length < 5) {
                    //Module.Test.reportBug('Invalid token: '+token);
                }
                var tokenString = token.substring(2, token.length-2);
                var isCapital = (tokenString[0] != tokenString[0].toLowerCase());
                tokenString = tokenString.toLowerCase();
                var replacement = Module._textInterpolators[tokenString];
                if (!replacement) {
                    //Module.Test.reportBug('Invalid token: '+token);
                    replacement = tokenString;
                }
                if (isCapital)
                    replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
                //if (Module._useTextDecoration())
                //    replacement = '|' + replacement + '|';
                txt = txt.replace(token, replacement);
            });
            if (Module._useTextDecoration())
                txt = '‘' + txt + "’";
            return txt;
        };


        /**
         * Saves content to a local file on the client's computer
         * @param {string} data - file content
         * @param {string} fileName - file name
         */
        Module.saveTextFile = function(data, fileName) {
            var blob = new Blob([he.decode(data)], {type: "text/plain;charset=utf-8"});
            FileSaver(blob, fileName);
        };

        /**
         * Saves a base64-encoded data URL to the client's computer.
         * @param url the data URL
         * @param fileName the file name to save as
         */
        Module.saveDataUrl = function(url, fileName) {
            var comps = url.split(',');
            var metadata = comps[0];
            var contentType = metadata.split(';')[0].split(':')[1];
            var data = comps[1];
            var utf = atob(data);

            var binary = [];
            for (var i = 0; i < utf.length; i++)
                binary.push(utf.charCodeAt(i));

            var blob = new Blob([new Uint8Array(binary)], {type: contentType});
            FileSaver(blob, fileName);
        };

        /**
         * Saves the file obtained by fetching the response from an HTTP URL to the client's computer.
         * @param url the HTTP URL
         * @param fileName the file name to save as
         */
        Module.saveHttpUrl = function(url, fileName) {
            // jQuery cannot handle binary response data without adding a special transport adapter.
            // Therefore, use XMLHttpRequest directly.
            // ref: https://www.henryalgus.com/reading-binary-files-using-jquery-ajax/
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.onload = function(e) {
                if (this.status === 200) {
                    // get binary data as a response
                    var blob = this.response;
                    FileSaver(blob, fileName);
                }
            };
            xhr.send();
        };

        /**
         * (To be overwritten) Determines if the user has universal privileges
         * @returns {boolean}
         */
        Module.isSuperUser = function() {
            return false;
        };


        Module.loadLocalFile = function(onProceed) {

            var input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.style.display = 'none';
            input.onchange = function(e) {
                if (input.files.length>0) {
                    var file = input.files[0];

                    var reader = new FileReader();

                    reader.onload = function(event) {
                        var textFile = event.target;
                        var txt = textFile.result;
                        onProceed(file.name, txt);
                        //Module.loadFromText(file.name, txt, true);
                    };
                    reader.readAsText(file);
                }
            };
            input.focus();
            input.click();
        };



        Module.animateBoxTransition = function(elementFrom, elementTo, settings, onStarted, onCompleted) {
            var transId = '_transientAnim_' + Module.getUniqueID();
            var px0 = elementFrom.offset().left;
            var py0 = elementFrom.offset().top;
            var lx0 = elementFrom.outerWidth();
            var ly0 = elementFrom.outerHeight();


            var px1 = elementTo.offset().left;
            var py1 = elementTo.offset().top;
            var lx1 = elementTo.outerWidth();
            var ly1 = elementTo.outerHeight();

            //var thebox = DOM.Div({ id: transId });
            //thebox.addStyle("position", "absolute");
            //thebox.addStyle("left", px0 + 'px');
            //thebox.addStyle("top", py0 + 'px');
            //thebox.addStyle("width", lx0 + 'px');
            //thebox.addStyle("height", ly0 + 'px');
            //thebox.addStyle('border', '4px solid black');
            //thebox.addStyle('z-index', Module.getNextZIndex());

            var theBox = `<div id="${transId}" style="position:absolute;opacity:0.3;left:${px0 + 'px'};top:${py0 + 'px'};width:${lx0 + 'px'};height:${ly0 + 'px'};border:${'4px solid black'};z-index:${Module.getNextZIndex()}"></div>`;

            $('.AXMContainer').append(theBox);

            var animationSpeed = 300;
            if (settings && settings.slow)
                animationSpeed = 500;

            if (onStarted)
                onStarted();
            $('#'+transId).animate({left:px1+'px', top:py1+'px', width:lx1+'px', height:ly1+'px'}, animationSpeed, function() {
                $('#'+transId).remove();
                if (onCompleted)
                    onCompleted();
            });

        };


        /**
         * Call this function to close all temporary popups
         */
        Module.closeTransientPopups = function() {
            Msg.broadcast("CloseTransientPopups");
        };

        /**
         * Call this function to close all temporary popups that are not toolboxes
         */
        Module.closeRegularTransientPopups = function() {
            Msg.broadcast("CloseRegularTransientPopups");
        };

        /**
         * Requires an object to be present, and returns it
         * @param obj
         * @returns {*}
         */
        AXMReq = function(obj) {
            if (obj===undefined)
                Test.reportBug("Requered object not present");
            return obj;
        };


        return Module;
    });

