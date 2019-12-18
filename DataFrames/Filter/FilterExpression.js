//Copyright (c) 2019 Multiplicom NV
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
        "require", "jquery", "_", "nearley",
        "AXM/AXMUtils",
        "./FilterGrammar"
    ],
    function (
        require, $, _, nearley,
        AXMUtils,
        FilterGrammar
    ) {

        var Module = {};

        Module.grammar = nearley.Grammar.fromCompiled(FilterGrammar);

        Module.create = function(str) {

            var expr = {};
            var parser = new nearley.Parser(Module.grammar);

            expr.parsed = null;

            try {
                parser.feed(str);
                if (parser.results.length === 1) {
                    expr.parsed = parser.results[0];
                }
            } catch (err) {
                console.log("Invalid filter expression. Parser returned error:");
                console.log(err);
            }

            expr.isValid = function() {
                return !!expr.parsed;
            };

            /**
             * Evaluates a query across all properties of a data frame.
             * A row matches the query if any of its properties contains the query string (case-insensitive)
             * @param dataFrameProps: data frame properties
             * @param query the query string
             * @return Array[int]: indices of rows matching the query.
             */
            expr.evaluateGlobalQuery = function(dataFrameProps, query) {
                var nRows = dataFrameProps[0].data.length;
                var queryLowerCase = query.toLowerCase();

                // we'll evaluate the query column-by-column.

                // the rows we still need to evaluate in the next col iteration
                // (all other rows already pass based on a previous col)
                var rowsToEvaluate = _.range(nRows);

                // rows already marked as passing
                var rowsPassing = [];

                _.each(dataFrameProps, function(prop) {
                    // evaluate a single property (column)
                    // only evaluate rows that are not passing yet
                    var rowsPassingProp = _.filter(rowsToEvaluate, function(rowIdx) {
                        var val = prop.data[rowIdx];
                        if (val === null || val === undefined)
                            return false;
                        if (!(val instanceof String))
                            val = val.toString();
                        return val.toLowerCase().includes(queryLowerCase);
                    });

                    // remove the newly passing rows from the evaluation list,
                    rowsToEvaluate = _.difference(rowsToEvaluate, rowsPassingProp);
                    rowsPassing = rowsPassing.concat(rowsPassingProp);
                });

                return rowsPassing;
            };

            /**
             * Generates a function that evaluates a property condition for a single row.
             * @param condition: the condition for which to generate an evaluator
             * @return function: the evaluator function,
             *      which accepts a single parameter (the value to evaluate the condition against)
             *      and returns whether that value passes the condition.
             */
            expr.conditionEvaluator = function(condition) {
                switch (condition.op) {
                    case 'GT': return function(v) { return v !== null && v !== undefined && v > condition.value; };
                    case 'GTE': return function(v) { return v !== null && v !== undefined && v >= condition.value; };
                    case 'LT': return function(v) { return v !== null && v !== undefined && v < condition.value; };
                    case 'LTE': return function(v) { return v !== null && v !== undefined && v <= condition.value; };
                    // no type coercion! value should be parsed already to the correct type
                    case 'EQ': return function(v) { return v === condition.value; };
                    case 'LIKE':
                        var lowerCaseValue = condition.value.toLowerCase();
                        return function(v) { return v !== null && v !== undefined && (v.toLowerCase ? v.toLowerCase() : v.toString().toLowerCase()).includes(lowerCaseValue) };
                    case 'BETWEEN': return function(v) { return v !== null && v !== undefined && v >= condition.low && v <= condition.high; };
                    default: return function(v) { return false; };
                }
            };

            /**
             * Evaluates a set of single property conditions against the rows of a data frame.
             * @param dataFrameProps properties of the data frame
             * @param conditions
             * @return Array[int]: indices of data frame rows satisfying all property conditions.
             */
            expr.evaluatePropertyConditions = function(dataFrameProps, conditions) {

                var nRows = dataFrameProps[0].data.length;

                // we'll evaluate the query condition-by-condition.
                // rowsLeft == the rows we still need to evaluate in the next condition
                // (those that already match all previous conditions)
                var rowsLeft = _.range(nRows);

                _.each(conditions, function(condition) {
                    var evaluator = expr.conditionEvaluator(condition);
                    var property = _.find(dataFrameProps, function(prop) { return prop.getId() === condition.property; });
                    // if the property doesn't exist, no rows match
                    if (property === undefined)
                        rowsLeft = [];
                    else
                        rowsLeft = _.filter(rowsLeft, function(rowIdx) { return evaluator(property.data[rowIdx]); });
                });

                return rowsLeft;
            };

            /**
             * Evaluate the expression on a data frame.
             * @param dataFrameProps: the data frame properties
             * @return Array[int]: indices of data frame rows matching the expression
             */
            expr.evaluate = function(dataFrameProps) {
                var nRows = dataFrameProps[0].data.length;

                // invalid expression: nothing matches
                if (!expr.isValid())
                    return [];

                // empty expression (whitespace): everything matches
                if (expr.parsed.type === 'empty')
                    return _.range(nRows);

                // query across all fields
                if (expr.parsed.type === 'globalQuery')
                    return expr.evaluateGlobalQuery(dataFrameProps, expr.parsed.value);

                // is the expression a set of conditions on fields? then require all conditions == true
                if (expr.parsed.type === 'propertyConditions')
                    return expr.evaluatePropertyConditions(dataFrameProps, expr.parsed.conditions);

                // any other case
                return [];
            };

            return expr;

        };

        return Module;
    });

