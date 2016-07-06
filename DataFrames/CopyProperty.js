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
        "AXM/AXMUtils", "AXM/Windows/PopupWindow", "AXM/Controls/Controls", "AXM/Windows/SimplePopups",
        "AXM/DataFrames/DataTypes"
    ],
    function (
        require, $, _,
        AXMUtils, PopupWindow, Controls, SimplePopups,
        DataTypes
    ) {

        var Module = {
        };
        Module.lastExpr = '';
        Module.lastName = 'NewProperty';

        Module.create = function(dataFrame, onCompleted) {

            var compatibleDataFrames = [];
            $.each(require('AXM/DataFrames/Table')._activeWindows, function(idx, tableWin) {
                if ((dataFrame.getObjectType().getTypeId() == tableWin.dataFrame.getObjectType().getTypeId()) &&
                    (dataFrame != tableWin.dataFrame))
                    compatibleDataFrames.push(tableWin.dataFrame);
            });
            if (compatibleDataFrames.length == 0) {
                SimplePopups.ErrorBox('There are currently no compatible dataframe tables open.');
                return;
            }

            var win = PopupWindow.create({
                title: _TRL('Import property'),
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({separator: 15});

            win.ctrlDataFrame = Controls.DropList({width:300});
            $.each(compatibleDataFrames, function(idx, frame) {
                win.ctrlDataFrame.addState(idx+1, frame.getName());
            });
            grp.add(Controls.Compound.GroupHor({}, ['Dataframe: ', win.ctrlDataFrame]));
            win.ctrlDataFrame.addNotificationHandler(function() {win.update()});

            win.ctrlProperty = Controls.DropList({width:300});
            grp.add(Controls.Compound.GroupHor({}, ['Property: ', win.ctrlProperty]));

            //win.ctrlName = Controls.Edit({width: 150, value: Module.lastName});
            //grp.add(Controls.Compound.GroupHor({}, ['Property name: ', win.ctrlName]));


            var btOK = Controls.Button({
                text: _TRL('Execute'),
                icon: 'fa-check'
            }).addNotificationHandler(function() {
                win.execute();
            });
            grp.add(btOK);

            win.update = function() {
                win.ctrlProperty.clearStates();
                var dataFrameId = parseInt(win.ctrlDataFrame.getValue())-1;
                if (dataFrameId >= 0) {
                    var dataFrame = compatibleDataFrames[dataFrameId];
                    $.each(dataFrame.getProperties(), function(idx, propInfo) {
                        win.ctrlProperty.addState(propInfo.getId(), propInfo.getDispName());
                    });
                }
            };

            win.execute = function() {
                var dataFrameId = parseInt(win.ctrlDataFrame.getValue())-1;
                if (dataFrameId >= 0) {
                    var sourceDataFrame = compatibleDataFrames[dataFrameId];
                    var propId = win.ctrlProperty.getValue();
                    var propInfo = sourceDataFrame.getProperty(propId);
                    newProp = dataFrame.addProperty(
                        AXMUtils.getUniqueID(),
                        sourceDataFrame.getName() + ' - ' + propInfo.getDispName(),
                        propInfo.getDataType(),
                        {});
                    var primKey = dataFrame.getPrimKeyProperty();
                    var sourcePrimKey = sourceDataFrame.getPrimKeyProperty();
                    var sourceMap = {};
                    for (var rowNr = 0; rowNr < sourceDataFrame.getRowCount(); rowNr++)
                        sourceMap[sourcePrimKey.data[rowNr]] = rowNr;
                    for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                        var newVal = null;
                        var ID = primKey.data[rowNr];
                        if (ID in sourceMap)
                            newVal = propInfo.data[sourceMap[ID]];
                        newProp.data[rowNr] = newVal;
                    }
                    win.close();
                }
                onCompleted();
            };


            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
            win.update();
        };

        return Module;
    });

