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
        "require", "jquery", "_", "AXM/Test", "AXM/AXMUtils"],
    function (
        require, $, _, Test, AXMUtils) {


        /**
         * Module encapsulating an RGB color class
         * @type {{}}
         */
        var Module = {
        };


        /**
         * Returns an rgb color class
         * @param {float} r - red value (range: 0-1)
         * @param {float} g - green value (range: 0-1)
         * @param {float} b - blue value (range: 0-1)
         * @param {float} a - opacity value (range: 0-1)
         * @returns {{}} - color class instance
         * @constructor
         */
        Module.Color = function (r, g, b, a) {
            var that = AXMUtils.object("@Color");
            that.r = (typeof r == 'undefined') ? 0 : r;
            that.g = (typeof g == 'undefined') ? 0 : g;
            that.b = (typeof b == 'undefined') ? 0 : b;
            that.a = (typeof a == 'undefined') ? 1 : a;
            that.f = 1.0;

            /**
             * Returns the red component
             * @returns {number}
             */
            that.getR = function () { return this.r / this.f; };
            /**
             * Returns the green component
             * @returns {number}
             */
            that.getG = function () { return this.g / this.f; };
            /**
             * Returns the blue component
             * @returns {number}
             */
            that.getB = function () { return this.b / this.f; };
            /**
             * Returns the opacity component
             * @returns {number}
             */
            that.getA = function () { return this.a / this.f; };

            /**
             * Returns a html string representing the color
             * @returns {string}
             */
            that.toString = function () {
                if (this.a > 0.999)
                    return 'rgb(' + Math.round(this.getR() * 255) + ',' + Math.round(this.getG() * 255) + ',' + Math.round(this.getB() * 255) + ')';
                else
                    return 'rgb(' + this.getR().toFixed(3) + ',' + this.getG().toFixed(3) + ',' + this.getB().toFixed(3) + ',' + this.getA().toFixed(3) + ')';
            };

            /**
             * Returns a html string representing the color, usable in a html5 canvas element
             * @returns {string}
             */
            that.toStringCanvas = function () {
                if (this.a > 0.999)
                    return 'rgb(' + Math.round(this.getR() * 255) + ',' + Math.round(this.getG() * 255) + ',' + Math.round(this.getB() * 255) + ')';
                else
                    return 'rgba(' + Math.round(this.getR() * 255) + ',' + Math.round(this.getG() * 255) + ',' + Math.round(this.getB() * 255) + ',' + this.getA().toFixed(3) + ')';
            };


            /**
             * Returns a color string using HEX notation
             * @returns {string}
             */
            that.toStringHEX = function () {

                function componentToHex(c) {
                    var hex = c.toString(16);
                    return hex.length == 1 ? "0" + hex : hex;
                }
                return "#" + componentToHex(Math.round(this.getR() * 255)) + componentToHex(Math.round(this.getG() * 255)) + componentToHex(Math.round(this.getB() * 255));
            };


            /**
             * Determines if the color is black
             * @returns {boolean}
             */
            that.isBlack = function() {
                return (that.r<1.0e-9) && (that.g<1.0e-9) && (that.b<1.0e-9);
            };

            /**
             * Returns a darkened version of the color, amount between 0 and 1
             * @param {float} amount
             * @returns {AXM.Color}
             */
            that.darken = function (amount) {
                var fc = 1.0 - amount;
                return Module.Color(fc * this.r, fc * this.g, fc * this.b, this.a);
            };

            /**
             * Returns a lightened version of the color, amount between 0 and 1
             * @param {float} amount
             * @returns {AXM.Color}
             */
            that.lighten = function (amount) {
                var fc = amount;
                return Module.Color((1 - fc) * this.r + fc, (1 - fc) * this.g + fc, (1 - fc) * this.b + fc, this.a);
            };

            that.deSaturate = function(amount) {
                var av = (this.r+this.g+this.b)/3.0;
                var fc = amount;
                return Module.Color((1 - fc) * this.r + fc*av, (1 - fc) * this.g + fc*av, (1 - fc) * this.b + fc*av, this.a);
            };

            /**
             * Returns a version of the color with a new opacity
             * @param {float} opacity
             * @returns {AXM.Color}
             */
            that.changeOpacity = function (opacity) {
                return Module.Color(this.getR(), this.getG(), this.getB(), opacity);
            };

            return that;
        };


        /**
         * Converts HSL to a color object
         * @param {float} h - hue (range: 0-1)
         * @param {float} s - saturation (range: 0-1)
         * @param {float} l - lightness (range: 0-1)
         * @returns {AXM.Color}
         * @constructor
         */
        Module.HSL2Color = function(h,s,l) {
            var r, g, b;
            if(s == 0){
                r = g = b = l; // achromatic
            }else{
                function hue2rgb(p, q, t){
                    if(t < 0) t += 1;
                    if(t > 1) t -= 1;
                    if(t < 1/6) return p + (q - p) * 6 * t;
                    if(t < 1/2) return q;
                    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                }
                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return Module.Color(r,g,b);
        };

        /**
         * converts a html color string to a Module.Color
         * @param {string} colorstring
         * @param {AXM.Color} faildefault - color to return in case conversion fails
         * @returns {AXM.Color}
         */
        Module.parseColorString = function (colorstring, faildefault) {
            try {
                var parts = colorstring.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                if ((parts) && (parts.length >= 2) && (parts[1].length > 0) && (parts[2].length > 0) && (parts[3].length > 0))
                    return Module.Color(parseFloat(parts[1]) / 255.0, parseFloat(parts[2]) / 255.0, parseFloat(parts[3]) / 255.0);
                if (typeof faildefault != 'undefined')
                    return faildefault;
                return Module.Color(0,0,0);
            }
            catch(err)
            {
                Test.reportBug('Invalid color string: '+colorstring);
            }
        };

        /**
         * Returns an rgb color class
         * @param {string} hex - color in hexadecimal notation
         * @param {float} opacity - opacity value (range: 0-1)
         */
        Module.parseHexString = function(hex, opacity) {
            var h = hex.replace('#', '');
            opacity = typeof opacity !== 'undefined' ? opacity : 1;
            h =  h.match(new RegExp('(.{'+h.length/3+'})', 'g'));

            for(var i=0; i<h.length; i++)
                h[i] = parseInt(h[i].length==1? h[i]+h[i]:h[i], 16);
            h.push(opacity);

            return Module.Color(h[0]/255, h[1]/255, h[2]/255.0, h[3]);
        };

        /**
         * A list of commonly used standard colors
         * @type {[AXM.Color]}
         */
        Module.standardColors = [
            Module.Color(0.2,0.2,1.0),
            Module.Color(1.0,0.3,0.3),
            Module.Color(0.2,0.7,0.4),
            Module.Color(0.9,0.5,0.0),
            Module.Color(0.0,0.8,0.0),
            Module.Color(0.8,0.2,0.8),
            Module.Color(0,0,0.7),
            Module.Color(0.7,0,0),
            Module.Color(0,0.5,0),
            Module.Color(0.5,0,0.5),
            Module.Color(0.3,0.4,0.5),
            Module.Color(0.5,0.5,0.8),
            Module.Color(0.8,0.5,0.5),
            Module.Color(0.7,0.6,0.4),
            Module.Color(0.4,0.7,0.4),
            Module.Color(0.3,0.3,0.5),
            Module.Color(0.5,0.3,0.3),
            Module.Color(0.5,0.4,0.2),
            Module.Color(0.2,0.4,0.2),
            Module.Color(0.5,0.3,0.5),
            Module.Color(0.3,0.5,0.5),
            Module.Color(0.6,0.6,0.7),
            Module.Color(0.7,0.6,0.6),
            Module.Color(0.7,0.7,0.5),
            Module.Color(0.7,0.5,0.7),
            Module.Color(0.5,0.7,0.7),
            Module.Color(0.5,0.6,0.5),
            Module.Color(0.6,0.6,0.6)
        ];



        return Module;
    });
