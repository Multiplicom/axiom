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
        "require", "jquery", "_", "AXM/Test"],
    function (
        require, $, _, Test) {

        var Module = {
        };

        Module.Color = function (r, g, b, a) {
            var that = {};
            that.r = (typeof r == 'undefined') ? 0 : r;
            that.g = (typeof g == 'undefined') ? 0 : g;
            that.b = (typeof b == 'undefined') ? 0 : b;
            that.a = (typeof a == 'undefined') ? 1 : a;
            that.f = 1.0;

            that.getR = function () { return this.r / this.f; }
            that.getG = function () { return this.g / this.f; }
            that.getB = function () { return this.b / this.f; }
            that.getA = function () { return this.a / this.f; }

            that.toString = function () {
                if (this.a > 0.999)
                    return 'rgb(' + Math.round(this.getR() * 255) + ',' + Math.round(this.getG() * 255) + ',' + Math.round(this.getB() * 255) + ')';
                else
                    return 'rgb(' + this.getR().toFixed(3) + ',' + this.getG().toFixed(3) + ',' + this.getB().toFixed(3) + ',' + this.getA().toFixed(3) + ')';
            }
            that.toStringCanvas = function () {
                if (this.a > 0.999)
                    return 'rgb(' + Math.round(this.getR() * 255) + ',' + Math.round(this.getG() * 255) + ',' + Math.round(this.getB() * 255) + ')';
                else
                    return 'rgba(' + Math.round(this.getR() * 255) + ',' + Math.round(this.getG() * 255) + ',' + Math.round(this.getB() * 255) + ',' + this.getA().toFixed(3) + ')';
            }

            that.toStringHEX = function () {
                return (Math.round(this.getR() * 255)).toString(16) + (Math.round(this.getG() * 255)).toString(16) + (Math.round(this.getB() * 255)).toString(16);
            }

            that.isBlack = function() {
                return (that.r<1.0e-9) && (that.g<1.0e-9) && (that.b<1.0e-9);
            }

            //Returns a darkened version of the color, amount between 0 and 1
            that.darken = function (amount) {
                var fc = 1.0 - amount;
                return DQX.Color(fc * this.r, fc * this.g, fc * this.b, this.a);
            }

            //Returns a lightened version of the color, amount between 0 and 1
            that.lighten = function (amount) {
                var fc = amount;
                return DQX.Color((1 - fc) * this.r + fc, (1 - fc) * this.g + fc, (1 - fc) * this.b + fc, this.a);
            }

            that.changeOpacity = function (opacity) {
                return DQX.Color(this.getR(), this.getG(), this.getB(), opacity);
            }

            return that;
        }

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
            return DQX.Color(r,g,b);
        }

        //converts a html color string to a DQX.Color
        Module.parseColorString = function (colorstring, faildefault) {
            try {
                var parts = colorstring.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                if ((parts) && (parts.length >= 2) && (parts[1].length > 0) && (parts[2].length > 0) && (parts[3].length > 0))
                    return DQX.Color(parseFloat(parts[1]) / 255.0, parseFloat(parts[2]) / 255.0, parseFloat(parts[3]) / 255.0);
                if (typeof faildefault != 'undefined')
                    return faildefault;
                return DQX.Color(0,0,0);
            }
            catch(err)
            {
                Test.reportBug('Invalid color string: '+colorstring);
            }
        }


        return Module;
    });

