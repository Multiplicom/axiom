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
        "AXM/AXMUtils"
    ],
    function (
        require, $, _,
        AXMUtils
    ) {

        var Module = {};

        Module.typeGeneric = function(id) {
            var tpe = {
                id: id,
                isString: function() {return false; },
                isCategorical: function() {return false; },
                parseString: function(str) {return str; },
                getName: function() {return 'GenericType'; }
            };
            tpe.getId = function() {return tpe.id; };
            return tpe;
        };


        Module.typeString = Module.typeGeneric('typeString');
        Module.typeString.includes = function(otherType) {
            return otherType.id == 'typeString';
        };
        Module.typeString.isString = function() {return true; };
        Module.typeString.isCategorical = function() {return true; };
        Module.typeString.getName = function() {return 'Text'; };


        Module.typeBoolean = Module.typeGeneric('typeBoolean');
        Module.typeBoolean.includes = function(otherType) {
            return otherType.id == 'typeBoolean';
        };
        Module.typeBoolean.isCategorical = function() {return true; };
        Module.typeBoolean.parseString = function(str) {
            return str.toLowerCase() === 'true';
        };
        Module.typeBoolean.getName = function() {return 'Boolean'; };


        Module.typeFloat = Module.typeGeneric('typeFloat');
        Module.typeFloat.includes = function(otherType) {
            return otherType.id == 'typeFloat';
        };
        Module.typeFloat.parseString = function(str) {return parseFloat(str); };
        Module.typeFloat.getName = function() {return 'Value'; };


        Module.typeAny = Module.typeGeneric('typeAny');
        Module.typeAny.includes = function(otherType) {
            return true;
        };

        Module.typeAnyCategorical = Module.typeGeneric('typeAnyCategorical');
        Module.typeAnyCategorical.includes = function(otherType) {
            return otherType.isCategorical();
        };

        Module.typesMap = {
            typeFloat: Module.typeFloat,
            typeString: Module.typeString,
            typeBoolean: Module.typeBoolean
        }


        return Module;
    });

