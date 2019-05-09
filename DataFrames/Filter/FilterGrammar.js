// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "main", "symbols": ["_"], "postprocess": function(d) { return { type: 'empty' } }},
    {"name": "main", "symbols": ["_", "conditions", "_"], "postprocess": function(d) { return { type: 'fieldConditions', conditions: d[1] } }},
    {"name": "main", "symbols": ["_", "anyVal", "_"], "postprocess": function(d) { return { type: 'globalQuery', value: d[1] } }},
    {"name": "conditions", "symbols": ["condition", "_", "AND", "_", "conditions"], "postprocess": function(d) { return [d[0]].concat(d[4]) }},
    {"name": "conditions", "symbols": ["condition"], "postprocess": id},
    {"name": "condition", "symbols": ["field", "_", "NUMCOMP", "_", "num"], "postprocess": function(d) { return { field: d[0], op: d[2], value: d[4] } }},
    {"name": "condition", "symbols": ["field", "_", "BETWEEN", "_", "num", "_", "AND", "_", "num"], "postprocess": function(d) { return { field: d[0], op: 'BETWEEN', low: d[4], high: d[8] } }},
    {"name": "condition", "symbols": ["field", "_", "STRCOMP", "_", "str"], "postprocess": function(d) { return { field: d[0], op: d[2], value: d[4] } }},
    {"name": "STRCOMP", "symbols": ["EQ"], "postprocess": function(d) { return 'EQ' }},
    {"name": "STRCOMP", "symbols": ["LIKE"], "postprocess": function(d) { return 'LIKE' }},
    {"name": "NUMCOMP", "symbols": ["GT"], "postprocess": function(d) { return 'GT' }},
    {"name": "NUMCOMP", "symbols": ["GTE"], "postprocess": function(d) { return 'GTE' }},
    {"name": "NUMCOMP", "symbols": ["LT"], "postprocess": function(d) { return 'LT' }},
    {"name": "NUMCOMP", "symbols": ["LTE"], "postprocess": function(d) { return 'LTE' }},
    {"name": "NUMCOMP", "symbols": ["EQ"], "postprocess": function(d) { return 'EQ' }},
    {"name": "EQ$string$1", "symbols": [{"literal":"="}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "EQ", "symbols": ["EQ$string$1"]},
    {"name": "EQ", "symbols": [{"literal":"="}]},
    {"name": "EQ$string$2", "symbols": [{"literal":"i"}, {"literal":"s"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "EQ", "symbols": ["EQ$string$2"]},
    {"name": "LIKE", "symbols": [{"literal":"~"}]},
    {"name": "GT", "symbols": [{"literal":">"}]},
    {"name": "GTE$string$1", "symbols": [{"literal":">"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "GTE", "symbols": ["GTE$string$1"]},
    {"name": "GTE$string$2", "symbols": [{"literal":"="}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "GTE", "symbols": ["GTE$string$2"]},
    {"name": "LT", "symbols": [{"literal":"<"}]},
    {"name": "LTE$string$1", "symbols": [{"literal":"<"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "LTE", "symbols": ["LTE$string$1"]},
    {"name": "LTE$string$2", "symbols": [{"literal":"="}, {"literal":"<"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "LTE", "symbols": ["LTE$string$2"]},
    {"name": "AND$string$1", "symbols": [{"literal":"A"}, {"literal":"N"}, {"literal":"D"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "AND", "symbols": ["AND$string$1"]},
    {"name": "AND$string$2", "symbols": [{"literal":"a"}, {"literal":"n"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "AND", "symbols": ["AND$string$2"]},
    {"name": "BETWEEN$string$1", "symbols": [{"literal":"B"}, {"literal":"E"}, {"literal":"T"}, {"literal":"W"}, {"literal":"E"}, {"literal":"E"}, {"literal":"N"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "BETWEEN", "symbols": ["BETWEEN$string$1"]},
    {"name": "BETWEEN$string$2", "symbols": [{"literal":"b"}, {"literal":"e"}, {"literal":"t"}, {"literal":"w"}, {"literal":"e"}, {"literal":"e"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "BETWEEN", "symbols": ["BETWEEN$string$2"]},
    {"name": "field$ebnf$1", "symbols": [/[\w]/]},
    {"name": "field$ebnf$1", "symbols": ["field$ebnf$1", /[\w]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "field", "symbols": ["field$ebnf$1"], "postprocess": function(d) { return d[0].join('') }},
    {"name": "num$ebnf$1", "symbols": [/[\d\.]/]},
    {"name": "num$ebnf$1", "symbols": ["num$ebnf$1", /[\d\.]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "num", "symbols": ["num$ebnf$1"], "postprocess": function(d) { return parseFloat(d[0].join('')) }},
    {"name": "str$ebnf$1", "symbols": [/[\w]/]},
    {"name": "str$ebnf$1", "symbols": ["str$ebnf$1", /[\w]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "str", "symbols": [{"literal":"\""}, "str$ebnf$1", {"literal":"\""}], "postprocess": function(d) { return d[1].join('') }},
    {"name": "str$ebnf$2", "symbols": [/[\w]/]},
    {"name": "str$ebnf$2", "symbols": ["str$ebnf$2", /[\w]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "str", "symbols": [{"literal":"'"}, "str$ebnf$2", {"literal":"'"}], "postprocess": function(d) { return d[1].join('') }},
    {"name": "anyVal$ebnf$1", "symbols": [/[^\s]/]},
    {"name": "anyVal$ebnf$1", "symbols": ["anyVal$ebnf$1", /[^\s]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "anyVal", "symbols": ["anyVal$ebnf$1"], "postprocess": function(d) { return d[0].join('') }},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[\s]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) { return null }}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
