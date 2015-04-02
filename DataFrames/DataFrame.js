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
        "require", "jquery", "_", "AXM/AXMUtils",
        "AXM/DataFrames/DataTypes",
        "AXM/DataFrames/PromptPlot"
    ],
    function (
        require, $, _, AXMUtils,
        DataTypes,
        PromptPlot
    ) {

        var Module = {};

        Module.DataTypes = DataTypes;

        Module._objectTypes = {};

        Module.createObjectType = function(typeId, primKey) {
            if (Module._objectTypes[typeId])
                AXMUtils.Test.reportBug('Dataframe object type already exists: '+typeId);
            var objectType = {
                typeId: typeId,
                primKey: primKey
            };
            Module._objectTypes[typeId] = objectType;
            return objectType;
        };


        Module.property = function(propId, propDispName, propType, settings) {
            var property = {
                _propId: propId,
                _propDispName: propDispName,
                _propType: propType,
                data: []
            };
            property.getId = function() {
                return property._propId;
            };
            property.getDispName = function() {
                return property._propDispName;
            };
            property.getDataType = function() {
                return property._propType
            };
            return property;
        };

        // Create a new data frame
        Module.createDataFrame = function(objectTypeId) {
            var dataFrame = {};
            dataFrame.objectType = Module._objectTypes[objectTypeId];
            if (!dataFrame.objectType)
                AXMUtils.Test.reportBug('Invalid datafrom objecttype: ' + objectTypeId);
            dataFrame._rowCount = 0;
            dataFrame._properties = [];
            dataFrame._mapProperties = {};

            dataFrame.addProperty = function(propId, propDispName, propType, settings) {
                var propInfo = Module.property(propId, propDispName, propType, settings)
                if (dataFrame._mapProperties[propId])
                    AXMUtils.Test.reportBug('Duplicate dataframe property id: '+propId);
                dataFrame._properties.push(propInfo);
                for (var i=0; i<dataFrame._rowCount; i++)
                    propInfo.data.push(null);
                dataFrame._mapProperties[propId] = propInfo;
            };

            dataFrame.getProperties = function() {
                return dataFrame._properties;
            };

            dataFrame.addRow = function(rowInfo) {
                dataFrame._rowCount += 1;
                $.each(dataFrame._properties, function(idx, prop) {
                    var cell = rowInfo[prop.propId];
                    if (!cell)
                        cell = null;
                    prop.data.push(cell)
                });
            };

            dataFrame.promptPlot = function() {
                PromptPlot.create(dataFrame);
            };

            return dataFrame;
        };

        return Module;
    });

