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
        "AXM/AXMUtils", "AXM/Color", "AXM/DrawUtils", "AXM/Msg", "AXM/Controls/Controls", "AXM/Panels/Frame", "AXM/Windows/PopupWindow", "AXM/Panels/PanelHtml",
        "AXM/DataFrames/DataTypes",
        "AXM/DataFrames/PromptPlot", "AXM/DataFrames/Table"
    ],
    function (
        require, $, _, Blob, FileSaver,
        AXMUtils, Color, DrawUtils, Msg, Controls, Frame, PopupWindow, PanelHtml,
        DataTypes,
        PromptPlot, Table
    ) {

        var Module = {};

        Module.DataTypes = DataTypes;

        Module._objectTypes = {};

        Module.extraTokenDelimiter = '==';



        Module.property = function(propId, propDispName, propType, settings) {
            var property = {
                _propId: propId,
                _propCat: '',
                _propDispName: propDispName,
                _propDispNamePart: propDispName,
                _propType: propType,
                data: []
            };

            var tokens = propDispName.split(': ');
            if (tokens.length == 2) {
                property._propCat = tokens[0];
                property._propDispNamePart = tokens[1];
            }

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

            property.getCategory = function() {
                return property._propCat;
            };

            property.getDispName = function() {
                return property._propDispName;
            };

            property.getDispNamePart = function() {
                return property._propDispNamePart;
            };

            property.getDataType = function() {
                return property._propType
            };

            property.getValueRange = function() {
                if (!property.getDataType().includes(DataTypes.typeFloat))
                    AXMUtils.Test.reportBug(_TRL('Property is not numerical'));
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
                return AXMUtils.valueRange(minValue, maxValue);
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
                if (DataTypes.typeFloat.includes(property.getDataType())) {
                    var range = property.getValueRange();
                    property._colorRangeMin = range.getMin();
                    property._colorRangeMax = range.getMax();
                    property._colorRange = range.getMax()-range.getMin();

                    var scale = DrawUtils.getScaleJump(property._colorRange/20);
                    for (var i=Math.ceil(property._colorRangeMin/scale.Jump1); i<=Math.floor(property._colorRangeMax/scale.Jump1); i++) {
                        if (i%scale.JumpReduc==0) {
                            var value = i*scale.Jump1;
                            var fr = (value-property._colorRangeMin)/property._colorRange;
                            colorLegend.push({
                                content: scale.value2String(value),
                                color: Color.HSL2Color(0.5-fr*0.75,0.6,0.5)
                            });
                        }
                    }

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
                if (DataTypes.typeFloat.includes(property.getDataType())) {
                    var fr = (val-property._colorRangeMin) / property._colorRange;
                    return Color.HSL2Color(0.5-fr*0.75,0.6,0.5);
                }
                return Color.Color(0,0,0);
            };


            property.content2DisplayString = function(val) {
                if (val===null)
                    return '';
                return String(val);
            };

            if (propType.getId() == 'typeBoolean') {
                property.content2DisplayString = function(val) {
                    if (val === true)
                        return 'True';
                    if (val === false)
                        return 'False';
                    return '';
                };
            }

            return property;
        };


        Module.createObjectType = function(typeId, primKey) {
            if (Module._objectTypes[typeId])
                AXMUtils.Test.reportBug(_TRL('Dataframe object type already exists: ') + typeId);
            var objectType = {
                typeId: typeId,
                primKey: primKey,
                _defaultTooltip: primKey
            };
            objectType._properties = [];
            objectType._mapProperties = {};

            objectType._selectedRowIds = {};

            objectType.getTypeId = function() {
                return objectType.typeId;
            };

            objectType.setPrimKey = function(colId) {
                objectType.primKey = colId;
            };

            objectType.getPrimKey = function() {
                return objectType.primKey;
            };

            objectType.hasProperty = function(propId) {
                return !!objectType._mapProperties[propId];
            };

            objectType.getProperty = function(propId) {
                var prop = objectType._mapProperties[propId];
                if (!prop)
                    AXMUtils.Test.reportBug(_TRL('Invalid objectType property id: ') + propId);
                return prop;
            };

            objectType.addProperty = function(property) {
                if (objectType._mapProperties[property.getId()])
                    AXMUtils.Test.reportBug(_TRL('Duplicate objectType property id: ') + property.getId());
                objectType._properties.push(property);
                objectType._mapProperties[property.getId()] = property;
            };

            objectType.setDefaultTooltip = function(propId) {
                objectType._defaultTooltip = propId;
            };

            objectType.getDefaultTooltip = function() {
                return objectType._defaultTooltip;
            };

            objectType.setOpenHandler = function(handler) {
                //AXMUtils.Test.isFunction(handler);
                objectType._onOpenHandler = handler;
            };

            objectType.getOpenHandler = function() {
                return objectType._onOpenHandler;
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

            objectType.rowSelGetList = function() {
                var lst = [];
                $.each(objectType._selectedRowIds, function(key, val) {
                    lst.push(key);
                });
                return lst;
            };

            objectType.rowSelNotifyChanged = function() {
                Msg.broadcast('DataFrameRowSelChanged', objectType.typeId);
            };


            Module._objectTypes[typeId] = objectType;
            return objectType;
        };




        // Create a new data frame
        Module.createDataFrame = function(objectTypeId, name) {
            var dataFrame = {};
            dataFrame.id = AXMUtils.getUniqueID();
            dataFrame.objectType = Module._objectTypes[objectTypeId];
            if (!dataFrame.objectType) {
                dataFrame.objectType = Module.createObjectType(objectTypeId, 'id');
            }
            dataFrame._rowCount = 0;
            dataFrame._extraTokens = {};
            dataFrame._properties = [];
            dataFrame._mapProperties = {};
            dataFrame._name = name;

            dataFrame._rowOpenHandlers = [];

            dataFrame.getObjectType = function() {
                return dataFrame.objectType;
            };

            dataFrame.getRowOpenHandlerList = function() {
                return dataFrame._rowOpenHandlers;
            };

            dataFrame.addExtraToken = function(key, value) {
                dataFrame._extraTokens[key] = value;
            };

            dataFrame.addRowOpenHandler = function(name, handler) {
                dataFrame._rowOpenHandlers.push({
                    name: name,
                    handler: handler
                });
            };

            dataFrame.addProperty = function(propId, propDispName, propType, settings) {
                if (dataFrame._mapProperties[propId])
                    AXMUtils.Test.reportBug(_TRL('Duplicate dataframe property id: ' + propId));
                if (!dataFrame.objectType.hasProperty(propId)) {
                    var propInfo = Module.property(propId, propDispName, propType, settings);
                    dataFrame.objectType.addProperty(propInfo);
                }
                var propInfo = dataFrame.objectType.getProperty(propId).clone();
                dataFrame._properties.push(propInfo);
                for (var i=0; i<dataFrame._rowCount; i++)
                    propInfo.data.push(null);
                dataFrame._mapProperties[propId] = propInfo;
                return propInfo;
            };

            dataFrame.getName = function() {
                return dataFrame._name;
            };

            dataFrame.setName = function(name) {
                return dataFrame._name = name;
            };

            dataFrame.getProperties = function() {
                return dataFrame._properties;
            };

            dataFrame.hasProperty = function(propId) {
                return !!dataFrame._mapProperties[propId];
            };

                dataFrame.getProperty = function(propId) {
                var prop = dataFrame._mapProperties[propId];
                if (!prop)
                    AXMUtils.Test.reportBug(_TRL('Dataframe does not have property ') + propId);
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
                    //if (!cell)
                    //    cell = null;
                    prop.data.push(cell)
                });
            };

            dataFrame.append = function(sourceDataFrame) {
                for (var rowNr = 0; rowNr < sourceDataFrame.getRowCount(); rowNr++) {
                    dataFrame.addRow(sourceDataFrame.getRowInfo(rowNr));
                }
            };

            dataFrame.copyProperty = function(sourceDataFrame, srcPropId, destPropId, mergePropId, srcMergePropId) {
                if (!destPropId)
                    destPropId = AXMUtils.getUniqueID();
                var propInfo = sourceDataFrame.getProperty(srcPropId);
                var newProp = dataFrame.addProperty(
                    destPropId,
                    sourceDataFrame.getName() + ': ' + propInfo.getDispName(),
                    propInfo.getDataType(),
                    {});
                var mergeProperty = dataFrame.getProperty(mergePropId);
                var sourceMergeProperty = sourceDataFrame.getProperty(srcMergePropId);
                var sourceMap = {};
                for (var rowNr = 0; rowNr < sourceDataFrame.getRowCount(); rowNr++)
                    sourceMap[sourceMergeProperty.data[rowNr]] = rowNr;
                for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                    var newVal = null;
                    var ID = mergeProperty.data[rowNr];
                    if (ID in sourceMap)
                        newVal = propInfo.data[sourceMap[ID]];
                    newProp.data[rowNr] = newVal;
                }
            };

            dataFrame.calculateProperty = function(destPropId, dataType, expression) {
                if (!destPropId)
                    destPropId = AXMUtils.getUniqueID();
                var newProp = dataFrame.addProperty(
                    destPropId,
                    destPropId,
                    DataTypes.typesMap[dataType],
                    {});
                for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                    var newVal = null;
                    try {
                        var pt = {};
                        $.each(dataFrame.getProperties(), function(idx, property) {
                            pt[property.getId()] = property.data[rowNr];
                        });
                        newVal = eval(expression);
                    }
                    catch(err) {
                    }
                    newProp.data[rowNr] = newVal;
                }
            };

            dataFrame.createSelectedRowsDataFrame = function() {
                var subFrame = Module.createDataFrame(dataFrame.objectType.typeId);
                $.each(dataFrame.getProperties(), function(idx, propInfo) {
                    subFrame.addProperty(propInfo.getId());
                });
                $.each(dataFrame._extraTokens, function(key, value) {
                    subFrame.addExtraToken(key, value);
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


            dataFrame.groupBy = function(objectTypeID, groupByProperties, outputProperties) {

                var getAggregator_Any = function() {
                    var aggr = {
                        value: null
                    };
                    aggr.add = function(value) {
                        aggr.value = value;
                    };
                    aggr.finish = function() {
                        return aggr.value;
                    };
                    return aggr;
                };

                var getAggregator_Average = function() {
                    var aggr = {
                        count: 0,
                        sum: 0
                    };
                    aggr.add = function(value) {
                        aggr.count += 1;
                        aggr.sum += value;
                    };
                    aggr.finish = function() {
                        if (aggr.count > 0)
                            return aggr.sum*1.0/aggr.count;
                        else
                            return null;
                    };
                    return aggr;
                };

                var getAggregator_StandardDeviation = function() {
                    var aggr = {
                        n: 0.0,
                        mean: 0.0,
                        M2: 0.0
                    };
                    aggr.add = function(x) {
                        aggr.n += 1.0;
                        var delta = x - aggr.mean;
                        aggr.mean += delta/aggr.n;
                        aggr.M2 += delta*(x - aggr.mean);
                    };
                    aggr.finish = function() {
                        if (aggr.n > 1)
                            return Math.sqrt(aggr.M2/aggr.n);
                        else
                            return null;
                    };
                    return aggr;
                };

                var getAggregator_Count = function() {
                    var aggr = {
                        count: 0
                    };
                    aggr.add = function(value) {
                        aggr.count += 1;
                    };
                    aggr.finish = function() {
                        return aggr.count;
                    };
                    return aggr;
                };

                var getAggregator_Enumerate = function() {
                    var aggr = {
                        lst: {}
                    };
                    aggr.add = function(value) {
                        aggr.lst[value] = true;
                    };
                    aggr.finish = function() {
                        var lst = [];
                        $.each(aggr.lst, function(key, val) {
                            lst.push(key);
                        });
                        return lst.join(';');
                    };
                    return aggr;
                };


                var aggregatorGenerators = {
                    Any: getAggregator_Any,
                    Average: getAggregator_Average,
                    StandardDeviation: getAggregator_StandardDeviation,
                    Count: getAggregator_Count,
                    Enumerate: getAggregator_Enumerate
                };

                var outputFrame = Module.createDataFrame(objectTypeID);
                var newProperties = [];
                var dataFrameGroupByProperties = [];

                var propPrimKey = outputFrame.addProperty(
                    'id',
                    'ID',
                    DataTypes.typeString,
                    {});
                propPrimKey.__sourceID = null;
                propPrimKey.__aggregator = null;

                $.each(groupByProperties, function(idx, propID) {
                    if (!dataFrame.hasProperty(propID))
                        throw ("Invalid Source Property: " + propID);
                    if (outputFrame.hasProperty(propID))
                        throw ("Duplicate property: " + propID);
                    var newProp = outputFrame.addProperty(
                        propID,
                        dataFrame.getProperty(propID).getDispName(),
                        dataFrame.getProperty(propID).getDataType(),
                        {});
                    newProp.__sourceID = propID;
                    newProp.__aggregator = aggregatorGenerators['Any'];
                    newProperties.push(newProp);
                    dataFrameGroupByProperties.push(dataFrame.getProperty(propID));
                });
                $.each(outputProperties, function(idx, outputInfo) {
                    try {
                        if (!outputInfo.DestID)
                            throw ("Missing DestID");
                        if (!outputInfo.DestName)
                            throw ("Missing SourceName");
                        if (!outputInfo.SourceID)
                            throw ("Missing SourceID");
                        if (!dataFrame.hasProperty(outputInfo.SourceID))
                            throw ("Invalid Source Property: " + outputInfo.SourceID);
                        if (!(aggregatorGenerators[outputInfo.Aggregator]))
                            throw ("Invalid Aggregator: " + outputInfo.Aggregator);
                        if (outputFrame.hasProperty(outputInfo.DestID))
                            throw ("Duplicate property: " + outputInfo.DestID);
                        var newProp = outputFrame.addProperty(
                            outputInfo.DestID,
                            outputInfo.DestName,
                            dataFrame.getProperty(outputInfo.SourceID).getDataType(),
                            {});
                        newProp.__sourceID = outputInfo.SourceID;
                        newProp.__aggregator = aggregatorGenerators[outputInfo.Aggregator];
                        newProperties.push(newProp);
                    }
                    catch(err) {
                        throw "Error in Group By output property:\n" + err;
                    }
                });
                var propCount = outputFrame.addProperty(
                    '__count__',
                    'Count',
                    DataTypes.typeFloat,
                    {});
                propCount.__sourceID = groupByProperties[0];//any will do...
                propCount.__aggregator = aggregatorGenerators['Count'];
                newProperties.push(propCount);

                var newRows = [];
                var newRowsMap = {};
                for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                    var signature = "";
                    $.each(dataFrameGroupByProperties, function(idx, property) {
                        signature += '__' + property.data[rowNr];
                    });
                    if (!newRowsMap[signature]) {
                        var newRow = {};
                        newRow.__signature = signature;
                        $.each(newProperties, function(idx, newProperty) {
                            newRow[newProperty.getId()] = newProperty.__aggregator();
                        });
                        newRows.push(newRow);
                        newRowsMap[signature] = newRow;
                    }
                    else
                        var newRow = newRowsMap[signature];
                    $.each(newProperties, function(idx, newProperty) {
                        newRow[newProperty.getId()].add(dataFrame.getProperty(newProperty.__sourceID).data[rowNr]);
                    });
                }
                $.each(newRows, function(idx, newRow) {
                    var rowInfo = {};
                    $.each(newProperties, function(idx, newProperty) {
                        rowInfo[propPrimKey.getId()] = newRow.__signature;
                        rowInfo[newProperty.getId()] = newRow[newProperty.getId()].finish();
                    });
                    outputFrame.addRow(rowInfo);
                });

                return outputFrame;
            };


            dataFrame.sortByProperty = function(sortPropID, sortInv) {
                var sortIdx = [];
                for (var i=0; i<dataFrame.getRowCount(); i++)
                    sortIdx.push(i);
                var sortVals = [];
                for (var i=0; i<dataFrame.getRowCount(); i++)
                    sortVals.push(dataFrame.getRowInfo(i)[sortPropID]);
                sortIdx.sort(function(idx1, idx2) {
                    var val1 = sortVals[idx1];
                    var val2 = sortVals[idx2];
                    var discr = ((val1 < val2) ? -1 : ((val1 > val2) ? 1 : 0));
                    if (discr === 0)
                        discr = idx1 - idx2;
                    if (sortInv)
                        discr = -discr;
                    return discr;
                });
                $.each(dataFrame.getProperties(), function(idx, propInfo) {
                    var sortedData = [];
                    for (var i=0; i<dataFrame.getRowCount(); i++)
                        sortedData.push(propInfo.data[sortIdx[i]]);
                    propInfo.data = sortedData;
                });

            };

            dataFrame.getContentString_Raw = function() {
                var str = '';
                str += '#RD_TEXT\n';
                str += '# datatype: {tpe}\n'.AXMInterpolate({tpe: dataFrame.getObjectType().getTypeId()});
                str += '# key: {colid}\n'.AXMInterpolate({colid: dataFrame.getObjectType().getPrimKey()});
                $.each(dataFrame._extraTokens, function(key, value) {
                    str += '# extratoken: ' + key + Module.extraTokenDelimiter + value + '\n';
                });
                $.each(dataFrame.getProperties(), function(idx, propInfo) {
                    str += '# column: ' + propInfo.getId() + '\t' + propInfo.getDispName() + '\t' + propInfo.getDataType().getId() + '\n';
                });
                $.each(dataFrame.getProperties(), function(idx, propInfo) {
                    if (idx>0)
                        str += '\t';
                    str += propInfo.getId();
                });
                str += '\n';

                for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                    $.each(dataFrame.getProperties(), function(idx, propInfo) {
                        if (idx>0)
                            str += '\t';
                        str += propInfo.data[rowNr];
                    });
                    str += '\n';
                }
                return str;
            };


            dataFrame.getContentString_Display = function() {
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

            dataFrame.createPropertySelector = function(compatibleDataType, canHaveNone) {
                var picker = Controls.DropList({width: 240});
                if (canHaveNone)
                    picker.addState('', "- None -", '');
                $.each(dataFrame.getProperties(), function(idx, prop) {
                    if (compatibleDataType.includes(prop.getDataType()))
                        picker.addState(prop.getId(), prop.getDispNamePart(), prop.getCategory());
                });
                return picker;
            };

            dataFrame.promptPlot = function() {
                PromptPlot.create(dataFrame);
            };

            dataFrame.showTable = function() {
                Table.create(dataFrame);
            };

            dataFrame.showData = function() {
                var win = PopupWindow.create({
                    title: 'Data',
                    sizeX: 650,
                    sizeY: 500,
                    autoCenter: true
                });
                var content = dataFrame.getContentString_Display(false);
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


            dataFrame.saveLocalFile = function() {
                var content = dataFrame.getContentString_Raw(true);
                var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
                FileSaver(blob, dataFrame.getName());
            };


            return dataFrame;
        };

        Module.loadFromText = function(name, sourceText, showAsTable) {
            var lines = sourceText.split(/\r\n|\r|\n/g);
            var dataTypeString = "# datatype: ";
            if(lines[0] != "#RD_TEXT" || lines.length < 2 || lines[1].indexOf(dataTypeString) < 0) {
                AXMUtils.reportBug('File type not supported for creating dataframe');
                return;
            }
            var dataFrame = Module.createDataFrame(lines[1].substr(dataTypeString.length), name);
            var columnOrder = null;
            $.each(lines, function(idx, line) {
                if(line.charAt(0) == '#'){
                    // Header of file
                    var keyString = "# key: ";
                    if(line.indexOf(keyString) == 0) {
                        var primKeyColId = line.substr(keyString.length);
                        dataFrame.getObjectType().setPrimKey(primKeyColId);
                    }
                    var columnString = "# column: ";
                    if(line.indexOf(columnString) == 0){
                        var columnProperties = line.substr(columnString.length).split('\t');
                        if(columnProperties.length != 3)
                            AXMUtils.reportBug(_TRL('RD file column header does not have exactly three properties: id, description, type'));
                        if(!DataTypes[columnProperties[2]])
                            AXMUtils.reportBug(_TRL('RD file column header type is not supported'));
                        dataFrame.addProperty(columnProperties[0], columnProperties[1], DataTypes[columnProperties[2]]);
                    }
                    var extraTokenString = "# extratoken: ";
                    if(line.indexOf(extraTokenString) == 0) {
                        var extraToken = line.substr(extraTokenString.length);
                        var keyValue = extraToken.split(Module.extraTokenDelimiter);
                        dataFrame.addExtraToken(keyValue[0], keyValue[1]);
                    }
                }
                else{
                    // Body of file
                    var fields = line.split('\t');
                    if (!columnOrder)
                        columnOrder = fields;
                    else{
                        if(line.length > 0 && fields.length == columnOrder.length) {
                            var rowData = {};
                            $.each(columnOrder, function(colNr, propId) {
                                //if(!fields[colNr])
                                //    rowData[propId] = fields[colNr]
                                //else
                                rowData[propId] = dataFrame.getProperty(propId).getDataType().parseString(fields[colNr]);
                            });
                            dataFrame.addRow(rowData);
                        }
                        else if(line.length > 0 && fields.length != columnOrder.length)
                            AXMUtils.reportBug(_TRL('RD text file row cells differs from number of columns'));
                    }
                }
            });
            var objectType = dataFrame.getObjectType();
            if (!objectType.hasProperty(objectType.getPrimKey())) {
                AXMUtils.reportBug(_TRL('Dataframe should have column key column "{key}"'.AXMInterpolate({key: objectType.getPrimKey()})));
                return;
            }
            if (showAsTable)
                Table.create(dataFrame);
            return dataFrame;
        };


        Module.loadLocalFile = function() {

            var input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.style.display = 'none';

            input.onchange = function(e) {
                if (input.files.length>0) {
                    var file = input.files[0];

                    var reader = new FileReader();

                    reader.addEventListener("load", function(event) {
                        var textFile = event.target;
                        var txt = textFile.result;
                        Module.loadFromText(file.name, txt, true);
                    });

                    reader.readAsText(file);
                }
            };

            input.focus();
            input.click();
        };


        return Module;
    });

