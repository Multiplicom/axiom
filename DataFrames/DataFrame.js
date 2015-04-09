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
        "require", "jquery", "_",  "blob", "filesaver",
        "AXM/AXMUtils", "AXM/Color", "AXM/Msg", "AXM/Controls/Controls", "AXM/Panels/Frame", "AXM/Windows/PopupWindow", "AXM/Panels/PanelHtml",
        "AXM/DataFrames/DataTypes",
        "AXM/DataFrames/PromptPlot"
    ],
    function (
        require, $, _, Blob, FileSaver,
        AXMUtils, Color, Msg, Controls, Frame, PopupWindow, PanelHtml,
        DataTypes,
        PromptPlot
    ) {

        var Module = {};

        Module.DataTypes = DataTypes;

        Module._objectTypes = {};



        Module.valueRange = function(minValue, maxValue) {
            var range = AXMUtils.object('@ValueRange');
            range._minValue = minValue;
            range._maxValue = maxValue;
            range.getMin = function() { return range._minValue; };
            range.getMax = function() { return range._maxValue; };
            range.extendFraction = function(fr) {
                var ext = (range._maxValue - range._minValue) * fr/2;
                range._minValue -= ext;
                range._maxValue += ext;
            };
            return range;
        };




        Module.property = function(propId, propDispName, propType, settings) {
            var property = {
                _propId: propId,
                _propDispName: propDispName,
                _propType: propType,
                data: []
            };

            property._isCategorical = propType.isCategorical();
            if (property._isCategorical)
                property._category2ColorMapper = AXMUtils.PersistentAssociator(Color.standardColors.length);

            property.clone = function() {
                var prop = Module.property(property._propId, property._propDispName, property._propType, {});
                return prop;
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

            property.addValue = function(str) {
                if (!str)
                    property.data.push(null);
                else {
                    var dataType = property.getDataType();
                    property.data.push(dataType.parseString(str));
                }
            };

            property.getValueRange = function() {
                if (!property.getDataType().includes(DataTypes.typeFloat))
                    AXMUtils.Test.reportBug('Property is not numerical');
                var minValue = +1.0E99;
                var maxValue = -1.0E99;
                var data=property.data;
                for (var rowNr = 0; rowNr<data.length; rowNr++) {
                    var val = data[rowNr];
                    if (val!==null) {
                        if (val<minValue) minValue = val;
                        if (val>maxValue) maxValue = val;
                    }
                }
                return Module.valueRange(minValue, maxValue);
            };

            // Returns a color legend
            property.mapColors = function(valList) {
                var colorLegend = [];
                if (property._isCategorical) {
                    var uniqueCatMap = {};
                    var uniqueCats = [];
                    for (var i = 0; i < valList.length; i++) {
                        if (!uniqueCatMap[valList[i]]) {
                            uniqueCatMap[valList[i]] = true;
                            uniqueCats.push(valList[i]);
                        }
                    }
                    if (uniqueCats.length>25) //can't do anything good here...
                        return colorLegend;
                    property._category2ColorMapper.map(uniqueCats);
                    $.each(uniqueCats, function(idx, catStr) {
                        colorLegend.push({
                            content: property.content2DisplayString(catStr),
                            color: property.getSingleColor(catStr)
                        });
                    });
                }
                return colorLegend;
            };

            property.getSingleColor = function(val) {
                if (property._isCategorical) {
                    var idx = property._category2ColorMapper.get(val);
                    if (idx>=0)
                        return Color.standardColors[idx];
                    return Color.Color(0.5,0.5,0.5);
                }
                return Color.Color(0,0,0);
            };


            property.content2DisplayString = function(val) {
                return String(val);
            };

            return property;
        };


        Module.createObjectType = function(typeId, primKey) {
            if (Module._objectTypes[typeId])
                AXMUtils.Test.reportBug('Dataframe object type already exists: '+typeId);
            var objectType = {
                typeId: typeId,
                primKey: primKey,
                _defaultTooltip: primKey
            };
            objectType._properties = [];
            objectType._mapProperties = {};

            objectType._selectedRowIds = {};

            objectType.hasProperty = function(propId) {
                return !!objectType._mapProperties[propId];
            };

            objectType.getProperty = function(propId) {
                prop = objectType._mapProperties[propId];
                if (!prop)
                    AXMUtils.Test.reportBug('Invalid objectType property id: '+propId);
                return prop;
            };

            objectType.addProperty = function(property) {
                if (objectType._mapProperties[property.getId()])
                    AXMUtils.Test.reportBug('Duplicate objectType property id: '+property.getId());
                objectType._properties.push(property);
                objectType._mapProperties[property.getId()] = property;
            };

            objectType.setDefaultTooltip = function(propId) {
                objectType._defaultTooltip = propId;
            };

            objectType.getDefaultTooltip = function() {
                return objectType._defaultTooltip;
            };

            objectType.rowSelClear = function() {
                objectType._selectedRowIds = {};
            };

            objectType.rowSelSet = function(rowId, status) {
                objectType._selectedRowIds[rowId] = status;
            };

            objectType.rowSelGet = function(rowId) {
                return !!objectType._selectedRowIds[rowId];
            };

            objectType.rowSelNotifyChanged = function() {
                Msg.broadcast('DataFrameRowSelChanged', objectType.typeId);
            };


            Module._objectTypes[typeId] = objectType;
            return objectType;
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
                if (dataFrame._mapProperties[propId])
                    AXMUtils.Test.reportBug('Duplicate dataframe property id: '+propId);
                if (!dataFrame.objectType.hasProperty(propId)) {
                    var propInfo = Module.property(propId, propDispName, propType, settings)
                    dataFrame.objectType.addProperty(propInfo);
                }
                var propInfo = dataFrame.objectType.getProperty(propId).clone();
                dataFrame._properties.push(propInfo);
                for (var i=0; i<dataFrame._rowCount; i++)
                    propInfo.data.push(null);
                dataFrame._mapProperties[propId] = propInfo;
            };

            dataFrame.getProperties = function() {
                return dataFrame._properties;
            };

            dataFrame.getProperty = function(propId) {
                var prop = dataFrame._mapProperties[propId];
                if (!prop)
                    AXMUtils.Test.reportBug('Dataframe does not have property ' + propId);
                return prop;
            };

            dataFrame.getPrimKeyProperty = function() {
                return dataFrame.getProperty(dataFrame.objectType.primKey);
            };


            dataFrame.getRowCount = function() {
                return dataFrame._rowCount;
            };

            dataFrame.getRowInfo = function(rowNr) {
                var rowInfo = {};
                $.each(dataFrame._properties, function(idx, prop) {
                    rowInfo[prop.getId()] = prop.data[rowNr];
                });
                return rowInfo;
            };

            dataFrame.addRow = function(rowInfo) {
                dataFrame._rowCount += 1;
                $.each(dataFrame._properties, function(idx, prop) {
                    var cell = rowInfo[prop.getId()];
                    prop.addValue(cell);
                    //if (!cell)
                    //    cell = null;
                    //prop.data.push(cell)
                });
            };

            dataFrame.createSelectedRowsDataFrame = function() {
                var subFrame = Module.createDataFrame(dataFrame.objectType.typeId);
                $.each(dataFrame.getProperties(), function(idx, propInfo) {
                    subFrame.addProperty(propInfo.getId());
                });
                var rowSelGet = dataFrame.objectType.rowSelGet;
                var dataPrimKey = dataFrame.getPrimKeyProperty().data;
                for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                    if (rowSelGet(dataPrimKey[rowNr])) {
                        var rowInfo = dataFrame.getRowInfo(rowNr);
                        subFrame.addRow(rowInfo);
                    }
                }

                return subFrame;
            };


            dataFrame.getContentString = function() {
                var str = '';
                $.each(dataFrame.getProperties(), function(idx, propInfo) {
                    if (idx>0)
                    str += '\t';
                    str += propInfo.getDispName();
                });
                str += '\n';
                for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                    $.each(dataFrame.getProperties(), function(idx, propInfo) {
                        if (idx>0)
                            str += '\t';
                        str += propInfo.content2DisplayString(propInfo.data[rowNr]);
                    });
                    str += '\n';
                }
                return str;
            };

            dataFrame.promptPlot = function() {
                PromptPlot.create(dataFrame);
            };

            dataFrame.showData = function() {
                var win = PopupWindow.create({
                    title: 'Data',
                    sizeX: 650,
                    sizeY: 500,
                    autoCenter: true
                });
                var content = dataFrame.getContentString();
                var form = PanelHtml.create();
                form.enableVScrollBar();
                form.setContent('<PRE>' + content + '</PRE>');
                var rootFrame = Frame.FrameFinalCommands(form);
                win.setRootFrame(rootFrame);

                rootFrame.addCommand({
                    icon: "fa-external-link"
                }, function() {
                    var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
                    FileSaver(blob,  'data.txt');
                });

                win.start();
            };

            return dataFrame;
        };

        return Module;
    });

