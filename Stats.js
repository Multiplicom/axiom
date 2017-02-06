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
        "AXM/AXMUtils"],
    function (
        require, $, _,
        AXMUtils) {

        var Module = {};


        /**
         * Estimates the parameters of a normal distribution from a set of observations
         * @param [float] values - list of observations
         * @returns {{}} - Normal df class instance
         * @constructor
         */
        Module.NormDfEstimator = function(values) {

            /**
             * Object instance
             * @type {{}}
             */
            var that = {};
            that.values = values;
            that.sortedValues = null;

            /**
             * Returns values sorted
             */
            that.getSortedValues = function(){
                if(!that.sortedValues){
                    that.sortedValues = that.values.slice();
                    that.sortedValues = that.sortedValues.sort(function(a, b){return a - b;});
                }
                return that.sortedValues;
            };

            /**
             * Parametric estimation of average and standard deviation
             */
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

            /**
             * Returns number of values
             * @returns {int}
             */
            that.getCount = function() {
                return values.length;
            };

            /**
             * Returns distribution average
             * @returns {float}
             */
            that.getMean = function() {
                return that.average;
            };

            /**
             * Returns distribution standard deviation
             * @returns {float}
             */
            that.getStdev = function() {
                return that.stdev;
            };

            /**
             * Returns distribution median
             * @returns {float}
             */
            that.getMedian = function() {
                var sortedValues = that.getSortedValues();
                var half = Math.floor(sortedValues.length/2);
                if(sortedValues.length % 2)
                    return sortedValues[half];
                else
                    return (sortedValues[half-1] + sortedValues[half]) / 2.0;
            };

            /**
             * Returns distribution minimum
             * @returns {float}
             */
            that.getMinimum = function() {
                return that.getSortedValues()[0];
            };

            /**
             * Returns distribution maximum
             * @returns {float}
             */
            that.getMaximum = function() {
                return that.getSortedValues()[that.getCount() - 1];
            };

            /**
             * Get the percentile value for a given percentile in the sorted list
             * @param p - percentile
             * @returns {float}
             */
            that.getPercentile = function(p) {
                if(p < 0 || p > 1.0){
                    AXMUtils.Test.reportBug("p is not a percentile: " + p);
                }
                return that.getSortedValues()[Math.round(that.getCount() * p)];
            };

            return that;
        };

        /**
         * Selects rows from the passed lists that contain valid floating point values and omits
         * null or NaN values. Does not test for strings.
         * @param {[]} dataX: list of floats
         * @param {[]} dataY: list of floats
         * @returns {*[]}: array of 2 elements: sublist of dataX, sublist of dataY.
         */
        Module._selectValidValues = function(dataX, dataY){
            var valuesX = [];
            var valuesY = [];
            for (var rowNr = 0; rowNr < dataX.length; rowNr++) {
                var valX = dataX[rowNr];
                var valY = dataY[rowNr];
                if (valX !== null && !(isNaN(valX)) && valY !== null && !(isNaN(valY))) {
                    valuesX.push(valX);
                    valuesY.push(valY);
                }
            }
            return [valuesX, valuesY]
        };

        /**
         * Calculates the pearson correlation coefficient for a set of data points.
         * @param {[]} dataX - list of floats
         * @param {[]} dataY - list of floats
         * @returns {float} - correlation coefficient or NaN if unable to calculate
         */
        Module.correlationCoefficient = function(dataX, dataY) {
            var correlation = Number.NaN;
            var dataXY = Module._selectValidValues(dataX, dataY);
            var valuesX = dataXY[0];
            var valuesY = dataXY[1];

            if (valuesX.length > 1) {
                var dfX = Module.NormDfEstimator(valuesX);
                dfX.calcParametric();
                var dfY = Module.NormDfEstimator(valuesY);
                dfY.calcParametric();
                var covariance = 0;
                for (var rowNr = 0; rowNr < dfX.getCount(); rowNr++){
                    covariance += (valuesX[rowNr] - dfX.getMean()) * (valuesY[rowNr] - dfY.getMean());
                }
                covariance = covariance / (dfX.getCount());
                correlation = covariance / (dfX.getStdev() * dfY.getStdev());
            }

            return correlation;
        };


        /**
         * Calculates slope and intercept of linear fit through a set of data points.
         * @param {[]} dataX - list of floats
         * @param {[]} dataY - list of floats
         * @returns {[]} - [slope, intercept] or [NaN, NaN] if not able to calculate
         */
        Module.slopeIntercept = function(dataX, dataY) {
            var slope = Number.NaN;
            var intercept = Number.NaN;
            var correlation = Module.correlationCoefficient(dataX, dataY);
            if (!isNaN(correlation)){
                var dataXY = Module._selectValidValues(dataX, dataY);
                var valuesX = dataXY[0];
                var valuesY = dataXY[1];

                if (valuesX.length > 1) {
                    var dfX = Module.NormDfEstimator(valuesX);
                    dfX.calcParametric();
                    var dfY = Module.NormDfEstimator(valuesY);
                    dfY.calcParametric();
                    if (dfX.getStdev() != 0){
                        slope = correlation * dfY.getStdev() / dfX.getStdev();
                        intercept = dfY.getMean() - slope * dfX.getMean();
                    }
                }
            }
            return [slope, intercept];
        };

        return Module;
    });

