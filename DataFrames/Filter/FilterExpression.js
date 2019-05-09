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
        "FilterGrammar"
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
                console.log(err);
            }

            console.log(expr.parsed);

            /**
             * Evaluates a query across all fields for a single row.
             * @param row: the row to match against
             * @param query the query string
             * @return {Boolean|boolean|*}: `true` iff any of the field values matches the query (case-insensitive)
             */
            expr.evaluateGlobalQuery = function(row, query) {
                var queryLowerCase = query.toLowerCase();
                return _.some(row, function(val, _) {
                    if (val === null || val === undefined)
                        return false;
                    if (!(val instanceof String))
                        val = val.toString()
                    return val.toLowerCase().includes(queryLowerCase);
                });
            };

            /**
             * Evaluates a field condition against a field
             * @param field
             * @param condition
             * @return {Boolean}: `true` iff the field matches the field condition
             */
            expr.evaluateCondition = function(field, condition) {
                if (field === null || field === undefined)
                    return false;

                switch (condition.op) {
                    case 'GT': return field > condition.value;
                    case 'GTE': return field >= condition.value;
                    case 'LT': return field < condition.value;
                    case 'LTE': return field <= condition.value;
                    // no type coercion! value should be parsed already to the correct type
                    case 'EQ': return field === condition.value;
                    case 'LIKE': return field.toString().toLowerCase().includes(condition.value.toLowerCase());
                    case 'BETWEEN': return field >= condition.low && field <= condition.high;
                    default: return false;
                }
            };

            /**
             * Evaluate the expression on a single row.
             * @param row: object with keys and values corresponding to the columns and row values, respectively
             * @return bool: whether the expression evaluated to true or false
             */
            expr.evaluate = function(row) {
                // if no valid expression, no row matches
                if (!expr.parsed)
                    return false;

                // empty strings
                if (expr.parsed.type === 'empty')
                    return true;

                if (expr.parsed.type === 'globalQuery')
                    return expr.evaluateGlobalQuery(row, expr.parsed.value);

                // is the expression a set of conditions on fields? then require all conditions == true
                if (expr.parsed.type === 'fieldConditions')
                    return _.all(expr.parsed.conditions, function(cond) {
                        return expr.evaluateCondition(row[cond.field], cond)
                    });

                return false;
            };

            return expr;

        };

        return Module;
    });

