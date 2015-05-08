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
        "AXM/AXMUtils", "AXM/Windows/PopupWindow", "AXM/Windows/SimplePopups", "AXM/Panels/Frame", "AXM/Panels/PanelForm", "AXM/Panels/PanelHtml", "AXM/Controls/Controls",
        "AXM/DataFrames/DataTypes", "AXM/DataFrames/Query"
    ],
    function (
        require, $, _,
        AXMUtils, PopupWindow, SimplePopups, Frame, PanelForm, PanelHtml, Controls,
        DataTypes, FrameQuery
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


        Module.createPlotType = function(id, name, icon) {
            var plotType = {
                _plotTypeId: id,
                _plotTypeName: name,
                _plotTypeIcon: icon,
                _aspects: [],
                _aspectsMap: {}
            };


            plotType.getPlotTypeName = function() {
                return plotType._plotTypeName
            };

            plotType.getPlotTypeIcon = function() {
                return plotType._plotTypeIcon
            };

            plotType.addPlotAspect = function(aspectId, aspectName, dataType, isRequired) {
                var aspect = Module.plotAspect(aspectId, aspectName, dataType, isRequired);
                plotType._aspects.push(aspect);
                plotType._aspectsMap[aspectId] = aspect;
            };

            plotType.getPlotAspects = function() {
                return plotType._aspects;
            };

            plotType.hasAspect = function(aspectId) {
                return !!plotType._aspectsMap[aspectId];
            }





            //##############  Create in instance of a plot window ##########################
            plotType.createGeneric = function(dataFrame, aspectMap) {
                var win = PopupWindow.create({
                    title: _TRL('{name} ({plotname})').AXMInterpolate({name: dataFrame.getName(), plotname: plotType.getPlotTypeName()}),
                    blocking:false,
                    autoCenter: true,
                    resizable: true,
                    sizeX: 800,
                    sizeY: 500
                });

                win.dataFrame = dataFrame;

                win._aspectPropertyIdMap = aspectMap;

                win.hasAspectProperty = function(aspectId) {
                    if (!plotType.hasAspect(aspectId))
                        AXMUtils.Test.reportBug(_TRL('Invalid plot aspect: ')+ aspectId);
                    var propId = win._aspectPropertyIdMap[aspectId];
                    return !!propId;
                };

                win.getAspectProperty = function(aspectId) {
                    if (!plotType.hasAspect(aspectId))
                        AXMUtils.Test.reportBug(_TRL('Invalid plot aspect: ')+ aspectId);
                    var propId = win._aspectPropertyIdMap[aspectId];
                    if (!propId)
                        return null;
                    return win.dataFrame.getProperty(propId);
                };

                win.getPrimKeyProperty = function() {
                    return win.dataFrame.getPrimKeyProperty();
                };

                win.setAspectProperty = function(aspectId, propId) {
                    win._aspectPropertyIdMap[aspectId] = propId;
                    win.updateAspect(aspectId);
                };


                win._createAspectControls = function(grp) {
                    $.each(plotType.getPlotAspects(), function(idx, aspect) {
                        var picker = dataFrame.createPropertySelector(
                            aspect.getDataType(),
                            !aspect.getRequired()
                        );
                        //var picker = Controls.DropList({width: 160});
                        //if (!aspect.getRequired())
                        //    picker.addState('', _TRL("-- None --"));
                        //$.each(dataFrame.getProperties(), function(idx, prop) {
                        //    if (aspect.getDataType().includes(prop.getDataType()))
                        //        picker.addState(prop.getId(), prop.getDispName());
                        //});
                        var aspectProp = win.getAspectProperty(aspect.getId());
                        if (aspectProp)
                            picker.setValue(aspectProp.getId());
                        picker.addNotificationHandler(function() {
                           win.setAspectProperty(aspect.getId(), picker.getValue());
                        });
                        grp.add(Controls.Compound.GroupVert({}, [
                            aspect.getName()+':',
                            picker
                        ]));

                    });
                };

                win._createSelectionControls = function(grp) {
                    win._ctrlSelectionCount = Controls.Static({text: _TRL('0 points selected')});
                    grp.add(win._ctrlSelectionCount);

                    var btSelectAll = Controls.Button({
                        text: _TRL('Select all'),
                        icon: 'fa-square-o'
                    })
                        .addNotificationHandler(win.selectAll);

                    var btSelectNone = Controls.Button({
                        text: _TRL('Select none'),
                        icon: 'fa-ban'
                    })
                        .addNotificationHandler(win.selectNone);

                    var btQuery = Controls.Button({
                        text: _TRL('Query...'),
                        icon: 'fa-filter'
                    })
                        .addNotificationHandler(win.doQuery);

                    var btSelPlot = Controls.Button({
                        text: _TRL('Create new view'),
                        icon: 'fa-eye'
                    })
                        .addNotificationHandler(function() {
                            var subDataFrame = win.dataFrame.createSelectedRowsDataFrame();
                            if (subDataFrame.getRowCount() == 0) {
                                SimplePopups.ErrorBox(_TRL('No points are selected'));
                                return;
                            }
                            subDataFrame.promptPlot();
                        });

                    var btRestrict = Controls.Button({
                        text: _TRL('Restrict current view'),
                        icon: 'fa-sign-in'
                    })
                        .addNotificationHandler(function() {
                            var subDataFrame = win.dataFrame.createSelectedRowsDataFrame();
                            if (subDataFrame.getRowCount() == 0) {
                                SimplePopups.ErrorBox(_TRL('No points are selected'));
                                return;
                            }
                            win.dataFrame = subDataFrame;
                            win.updateAspect();
                        });

                    grp.add(Controls.Compound.GroupHor({}, [ btSelectAll, btSelectNone, btQuery, btSelPlot, btRestrict]));

                };


                // Called when the user selected a set of rows in the dataframe
                win.performRowSelected = function(selList, dispText) {
                    var objectType = win.dataFrame.objectType;
                    var actions = [
                        {
                            name: _TRL('Add to selection'),
                            action: function() {
                                $.each(selList, function(idx, rowId) {
                                    objectType.rowSelSet(rowId, true);
                                });
                                objectType.rowSelNotifyChanged();
                            }
                        },
                        {
                            name: _TRL('Replace selection'),
                            action: function() {
                                objectType.rowSelClear();
                                $.each(selList, function(idx, rowId) {
                                    objectType.rowSelSet(rowId, true);
                                });
                                objectType.rowSelNotifyChanged();
                            }
                        },
                        {
                            name: _TRL('Restrict selection'),
                            action: function() {
                                var currentSelectedList = objectType.rowSelGetList();
                                var currentSelectedMap = {};
                                $.each(currentSelectedList, function(idx, id) {
                                    currentSelectedMap[id] = true;
                                });
                                objectType.rowSelClear();
                                $.each(selList, function(idx, rowId) {
                                    if (currentSelectedMap[rowId])
                                        objectType.rowSelSet(rowId, true);
                                });
                                objectType.rowSelNotifyChanged();
                            }
                        },
                        {
                            name: _TRL('Exclude from selection'),
                            action: function() {
                                $.each(selList, function(idx, rowId) {
                                    objectType.rowSelSet(rowId, false);
                                });
                                objectType.rowSelNotifyChanged();
                            }
                        }
                    ];
                    var introText = _TRL('{disptext}<br><b>{count} points</b>').AXMInterpolate({
                        disptext: dispText || '',
                        count: selList.length
                    });
                    SimplePopups.ActionChoiceBox(_TRL('Highlighted points'), introText, actions);
                };

                win.updateRowSelection = function() {
                    var selCount = 0;

                    var dataPrimKey = win.getPrimKeyProperty().data;
                    var rowSelGet = win.dataFrame.objectType.rowSelGet;
                    for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                        if (rowSelGet(dataPrimKey[rowNr]))
                            selCount += 1;
                    }

                    win._ctrlSelectionCount.modifyText(_TRL('{cnt} points selected').AXMInterpolate({cnt: selCount}));
                    win.plot.render();
                };

                win.addPlotCommand = function(icon, name, action) {
                    var bt = win.plotFrame.addCommand({
                        icon: icon,
                        hint: name
                    },
                        action
                    );
                    return bt;
                };

                win.setInfoText = function(content) {
                    win._formInfoText.setContent(content);
                    win._rightGroup.updatePosition();
                };


                win.selectAll = function() {
                    var selList = [];
                    var dataPrimKey = win.dataFrame.getPrimKeyProperty().data;
                    for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                        selList.push(dataPrimKey[rowNr]);
                    }
                    $.each(selList, function(idx, rowId) {
                        win.dataFrame.objectType.rowSelSet(rowId, true);
                    });
                    win.dataFrame.objectType.rowSelNotifyChanged();
                };

                win.selectNone = function() {
                    win.dataFrame.objectType.rowSelClear();
                    //$.each(selList, function(idx, rowId) {
                    //    win.dataFrame.objectType.rowSelSet(rowId, false);
                    //});
                    win.dataFrame.objectType.rowSelNotifyChanged();
                };

                win.doQuery = function() {
                    FrameQuery.create(win.dataFrame, '', function(selList, expr) {
                        win.performRowSelected(selList, expr);
                    });
                };

                win.openImage = function() {
                    win.plot.save();
                };

                win.init = function() {

                    var rootFrame = Frame.FrameSplitterHor();

                    var formHeader = PanelForm.create('intro', {scrollY: true});
                    rootFrame.addMember(Frame.FrameFinal(formHeader)).setFixedDimSize(Frame.dimX, 280);

                    var headerGroup = Controls.Compound.GroupVert({}).setSeparator(12);
                    formHeader.setRootControl(headerGroup);

                    var aspectGroup = Controls.Compound.GroupVert({}).setSeparator(12);
                    headerGroup.add(Controls.Compound.Section(Controls.Compound.StandardMargin(aspectGroup), _TRL("Plot aspects")));
                    win._createAspectControls(aspectGroup);

                    if (win._createDisplayControls) {
                        var dispGroup = Controls.Compound.GroupVert({}).setSeparator(12);
                        headerGroup.add(Controls.Compound.Section(Controls.Compound.StandardMargin(dispGroup), _TRL("Display")));
                        win._createDisplayControls(dispGroup);
                    }

                    var selGroup = Controls.Compound.GroupVert({}).setSeparator(12);
                    headerGroup.add(Controls.Compound.Section(Controls.Compound.StandardMargin(selGroup), _TRL("Selection")));
                    win._createSelectionControls(selGroup);

                    var rightGroup = Frame.FrameSplitterVert().setHalfSplitterSize(0);
                    win._rightGroup = rightGroup;
                    rootFrame.addMember(rightGroup);

                    if (win.plot) {
                        win.plotFrame = Frame.FrameFinalCommands(win.plot);
                        rightGroup.addMember(win.plotFrame);
                    }

                    win._formInfoText = PanelHtml.create('', {});
                    rightGroup.addMember(Frame.FrameFinal(win._formInfoText).setAutoSize(Frame.dimY));

                    if (win.plot)
                        win.addPlotCommand('fa-external-link', _TRL('Open plot'), win.openImage);

                    if (win.setPlotCommands)
                        win.setPlotCommands();


                    win.setRootFrame(rootFrame);
                    if (win.initPlot)
                        win.initPlot();
                    win.start();

                    win.listen('DataFrameRowSelChanged', function(objectTypeId) {
                        if (objectTypeId == win.dataFrame.objectType.typeId)
                            win.updateRowSelection();
                    });

                };

                return win;
            };


            //###################################################################################



            return plotType;
        }


        return Module;
    });

