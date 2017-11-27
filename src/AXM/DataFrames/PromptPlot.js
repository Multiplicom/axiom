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
        "AXM/DataFrames/Plots", "AXM/DataFrames/Table"
    ],
    function (
        require, $, _,
        AXMUtils, PopupWindow, Controls, SimplePopups,
        Plots, Table
    ) {

        var Module = {
        };

        Module.create = function(dataFrame) {

            var win = PopupWindow.create({
                title: _TRL._TRL('Create a view'),
                blocking:true,
                autoCenter: true
            });

            var grp = Controls.Compound.GroupVert({});
            //grp.add(Controls.Static({text: 'Test'}));

            $.each(Plots.plotTypes, function(idx, plotType) {
                var btPlot = Controls.Button({
                    text: plotType.getPlotTypeName(),
                    icon: plotType.getPlotTypeIcon(),
                    width: 250
                })
                    .addNotificationHandler(function() {
                        win.close();
                        Module._createPlotPropertyPicker(plotType, dataFrame);
                    });
                grp.add(btPlot);
            });

            var btPlot = Controls.Button({
                text: _TRL._TRL('Table'),
                icon: 'fa-table',
                width: 250
            })
                .addNotificationHandler(function() {
                    win.close();
                    Table.create(dataFrame);
                });
            grp.add(btPlot);

            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };

        Module._createPlotPropertyPicker = function(plotType, dataFrame) {
            var win = PopupWindow.create({
                title: _TRL._TRL('Create ') + plotType.getPlotTypeName(),
                blocking: true,
                autoCenter: true
            });

            var grp = Controls.Compound.Grid({});

            win._aspectPickerMap = {};
            $.each(plotType.getPlotAspects(), function(idx, aspect) {
                grp.setItem(idx, 0, aspect.getName()+':');
                var picker = dataFrame.createPropertySelector(aspect.getDataType(), true);
                win._aspectPickerMap[aspect.getId()] = picker;
                //var picker = Controls.DropList({width: 200});
                //win._aspectPickerMap[aspect.getId()] = picker;
                //picker.addState('', "- None -");
                //$.each(dataFrame.getProperties(), function(idx, prop) {
                //    if (aspect.getDataType().includes(prop.getDataType()))
                //    picker.addState(prop.getId(), prop.getDispName());
                //});
                if (aspect.getId() == 'tooltip')
                    picker.setValue(dataFrame.objectType.getDefaultTooltip());
                grp.setItem(idx, 1, picker);

            });

            var btOK = Controls.Button({
                text: _TRL._TRL('Create plot'),
                icon: 'fa-check'
            })
                .addNotificationHandler(function() {
                    var aspectMap = {};
                    var missingList = [];
                    $.each(plotType.getPlotAspects(), function(idx, aspect) {
                        var value = win._aspectPickerMap[aspect.getId()].getValue();
                        if (aspect.getRequired() && (!value))
                            missingList.push(aspect.getName());
                        aspectMap[aspect.getId()] = value;
                    });
                    if (missingList.length > 0) {
                        var error = _TRL._TRL('Please provide data for the following plot aspects:<br><br><b>') + missingList.join('<br>') + '</b>';
                        SimplePopups.ErrorBox(error);
                        return;
                    }
                    win.close();
                    plotType.create(dataFrame, aspectMap);
                });
            //grp.add(btOK);

            win.setRootControl(Controls.Compound.StandardMargin(Controls.Compound.GroupVert({separator: 8}, [grp, btOK]) ));
            win.start();
        };

        return Module;
    });

