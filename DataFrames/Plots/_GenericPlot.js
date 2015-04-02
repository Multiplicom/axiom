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
        "AXM/AXMUtils",
        "AXM/DataFrames/DataTypes"
    ],
    function (
        require, $, _,
        AXMUtils,
        DataTypes
    ) {

        var Module = {};

        Module.plotAspect = function(aspectId, aspectName, dataType, isRequired) {
            return {
                getId: function() { return aspectId; },
                getName: function() { return aspectName; },
                getDataType: function() { return dataType; },
                getRequired: function() { return isRequired; }
            };
        };


        Module.createPlotType = function(id, name) {
            var plotType = {
                _plotTypeId: id,
                _plotTypeName: name,
                _aspects: []
            };


            plotType.getPlotTypeName = function() {
                return plotType._plotTypeName
            };

            plotType.addPlotAspect = function(aspectId, aspectName, dataType, isRequired) {
                plotType._aspects.push(Module.plotAspect(aspectId, aspectName, dataType, isRequired));
            };

            plotType.getPlotAspects = function() {
                return plotType._aspects;
            }



            return plotType;
        }


        return Module;
    });

