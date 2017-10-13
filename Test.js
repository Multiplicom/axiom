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

        Module.reportBug = function(error) {
            //throw(msg);
            //alert(error);
            //debugger;
        };

        Module.checkDefined = function(obj, error) {
            if (!obj)
                Module.reportBug(error);
        };

        Module.checkIsString = function() {
            $.each(arguments, function(idx, obj) {
                if(!(typeof obj === 'string'))
                    Module.reportBug('Variable is not a string');
            });
        };

        Module.checkIsNumber = function() {
            $.each(arguments, function(idx, obj) {
                if(!(typeof obj === 'number'))
                    Module.reportBug('Variable is not a number');
            });
        };

        Module.checkIsType = function(obj, typeStr) {
            Module.checkDefined(obj, 'Undefined object of type ' + typeStr);
            if (!obj.__typeStrings)
                Module.reportBug('Variable is not an object. (expected '+typeStr+')');
            if (obj.__typeStrings.indexOf(typeStr)<0)
                Module.reportBug('Object is not of type '+typeStr);
        };


        return Module;
    });

