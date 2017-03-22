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
            return Module.createFA("")
        };

        Module.createFA = function(name, baseSizeFactor) {
            var icon = AXMUtils.object('icon');
            icon._name = name;
            icon._baseSize = 20;
            icon._opacity = 1;
            if (baseSizeFactor)
                icon._baseSize *= baseSizeFactor;
            icon._sizeFactor = 1;
            icon._decorators = [];

            icon.addDecorator = function(name, xPos, offsetX, yPos, offsetY, size, opacity, color) {
                if (opacity === undefined)
                    opacity = 1;
                if (['left', 'right'].indexOf(xPos)<0)
                    AXMUtils.Test.reportBug("Decorator x position should be 'left' or 'right'");
                if (['top', 'bottom'].indexOf(yPos)<0)
                    AXMUtils.Test.reportBug("Decorator y position should be 'top' or 'bottom'");
                icon._decorators.push({
                    name: name,
                    xPos: xPos,
                    yPos: yPos,
                    offsetX: offsetX,
                    offsetY: offsetY,
                    size: size,
                    opacity: opacity,
                    color: color
                });
                return icon;
            };

            icon.setOpacity = function(opac) {
                icon._opacity = opac;
                return icon;
            };

            icon.clone = function() {
                var dupl = Module.createFA(icon._name);
                dupl._opacity = icon._opacity;
                dupl._baseSize = icon._baseSize;
                dupl._sizeFactor =icon._sizeFactor;
                dupl._decorators = JSON.parse(JSON.stringify(icon._decorators));
                return dupl;
            };

            icon.setSize = function(newSize) {
                icon._sizeFactor = newSize;
                return icon;
            };

            icon.changeSize = function(sizeFactor) {
                icon._sizeFactor *= sizeFactor;
                return icon;
            };

            icon.renderHtml = function() {
                var str = '<div style="position:relative;display:inline-block;overflow:visible">';
                str +=  '<i style="font-size:{size}px;opacity:{opac}" class="fa {name}"/>'.AXMInterpolate({
                    name:icon._name,
                    opac:icon._opacity,
                    size:Math.round(icon._sizeFactor*icon._baseSize)
                });

                $.each(icon._decorators, function(idx, decor) {
                    var substr =  '<div style="position:absolute;{xpos}:{left}px;{ypos}:{top}px;opacity:{opacity};color:{color};overflow:visible"><i style="font-size:{size}px" class="fa {name}"/></div>'.AXMInterpolate({
                        name:decor.name,
                        xpos: decor.xPos,
                        ypos: decor.yPos,
                        left: Math.round(decor.offsetX*icon._sizeFactor),
                        top: Math.round(decor.offsetY*icon._sizeFactor),
                        size:Math.round(icon._sizeFactor*icon._baseSize*decor.size),
                        opacity: decor.opacity,
                        color: decor.color
                    });
                    str += substr;
                });
                str += "</div>";

                return str;
            };

            icon.getSize = function() {
                return icon._size;
            };

            return icon;
        };


        Module.createBitmap = function(name, baseSizeFactor) {
            var icon = AXMUtils.object('icon');
            icon._name = name;
            icon._baseSize = 20;
            if (baseSizeFactor)
                icon._baseSize *= baseSizeFactor;
            icon._sizeFactor = 1;


            icon.clone = function() {
                var dupl = Module.createBitmap(icon._name);
                dupl._baseSize = icon._baseSize;
                dupl._sizeFactor =icon._sizeFactor;
                return dupl;
            };

            icon.setSize = function(newSize) {
                icon._sizeFactor = newSize;
                return icon;
            };

            icon.changeSize = function(sizeFactor) {
                icon._sizeFactor *= sizeFactor;
                return icon;
            };

            icon.renderHtml = function() {
                var str = '<div style="position:relative">';
                str += '<img src="{file}" alt=""/>'.AXMInterpolate({
                    file: icon._name
                });
                str += "</div>";

                return str;
            };

            icon.getSize = function() {
                return icon._size;
            };

            return icon;
        };


        Module.createHeaderInfo = function(icon, title1, title2, settings) {
            AXMUtils.Test.checkIsType(icon, 'icon');
            var headerInfo = AXMUtils.object('headerinfo');
            headerInfo.icon = icon;
            headerInfo.title1 = title1;
            headerInfo.title2 =  title2;
            if (!settings)
                settings = {};
            headerInfo.showTitle = settings.showTitle!==false;
            headerInfo.label = settings.label || '';
            headerInfo.labelClass = settings.labelClass || '';
            headerInfo.labelDoc = settings.labelDoc || '';

            headerInfo.getSingleTitle = function() {
                return headerInfo.title1+' '+headerInfo.title2;
            };

            headerInfo.getIcon = function() {
                return headerInfo.icon;
            };

            return headerInfo;
        };


        return Module;
    });

