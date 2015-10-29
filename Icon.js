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

        Module.createEmpty = function() {
            var icon = AXMUtils.object('icon');
            icon.name = name;

            icon.renderHtml = function() {
                return '';
            };
            return icon;
        };

        Module.createFA = function(name) {
            var icon = AXMUtils.object('icon');
            icon.name = name;

            icon.renderHtml = function() {
                return '<i style="font-size:20px" class="fa {name}"/>'.AXMInterpolate({name:name});
            };

            return icon;
        };


        Module.createHeaderInfo = function(icon, title1, title2) {
            AXMUtils.Test.checkIsType(icon, 'icon');
            var headerInfo = AXMUtils.object('headerinfo');
            headerInfo.icon = icon;
            headerInfo.title1 = title1;
            headerInfo.title2 =  title2;

            headerInfo.getSingleTitle = function() {
                return headerInfo.title1+' '+headerInfo.title2;
            };

            return headerInfo;
        };


        return Module;
    });

