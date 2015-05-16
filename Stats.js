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
        "require", "jquery", "_"],
    function (
        require, $, _) {

        var Module = {};

        Module.NormDfEstimator = function(values) {
            var that = {};
            that.values = values;

            that.calcParametric = function() {
                if (values.length == 0)
                    return;
                var sum = 0;
                for (var i=0; i<values.length; i+= 1)
                    sum += values[i];
                var average = sum/values.length;
                that.average = average;

                var stdev = 0;
                for (var i=0; i<values.length; i+= 1)
                    stdev += Math.pow(values[i]-average, 2.0);
                stdev = Math.sqrt(stdev/values.length);
                that.stdev = stdev;
            };

            that.getCount = function() {
                return values.length;
            }

            that.getMean = function() {
                return that.average;
            };

            that.getStdev = function() {
                return that.stdev;
            };

            return that;
        };


        return Module;
    });

