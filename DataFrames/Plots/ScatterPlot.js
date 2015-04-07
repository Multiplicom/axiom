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
        "AXM/AXMUtils", "AXM/Color", "AXM/Panels/PanelCanvasXYPlot", "AXM/Windows/PopupWindow", "AXM/Controls/Controls", "AXM/Windows/SimplePopups",
        "AXM/DataFrames/Plots/_GenericPlot",
        "AXM/DataFrames/DataTypes"

    ],
    function (
        require, $, _,
        AXMUtils, Color, PanelCanvasXYPlot, PopupWindow, Controls, SimplePopups,
        _GenericPlot,
        DataTypes
    ) {

        var PlotType = _GenericPlot.createPlotType('scatterplot', 'Scatter plot');
        PlotType.addPlotAspect('xvalue', 'X Value', DataTypes.typeFloat, true);
        PlotType.addPlotAspect('yvalue', 'Y Value', DataTypes.typeFloat, true);
        PlotType.addPlotAspect('color', 'Color', DataTypes.typeAny, false);
        PlotType.addPlotAspect('label', 'Label', DataTypes.typeAny, false);
        PlotType.addPlotAspect('tooltip', 'Hover text', DataTypes.typeAny, false);

        PlotType.create = function(dataFrame, aspectMap) {
            var win = PlotType.createGeneric(dataFrame, aspectMap);

            win.plot = PanelCanvasXYPlot.create('', {});
            win.plot._directRedraw = true; //!!!
            win._opacity = 0.40;


            win._createDisplayControls = function(dispGroup) {
                win.colorLegendCtrl = Controls.Static({});
                dispGroup.add(win.colorLegendCtrl);
            };

            win.plot.getToolTipInfo = function (px, py) {
                if (!win.hasAspectProperty('tooltip'))
                    return;
                var dataX = win.getAspectProperty('xvalue').data;
                var dataY = win.getAspectProperty('yvalue').data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                var propTooltip = win.getAspectProperty('tooltip');

                var coordXLogic2Win = win.plot.coordXLogic2Win;
                var coordYLogic2Win = win.plot.coordYLogic2Win;
                var minDist = 7;
                var bestRowNr = null;
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var ptPx = coordXLogic2Win(dataX[rowNr]);
                    var ptPy = coordYLogic2Win(dataY[rowNr]);
                    var dist = Math.abs(ptPx-px) + Math.abs(ptPy-py);
                    if (dist <= minDist) {
                        minDist = dist;
                        bestRowNr = rowNr;
                    }
                }
                if (bestRowNr === null)
                    return null;

                return {
                    px: coordXLogic2Win(dataX[bestRowNr]),
                    py: coordYLogic2Win(dataY[bestRowNr]),
                    ID: dataPrimKey[bestRowNr],
                    rowNr: bestRowNr,
                    content: propTooltip.content2DisplayString(propTooltip.data[bestRowNr]),
                    showPointer: true
                }

            };

            win.plot.onMouseClick = function(ev, info) {
                var tooltip = win.plot.getToolTipInfo(info.x, info.y);
                if (tooltip)
                    win.openPoint(tooltip.rowNr);
            };


            win.updateAspect = function(aspectId) {
                if (aspectId == 'xvalue') {
                    var rangeX = win.getAspectProperty('xvalue').getValueRange();
                    rangeX.extendFraction(0.1);
                    win.plot.setXRange(rangeX.getMin(), rangeX.getMax());
                }
                if (aspectId == 'yvalue') {
                    var rangeY = win.getAspectProperty('yvalue').getValueRange();
                    rangeY.extendFraction(0.1);
                    win.plot.setYRange(rangeY.getMin(), rangeY.getMax());
                }
                if (aspectId == 'color')
                    win.updateColorLegend();
                win.plot.render();
            };


            win.updateColorLegend = function() {
                var propColor = null;
                win.colorLegendCtrl.modifyText('');
                if (win.hasAspectProperty('color')) {
                    propColor = win.getAspectProperty('color');
                    var dataColor = propColor.data;
                    var legendData = propColor.mapColors(dataColor);
                    var legendHtml = '';
                    $.each(legendData, function(idx, legendItem) {
                        legendHtml += '<span style="background-color: {col};">&nbsp;&nbsp;&nbsp;</span>&nbsp;'.AXMInterpolate({col: legendItem.color.toString()});
                        legendHtml += legendItem.content;
                        legendHtml += '<br>';
                    });
                    win.colorLegendCtrl.modifyText(legendHtml);
                }
            };

            win.plot.drawPlot = function(drawInfo) {
                var plot = win.plot;

                var propX = win.getAspectProperty('xvalue');
                var propY = win.getAspectProperty('yvalue');
                var dataX = propX.data;
                var dataY = propY.data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                var propColor = null;
                if (win.hasAspectProperty('color')) {
                    propColor = win.getAspectProperty('color');
                    var dataColor = propColor.data;
                }

                drawInfo.ctx.fillStyle = Color.Color(0,0,0,0.4).toStringCanvas();
                if (win.hasAspectProperty('label')) {
                    var propLabel = win.getAspectProperty('label');
                    var dataLabel = propLabel.data;
                    for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                        plot.drawLabel(drawInfo, dataX[rowNr], dataY[rowNr], 4, propLabel.content2DisplayString(dataLabel[rowNr]));
                    }
                }

                var rowSelGet = win.dataFrame.objectType.rowSelGet
                drawInfo.ctx.strokeStyle = Color.Color(255,0,0,0.5).toStringCanvas();
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    if (rowSelGet(dataPrimKey[rowNr]))
                        plot.drawSel(drawInfo, dataX[rowNr], dataY[rowNr]);
                }

                drawInfo.ctx.fillStyle = Color.Color(0,0,255,win._opacity).toStringCanvas();
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    if (propColor) {
                        drawInfo.ctx.fillStyle = propColor.getSingleColor(dataColor[rowNr]).changeOpacity(win._opacity).toStringCanvas();
                    }
                    plot.drawPoint(drawInfo, dataX[rowNr], dataY[rowNr]);
                }
            };

            win.plot.handleRectSelection = function(pt1, pt2) {
                var xMin = win.plot.coordXWin2Logic(Math.min(pt1.x, pt2.x));
                var xMax = win.plot.coordXWin2Logic(Math.max(pt1.x, pt2.x));
                var yMin = win.plot.coordYWin2Logic(Math.max(pt1.y, pt2.y));
                var yMax = win.plot.coordYWin2Logic(Math.min(pt1.y, pt2.y));

                var dataX = win.getAspectProperty('xvalue').data;
                var dataY = win.getAspectProperty('yvalue').data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                var selList = [];
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    if ((dataX[rowNr]>=xMin) && (dataX[rowNr]<=xMax) && (dataY[rowNr]>=yMin) && (dataY[rowNr]<=yMax))
                        selList.push(dataPrimKey[rowNr]);
                }
                win.performRowSelected(selList);
            };



            win.openPoint = function(rowNr) {
                var win = PopupWindow.create({
                    title: 'Data point',
                    blocking:true,
                    autoCenter: true
                });

                var grp = Controls.Compound.Grid({});

                $.each(dataFrame.getProperties(), function(idx, property) {
                    grp.setItem(idx, 0, property.getDispName());
                    grp.setItem(idx, 1, property.content2DisplayString(property.data[rowNr]));
                });

                win.setRootControl(Controls.Compound.StandardMargin(grp));
                win.start();
            };


            win.initPlot = function() {
                win.updateColorLegend();
            };

            var propX = win.getAspectProperty('xvalue');
            var propY = win.getAspectProperty('yvalue');
            var rangeX = propX.getValueRange();
            var rangeY = propY.getValueRange();
            rangeX.extendFraction(0.1);
            rangeY.extendFraction(0.1);
            win.plot.setXRange(rangeX.getMin(), rangeX.getMax());
            win.plot.setYRange(rangeY.getMin(), rangeY.getMax());

            win.init();
        };


        return PlotType;
    });

