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

        Module.create = function(dataFrame, onCompleted) {

            var compatibleDataFrames = [];
            $.each(require('AXM/DataFrames/Table')._activeDataFrames, function(idx, activeDataFrame) {
                if ((dataFrame.getObjectType().getTypeId() == activeDataFrame.getObjectType().getTypeId()) &&
                    (dataFrame != activeDataFrame))
                    compatibleDataFrames.push(activeDataFrame);
            });
            if (compatibleDataFrames.length == 0) {
                SimplePopups.ErrorBox('There are currently no compatible dataframe tables open.');
                return;
            }

            var win = PopupWindow.create({
                title: _TRL('Append dataframe'),
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({separator: 15});

            win.ctrlDataFrame = Controls.DropList({width:300});
            $.each(compatibleDataFrames, function(idx, frame) {
                win.ctrlDataFrame.addState(idx+1, frame.getName());
            });
            grp.add(Controls.Compound.GroupHor({verticalAlignCenter: true, separator: 7}, ['Dataframe: ', win.ctrlDataFrame]));

            var btOK = Controls.Button({
                text: _TRL('Execute'),
                icon: 'fa-check'
            }).addNotificationHandler(function() {
                win.execute();
            });
            grp.add(btOK);


            win.execute = function() {
                var dataFrameId = parseInt(win.ctrlDataFrame.getValue())-1;
                if (dataFrameId >= 0) {
                    var sourceDataFrame = compatibleDataFrames[dataFrameId];
                    dataFrame.append(sourceDataFrame);
                    win.close();
                }
                onCompleted();
            };


            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };

        return Module;
    });

