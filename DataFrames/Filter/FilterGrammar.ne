# Context-free grammar for DataFrame filter expressions using the Nearley parser (https://nearley.js.org/)
# This is the source version.
# It contains the grammar production rules on the left,
# and postprocessing rules (JS) on the right, to transform the matched expression to a semantic JS structure.


# To use, first compile to .js:
#   $ npm install -g nearley
#   $ nearleyc FilterGrammar.ne -o FilterGrammar.js
# `require` the resulting FilterGrammar.js.

# entrypoint: a filter expression can be either
# - empty (whitespace)
# - a set of field conditions
# - or a single filter value (that is matched against all fields)
main -> _                                   {% function(d) { return { type: 'empty' } } %}
    | _ conditions _						{% function(d) { return { type: 'fieldConditions', conditions: d[1] } } %}
	| _ anyVal _							{% function(d) { return { type: 'globalQuery', value: d[1] } } %}

# expansion of the conditions: one or more single condition expressions
conditions -> condition _ AND _ conditions  {% function(d) { return [d[0]].concat(d[4]) } %}
	| condition								{% id %}

# a single condition can be
# - a numerical comparison:
#    field > 1
# - a range intersection:
#    field between 1 and 2
# - a string comparison:
#    field = 'abc'
#    field ~ 'val1|val2'
condition -> field _ NUMCOMP _ num			{% function(d) { return { field: d[0], op: d[2], value: d[4] } } %}
	| field _ BETWEEN _ num _ AND _ num   	{% function(d) { return { field: d[0], op: 'BETWEEN', low: d[4], high: d[8] } } %}
	| field _ STRCOMP _ str					{% function(d) { return { field: d[0], op: d[2], value: d[4] } } %}

# string comparison operators
STRCOMP -> EQ 								{% function(d) { return 'EQ' } %}
	| LIKE									{% function(d) { return 'LIKE' } %}

# numerical comparison operators
NUMCOMP -> GT								{% function(d) { return 'GT' } %}
	| GTE									{% function(d) { return 'GTE' } %}
	| LT									{% function(d) { return 'LT' } %}
	| LTE									{% function(d) { return 'LTE' } %}
	| EQ									{% function(d) { return 'EQ' } %}

EQ -> "==" | "=" | "is"
LIKE -> "~"
GT -> ">"
GTE -> ">=" | "=>"
LT -> "<"
LTE -> "<=" | "=<"
AND -> "AND" | "and"
BETWEEN -> "BETWEEN" | "between"

field -> [\w]:+								{% function(d) { return d[0].join('') } %}
num -> [\d\.]:+								{% function(d) { return parseFloat(d[0].join('')) } %}
str -> "\"" [\w]:+ "\""						{% function(d) { return d[1].join('') } %}
	| "'" [\w]:+ "'"						{% function(d) { return d[1].join('') } %}
anyVal -> [^\s]:+ 							{% function(d) { return d[0].join('') } %}

# whitespace
_ -> [\s]:* 								{% function(d) { return null } %}
