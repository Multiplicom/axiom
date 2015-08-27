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
        "require", "jquery", "_", "jquery_cookie", "blob", "filesaver",
        "AXM/Test",
    ],
    function (
        require, $, _, dummy_jquery_cookie, Blob, FileSaver,
        Test
    ) {

        var Module = {
            Test: Test
        };

        Module.object = function(typeStr) {
            var obj = {
                __typeStrings: [typeStr]
            };
            return obj;
        };

        Module.isArray = function(v) {
            return (v && v.constructor && (v.constructor == Array));
        };

        Module.isString = function(v) {
            return (typeof v == 'string');
        };

        Module.isBoolean = function(v) {
            return (typeof v == 'boolean');
        };

        Module.isNumber = function(v) {
            return (typeof v == 'number');
        };

        Module.isFunction = function(v) {
            return (typeof v == 'function');
        };

        Module.isASCIIText = function(v) {
            if (!Module.isString(v))
                return false;
            for (var i = 0; i < v.length; i++)
                if (v.charCodeAt(i) > 127)
                    return false;
            return true;
        };


        Module.isValidLoginName = function(v) {
            if (!Module.isString(v))
                return false;
            var ascii = /^[!-~]+$/;
            return ascii.test(v);
        };


        Module.getUrlParameters = function() {
            var urlParams;
            var match,
                pl     = /\+/g,  // Regex for replacing addition symbol with a space
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
                query  = window.location.search.substring(1);

            urlParams = {};
            while (match = search.exec(query))
                urlParams[decode(match[1])] = decode(match[2]);
            return urlParams;
        };


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


        //Sort helpers
        Module.ByProperty = function (prop) {
            return function (a, b) {
                if (typeof a[prop] == "number") {
                    return (a[prop] - b[prop]);
                } else {
                    return ((a[prop] < b[prop]) ? -1 : ((a[prop] > b[prop]) ? 1 : 0));
                }
            };
        };
        Module.ByPropertyReverse = function (prop) {
            return function (b, a) {
                if (typeof a[prop] == "number") {
                    return (a[prop] - b[prop]);
                } else {
                    return ((a[prop] < b[prop]) ? -1 : ((a[prop] > b[prop]) ? 1 : 0));
                }
            };
        };

        String.prototype.AXMInterpolate = function (args) {
            var newStr = this;
            for (var key in args) {
                newStr = newStr.replace('{' + key + '}', args[key]);
            }
            return newStr;
        };

        Module.limitStringHtml = function(str, len){
            if (str.length > len)
                return str.substring(0,Math.max(1,len-4))+'&hellip;';
            else
                return str;
        };


        Module.log = function(line) {
            if (!console || !console.log)
                return;
            console.log(line);
        }

        Module.BmpFile = function(bmpId) {
            //var st = '/static/js/AXM/Bitmaps/'+bmpId+'.png';
            //return st;
            return require.toUrl('AXM/Bitmaps/'+bmpId+'.png');
        };


        // Returns a throttled function that wraps around the argument function fn, making sure it is called not more often than delay specifies
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

        // Returns a throttled function that wraps around the argument function fn, making sure it is called not more often than delay specifies
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

        Module.getUniqueID = function () {
            Module._uniqueID++;
            return 'ID' + Module._uniqueID;
        };

        Module._zindex = 0;

        Module.getNextZIndex = function () {
            Module._zindex+=100;
            return Module._zindex;
        };


        Module.reportBug = function(msg) {
            alert(msg);
            debugger;
        };


        Module.getBrowserSize = function() {
            return {
                sizeX: $(window).width(),
                sizeY: $(window).height()
            };
        };


        Module.create$ElDragHandler = function($El, handlerStart, handlerMove, handlerStop) {

            var handlerId = 'DGH'+Module.getUniqueID();

            var positStartX = null;
            var positStartY = null;

            var handleMouseDown = function (ev) {
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


        Module.create$ElScrollHandler = function($El, handler) {

            var getMouseWheelDeltaY = function (ev) {
                var delta = 0;
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                if ((ev1.wheelDeltaX !== undefined) && (ev1.wheelDelta) ) { // check that we are scrolling vertically
                    if (Math.abs(ev1.wheelDeltaX) >= Math.abs(ev1.wheelDelta))
                        return 0;
                }
                if (ev1.wheelDelta) { delta = ev1.wheelDelta / 120; }
                else
                if (ev1.detail) { delta = -ev1.detail / 3; }
                return delta;
            }

            var getMouseWheelDeltaX = function (ev) {
                var ev1 = ev;
                if (ev.originalEvent)
                    ev1 = ev.originalEvent;
                if ((ev1.wheelDeltaX !== undefined) && (ev1.wheelDelta) ) { // check that we are scrolling horizontally
                    if (Math.abs(ev1.wheelDeltaX) >= Math.abs(ev1.wheelDelta))
                        return ev1.wheelDeltaX / 120;
                }
                return 0;
            }

            $El.bind('DOMMouseScroll mousewheel', function(ev) {
                //console.log('scrollevent');
                handler({
                    deltaY: getMouseWheelDeltaY(ev),
                    deltaX: getMouseWheelDeltaX(ev),
                    event: ev
                });
            });
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
        }




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

        // A class helping the scheduling of functions that execute asynchronously
        Module.Scheduler = function() {
            var sched = {};

            sched.scheduledFunctions = [];
            sched.completedTokens = {}

            // Add a scheduled function. The execution will only start if all required tokens are marked as completed
            sched.add = function(requiredTokens, func) {
                sched.scheduledFunctions.push({
                    requiredList: requiredTokens,
                    func: func
                });
            };

            // Call this function to mark a token as being completed
            sched.setCompleted = function(token) {
                sched.completedTokens[token] = true;
            };

            sched._tryNext = function() {
                var nextAction = null;
                var completed = true;
                $.each(sched.scheduledFunctions, function(idx, item) {
                    if (!item.started) {
                        completed = false;
                        var canExecute = true;
                        $.each(item.requiredList, function(idx2, requiredToken) {
                            if (!sched.completedTokens[requiredToken])
                                canExecute = false;
                        });
                        if (canExecute)
                            nextAction = item;
                    }
                });

                if (nextAction) {
                    nextAction.started = true;
                    nextAction.func();
                }
                if (!completed)
                    setTimeout(sched._tryNext, 50);
            };

            // Start the execution of the scheduled functions
            sched.execute = function() {
                sched._tryNext();
            };

            return sched;
        };



        Module.PersistentAssociator = function(itemCount) {
            var assoc = {};
            assoc.itemCount = itemCount;
            assoc.associations = {};

            assoc.map = function(idlist) {
                var freeItemMap = {};
                for (var i=0; i<assoc.itemCount; i++) freeItemMap[i]=1;
                $.each(idlist, function(idx, id) {
                    if (idx<assoc.itemCount) {
                        if (id in assoc.associations)
                            delete freeItemMap[id];
                    }
                });
                var freeItems=[];
                for (var i=0; i<assoc.itemCount; i++) {
                    if (freeItemMap[i]==1)
                        freeItems.push(i);
                };
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

        Module.setTextInterpolators = function(dct) {
            Module._textInterpolators = dct;
        };

        Module._useTextDecoration = function() {
            if(typeof __AXMTextDecoration === "undefined")
                return false;
            return __AXMTextDecoration;
        };

        Module.makeStartCapital = function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        /**
         * Interpolates a text string by replacing {_xxx_} tokens with snippets taken from Module._textInterpolators
         * For future use: translates the string using a translation table
         * @param {string} txt - Text to be translated and interpolated
         * @returns {string} - Result text
         * @private
         */
        _TRL = function(txt) {
            var reg = new RegExp(/{_.*?_}/g);
            var tokens = [];
            var match;
            while (match = reg.exec(txt))
                tokens.push(match[0]);
            $.each(tokens,function(idx, token) {
                if (token.length < 5)
                    Module.Test.reportBug('Invalid token: '+token);
                var tokenString = token.substring(2, token.length-2);
                var isCapital = (tokenString[0] != tokenString[0].toLowerCase());
                tokenString = tokenString.toLowerCase();
                var replacement = Module._textInterpolators[tokenString];
                if (!replacement) {
                    Module.Test.reportBug('Invalid token: '+token);
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


        Module.saveTextFile = function(data, fileName) {
            var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
            FileSaver(blob, fileName);
        };

        Module.isSuperUser = function() {
            return false;
        };

        return Module;
    });

