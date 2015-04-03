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
        "AXM/AXMUtils", "AXM/Windows/PopupWindow", "AXM/Panels/Frame", "AXM/Panels/PanelForm", "AXM/Controls/Controls",
        "AXM/DataFrames/DataTypes"
    ],
    function (
        require, $, _,
        AXMUtils, PopupWindow, Frame, PanelForm, Controls,
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
                _aspects: [],
                _aspectsMap: {}
            };


            plotType.getPlotTypeName = function() {
                return plotType._plotTypeName
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
                    title: plotType.getPlotTypeName(),
                    blocking:false,
                    autoCenter: true,
                    resizable: true,
                    sizeX: 700,
                    sizeY: 500
                });

                win.dataFrame = dataFrame;

                win._aspectPropertyIdMap = aspectMap;

                win.hasAspectProperty = function(aspectId) {
                    if (!plotType.hasAspect(aspectId))
                        AXMUtils.Test.reportBug('Invalid plot aspect: '+ aspectId);
                    var propId = win._aspectPropertyIdMap[aspectId];
                    return !!propId;
                };

                win.getAspectProperty = function(aspectId) {
                    if (!plotType.hasAspect(aspectId))
                        AXMUtils.Test.reportBug('Invalid plot aspect: '+ aspectId);
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
                        var picker = Controls.DropList({width: 180});
                        if (!aspect.getRequired())
                            picker.addState('', "- None -");
                        $.each(dataFrame.getProperties(), function(idx, prop) {
                            if (aspect.getDataType().includes(prop.getDataType()))
                                picker.addState(prop.getId(), prop.getDispName());
                        });
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

                win.init = function() {

                    var rootFrame = Frame.FrameSplitterHor();

                    var formHeader = PanelForm.create('intro');
                    rootFrame.addMember(Frame.FrameFinal(formHeader)).setFixedDimSize(Frame.dimX, 200);

                    var headerGroup = Controls.Compound.GroupVert({}).setSeparator(12);
                    formHeader.setRootControl(headerGroup);

                    var aspectGroup = Controls.Compound.GroupVert({}).setSeparator(12);
                    headerGroup.add(Controls.Compound.Section(Controls.Compound.StandardMargin(aspectGroup), "Plot aspects"));
                    win._createAspectControls(aspectGroup);

                    if (win._createDisplayControls) {
                        var dispGroup = Controls.Compound.GroupVert({}).setSeparator(12);
                        headerGroup.add(Controls.Compound.Section(Controls.Compound.StandardMargin(dispGroup), "Display"));
                        win._createDisplayControls(dispGroup);
                    }


                    rootFrame.addMember(Frame.FrameFinal(win.plot));


                    win.setRootFrame(rootFrame);
                    if (win.initPlot)
                        win.initPlot();
                    win.start();
                };

                return win;
            };


            //###################################################################################



            return plotType;
        }


        return Module;
    });

