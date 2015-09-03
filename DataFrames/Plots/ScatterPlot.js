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
        "AXM/DataFrames/DataTypes", "AXM/DataFrames/ViewRow", "AXM/Stats"

    ],
    function (
        require, $, _,
        AXMUtils, Color, PanelCanvasXYPlot, PopupWindow, Controls, SimplePopups,
        _GenericPlot,
        DataTypes, ViewRow, Stats
    ) {

        var PlotType = _GenericPlot.createPlotType('scatterplot', _TRL('Scatter plot'), 'fa-line-chart');
        PlotType.addPlotAspect('xvalue', _TRL('X Value'), DataTypes.typeFloat, true);
        PlotType.addPlotAspect('yvalue', _TRL('Y Value'), DataTypes.typeFloat, true);
        PlotType.addPlotAspect('color', _TRL('Color'), DataTypes.typeAny, false);
        PlotType.addPlotAspect('size', _TRL('Size'), DataTypes.typeFloat, false);
        PlotType.addPlotAspect('label', _TRL('Label'), DataTypes.typeAny, false);
        PlotType.addPlotAspect('tooltip', _TRL('Hover text'), DataTypes.typeAny, false);


        PlotType.create = function(dataFrame, aspectMap) {

            var win = PlotType.createGeneric(dataFrame, aspectMap);

            win.plot = PanelCanvasXYPlot.create('', {});
            win.plot._directRedraw = true; //might be changed
            win._opacity = 0.40;

            win._curves = [];

            win.setPlotCommands = function() {
                win.button_lassoSelection = win.addPlotCommand(
                    'fa-crosshairs',
                    _TRL('Lasso selection'),
                    function() {
                        win.plot.doLassoSelection(win._hasLassoSelected);
                        win.button_lassoSelection.setChecked(true);
                        var infoTxt = _TRL("Double click to complete the lasso selection");
                        win.setInfoText('<div style="width:100%;padding:2px;background-color: yellow;font-weight: bold">' + infoTxt + '</div>');
                    }
                );
            };


            win._createDisplayControls = function(dispGroup) {

                var opacityCheck = Controls.Slider({
                    width:160,
                    minValue: 0.1,
                    maxValue: 1,
                    step: 0.01,
                    value: Math.pow(win._opacity, 1/1.5),
                    text: _TRL('Opacity')
                })
                    .addNotificationHandler(function() {
                        win._opacity = Math.pow(opacityCheck.getValue(),1.5);
                        win.render();
                    });
                dispGroup.add(opacityCheck);

                win.ctrl_PointSize = Controls.Slider({
                    width:160,
                    minValue: 0.5,
                    maxValue: 5,
                    step: 0.2,
                    value: 2,
                    text: _TRL('Point size')
                })
                    .addNotificationHandler(function() {
                        win.render();
                    });
                dispGroup.add(win.ctrl_PointSize);

                win.ctrl_showOutline = Controls.Check({text: _TRL('Point outline'), checked: false})
                    .addNotificationHandler(function() {
                        win.render();
                    });
                dispGroup.add(win.ctrl_showOutline);


                win.colorLegendCtrl = Controls.Static({});
                dispGroup.add(win.colorLegendCtrl);

                win.corrCtrl = Controls.Static({});
                dispGroup.add(win.corrCtrl);

                win.corrSelectCtrl = Controls.Static({});
                dispGroup.add(win.corrSelectCtrl);

                var btLine = Controls.Button({
                    text: _TRL('Add curve'),
                    icon: 'fa-line-chart'
                }).addNotificationHandler(win.addCurve);
                dispGroup.add(btLine);

                var btSetRange = Controls.Button({
                    text: _TRL('Set range'),
                    //icon: 'fa-line-chart'
                }).addNotificationHandler(win.setRange);
                dispGroup.add(btSetRange);
            };

            win._appendSelectionControls = function(selGroup) {
                var btLinearFit = Controls.Button({
                    text: _TRL('Draw linear fit')
                }).addNotificationHandler(win.drawLinearFit);
                selGroup.add(btLinearFit);
            };

            win.render = function() {
                win.plot.render();
            };

            win.plot.getToolTipInfo = function (px, py) {
                var dataX = win.getAspectProperty('xvalue').data;
                var dataY = win.getAspectProperty('yvalue').data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                var propTooltip = null;
                if (win.hasAspectProperty('tooltip'))
                    propTooltip = win.getAspectProperty('tooltip');

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

                var content = null;
                if (propTooltip)
                    content: propTooltip.content2DisplayString(propTooltip.data[bestRowNr]);


                return {
                    px: coordXLogic2Win(dataX[bestRowNr]),
                    py: coordYLogic2Win(dataY[bestRowNr]),
                    ID: dataPrimKey[bestRowNr],
                    rowNr: bestRowNr,
                    content: content,
                    showPointer: true
                }
            };

            win.plot.onMouseClick = function(ev, info) {
                var tooltip = win.plot.getToolTipInfo(info.x, info.y);
                if (tooltip)
                    win.openPoint(tooltip.rowNr);
            };


            win.updateAspect = function(aspectId) {
                var all = !aspectId;
                if ((aspectId == 'xvalue') || all) {
                    var rangeX = win.getAspectProperty('xvalue').getValueRange();
                    rangeX.extendFraction(0.1);
                    win.plot.setXRange(rangeX.getMin(), rangeX.getMax());
                    win.plot.setXLabel(win.getAspectProperty('xvalue').getDispName());
                    win._curves = [];
                }
                if ((aspectId == 'yvalue') || all) {
                    var rangeY = win.getAspectProperty('yvalue').getValueRange();
                    rangeY.extendFraction(0.1);
                    win.plot.setYRange(rangeY.getMin(), rangeY.getMax());
                    win.plot.setYLabel(win.getAspectProperty('yvalue').getDispName());
                    win._curves = [];
                }
                if ((aspectId == 'xvalue') || aspectId == 'yvalue' || all){
                    win.parseData();
                }
                if ((aspectId == 'color') || all)
                    win.updateColorLegend();
                win.render();
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

            win._hasLassoSelected = function(points) {
                win.button_lassoSelection.setChecked(false);
                win.setInfoText('');

                function isPointInPoly(poly, pt) {
                    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
                        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
                        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
                        && (c = !c);
                    return c;
                }

                var dataX = win.getAspectProperty('xvalue').data;
                var dataY = win.getAspectProperty('yvalue').data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                var coordXLogic2Win = win.plot.coordXLogic2Win;
                var coordYLogic2Win = win.plot.coordYLogic2Win;
                var selList = [];
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var ptPx = coordXLogic2Win(dataX[rowNr]);
                    var ptPy = coordYLogic2Win(dataY[rowNr]);
                    if (isPointInPoly(points, {x:ptPx, y:ptPy}))
                        selList.push(dataPrimKey[rowNr]);
                }
                win.performRowSelected(selList);
            };

            win.plot.drawPlot = function(drawInfo) {
                var plot = win.plot;
                var ctx = drawInfo.ctx;

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


                var propSize = null;
                if (win.hasAspectProperty('size')) {
                    propSize = win.getAspectProperty('size');
                    var dataSize = propSize.data;
                }

                var usedRowNrs = [];
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    if ( (dataX[rowNr]!=null) && (dataY[rowNr]!=null) )
                    if (propSize) {
                        if (dataSize[rowNr] != null)
                            usedRowNrs.push(rowNr);
                    }
                    else
                        usedRowNrs.push(rowNr);
                }
                var rowNr = null;


                if (propSize) {
                    var minSizeVal = 1.0e99;
                    var maxSizeVal = -1.0e99;
                    for (var idx = 0; idx < usedRowNrs.length; idx++) {
                        rowNr = usedRowNrs[idx];
                        minSizeVal = Math.min(minSizeVal, dataSize[rowNr]);
                        maxSizeVal = Math.max(maxSizeVal, dataSize[rowNr]);
                    }
                }

                if (propSize) {
                    var order = [];
                    for (var idx = 0; idx < usedRowNrs.length; idx++) {
                        rowNr = usedRowNrs[idx];
                        order.push(-dataSize[rowNr]);
                    }
                }
                else { //sort random
                    var seed = 1;
                    function random_seeded() {
                        var x = Math.sin(seed++) * 10000;
                        return x - Math.floor(x);
                    }
                    var order = [];
                    for (var idx = 0; idx < usedRowNrs.length; idx++) {
                        order.push(random_seeded());
                    }
                }

                usedRowNrs.sort(function(idx1, idx2) {
                    var val1 = order[idx1];
                    var val2 = order[idx2];
                    var discr = ((val1 < val2) ? -1 : ((val1 > val2) ? 1 : 0));
                    return discr;
                });


                drawInfo.ctx.fillStyle = Color.Color(0,0,0,0.6).toStringCanvas();
                if (win.hasAspectProperty('label')) {
                    var propLabel = win.getAspectProperty('label');
                    var dataLabel = propLabel.data;
                    for (var idx = 0; idx < usedRowNrs.length; idx++) {
                        rowNr = usedRowNrs[idx];
                        plot.drawLabel(drawInfo, dataX[rowNr], dataY[rowNr], 4, propLabel.content2DisplayString(dataLabel[rowNr]));
                    }
                }


                var globalPointSize = win.ctrl_PointSize.getValue();
                var pointSize = globalPointSize;
                var drawOutline = win.ctrl_showOutline.getValue();
                drawInfo.ctx.fillStyle = Color.Color(0,0,255,win._opacity).toStringCanvas();
                ctx.strokeStyle = Color.Color(0,0,0,0.7*win._opacity).toStringCanvas();
                ctx.lineWidth=1;
                for (var idx = 0; idx < usedRowNrs.length; idx++) {
                    rowNr = usedRowNrs[idx];
                    if (propColor) {
                        drawInfo.ctx.fillStyle = propColor.getSingleColor(dataColor[rowNr]).changeOpacity(win._opacity).toStringCanvas();
                    }
                    if (propSize)
                        pointSize = globalPointSize*3*(0.1+(dataSize[rowNr]-minSizeVal)/(maxSizeVal-minSizeVal));
                    plot.drawPoint(drawInfo, dataX[rowNr], dataY[rowNr],pointSize, drawOutline);
                }

                pointSize = globalPointSize;
                var rowSelGet = win.dataFrame.objectType.rowSelGet;
                drawInfo.ctx.strokeStyle = Color.Color(255,0,0,0.5).toStringCanvas();
                for (var idx = 0; idx < usedRowNrs.length; idx++) {
                    rowNr = usedRowNrs[idx];
                    if (rowSelGet(dataPrimKey[rowNr])) {
                        if (propSize)
                            pointSize = globalPointSize*3*(0.1+(dataSize[rowNr]-minSizeVal)/(maxSizeVal-minSizeVal));
                        plot.drawSel(drawInfo, dataX[rowNr], dataY[rowNr], pointSize+2);
                    }
                }

                ctx.strokeStyle = Color.Color(255,0,0,0.5).toStringCanvas();
                ctx.lineWidth=2;
                var plotLimitXMin = plot.xScaler.getMinVisibleRange();
                var plotLimitXMax = plot.xScaler.getMaxVisibleRange();
                var plotLimitYMin = plot.yScaler.getMinVisibleRange();
                var plotLimitYMax = plot.yScaler.getMaxVisibleRange();
                var x=0, y=0, px=0, py=0;
                $.each(win._curves, function(idx, expr) {
                    ctx.beginPath();
                    for (var ptNr = 0; ptNr<=200; ptNr++) {
                        var match = false;
                        if (expr.indexOf('y=')==0) {
                            x = plotLimitXMin + ptNr*1.0/200 * (plotLimitXMax-plotLimitXMin);
                            y = eval(expr.substring(2));
                            match = true;
                        }
                        if (expr.indexOf('x=')==0) {
                            y = plotLimitYMin + ptNr*1.0/200 * (plotLimitYMax-plotLimitYMin);
                            x = eval(expr.substring(2));
                            match = true;
                        }
                        if (match) {
                            px = plot.coordXLogic2Win(x);
                            py = plot.coordYLogic2Win(y);
                            if (ptNr==0)
                                ctx.moveTo(px, py);
                            else
                                ctx.lineTo(px, py);
                        }
                    }
                    ctx.stroke();
                });
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
                ViewRow.create(win.dataFrame, win.getPrimKeyProperty().data[rowNr], win);
            };


            win.addCurve = function() {
                SimplePopups.TextEditBox('', _TRL('Enter the curve expression<br>(may be "y=f(x)" or "x=f(y)")'), _TRL('Add curve'), {}, function(expr) {
                    win._curves.push(expr);
                    win.render();
                });
            };

            win.setRange = function() {
                var pwin = PopupWindow.create({
                    title: 'Set range',
                    blocking:true,
                    autoCenter: true
                });

                var grp = Controls.Compound.GroupVert({separator:12});

                var btOK = Controls.Button({
                    text: _TRL('OK'),
                    icon: 'fa-check'
                })
                    .addNotificationHandler(function() {
                        pwin.onOK();
                    });

                var btCancel = Controls.Button({
                    text: _TRL('Cancel'),
                    icon: 'fa-times'
                })
                    .addNotificationHandler(function() {
                        pwin.close();
                    });

                var grd = Controls.Compound.Grid({});

                pwin.ctrlXMin = Controls.Edit({width:80, value: win.plot.getXRangeMin()});
                pwin.ctrlXMax = Controls.Edit({width:80, value: win.plot.getXRangeMax()});
                pwin.ctrlYMin = Controls.Edit({width:80, value: win.plot.getYRangeMin()});
                pwin.ctrlYMax = Controls.Edit({width:80, value: win.plot.getYRangeMax()});

                grd.setItem(0,1, '<b>Min</b>');
                grd.setItem(0,2, '<b>Max</b>');

                grd.setItem(1,0, '<b>X range</b>');
                grd.setItem(1,1, pwin.ctrlXMin);
                grd.setItem(1,2, pwin.ctrlXMax);

                grd.setItem(2,0, '<b>Y range</b>');
                grd.setItem(2,1, pwin.ctrlYMin);
                grd.setItem(2,2, pwin.ctrlYMax);

                grp.add(grd);

                grp.add(Controls.Compound.GroupHor({}, [btOK, btCancel]) );

                pwin.onOK = function() {
                    win.plot.setXRange(parseFloat(pwin.ctrlXMin.getValue()), parseFloat(pwin.ctrlXMax.getValue()));
                    win.plot.setYRange(parseFloat(pwin.ctrlYMin.getValue()), parseFloat(pwin.ctrlYMax.getValue()));
                    pwin.close();
                    win.render();
                };

                pwin.setRootControl(Controls.Compound.StandardMargin(grp));
                pwin.start();
                //SimplePopups.TextEditBox('', _TRL('Enter the curve expression<br>(may be "y=f(x)" or "x=f(y)")'), _TRL('Add curve'), {}, function(expr) {
                //    win._curves.push(expr);
                //    win.render();
                //});
            };


            win.initPlot = function() {
                win.updateColorLegend();
                win.parseData();
            };

            /**
             * Create text for display in info section of the plot
             * @param {[]} dataX: list of floats
             * @param {[]} dataY: list of floats
             * @returns {String}: info text to display
             * @private
             */
            win._infoText = function(dataX, dataY) {
                var correlation = Stats.correlationCoefficient(dataX, dataY);
                var slope_intercept = Stats.slopeIntercept(dataX, dataY);
                var slope = slope_intercept[0];
                var intercept = slope_intercept[1];
                var str = 'Correlation: ' + correlation + '<br>';
                str += 'Slope: ' + slope + '<br>';
                str += 'Intercept: ' + intercept + '<br>';
                return str
            };

            /**
             * Parse data, calculate properties and display them in the Display section of the plot.
             */
            win.parseData = function() {
                var dataX = win.getAspectProperty('xvalue').data;
                var dataY = win.getAspectProperty('yvalue').data;
                var correlation = Stats.correlationCoefficient(dataX, dataY);
                var str = win._infoText(dataX, dataY);
                win.corrCtrl.modifyText(str);
                win.parseSelectedData();
            };

            /**
             * Parse selected data, calculate properties and display them in the Display section of the plot.
             */
            win.parseSelectedData = function() {
                var dataX = win.getAspectProperty('xvalue').data;
                var dataY = win.getAspectProperty('yvalue').data;
                var dataPrimKey = win.getPrimKeyProperty().data;
                var dataSelX = [];
                var dataSelY = [];
                var rowSelGet = win.dataFrame.objectType.rowSelGet;
                for (var rowNr = 0; rowNr < dataX.length; rowNr++){
                    if (rowSelGet(dataPrimKey[rowNr])){
                        dataSelX.push(dataX[rowNr]);
                        dataSelY.push(dataY[rowNr]);
                    }
                }
                var str = 'Selection: '.bold() + '<br>';
                str += win._infoText(dataSelX, dataSelY);
                win.corrSelectCtrl.modifyText(str);
            };

            /**
             * Draw a linear fit through the current selected data
             */
            win.drawLinearFit = function(){
                if (win.dataFrame.objectType.rowSelGetList().length > 0){
                    var dataX = win.getAspectProperty('xvalue').data;
                    var dataY = win.getAspectProperty('yvalue').data;
                    var dataPrimKey = win.getPrimKeyProperty().data;
                    var dataSelX = [];
                    var dataSelY = [];
                    var rowSelGet = win.dataFrame.objectType.rowSelGet;
                    var selCount = 0;
                    for (var rowNr = 0; rowNr < dataX.length; rowNr++){
                        if (rowSelGet(dataPrimKey[rowNr])){
                            dataSelX.push(dataX[rowNr]);
                            dataSelY.push(dataY[rowNr]);
                        }
                    }
                    var slope_intercept = Stats.slopeIntercept(dataSelX, dataSelY);
                    var slope = slope_intercept[0];
                    var intercept = slope_intercept[1];
                    if (!isNaN(slope)){
                        var expr = 'y=' + slope.toString() + ' * x + ' + intercept.toString();
                        win._curves.push(expr);
                        win.render();
                    }
                    else
                        SimplePopups.ErrorBox(_TRL('Fit could not be calculated for current selection.'));
                }
                else
                    SimplePopups.ErrorBox(_TRL('No points are selected.'));
            };

            var propX = win.getAspectProperty('xvalue');
            var propY = win.getAspectProperty('yvalue');
            var rangeX = propX.getValueRange();
            var rangeY = propY.getValueRange();
            rangeX.extendFraction(0.1);
            rangeY.extendFraction(0.1);
            win.plot.setXLabel(propX.getDispName());
            win.plot.setYLabel(propY.getDispName());
            win.plot.setXRange(rangeX.getMin(), rangeX.getMax());
            win.plot.setYRange(rangeY.getMin(), rangeY.getMax());
            win.listen('DataFrameRowSelChanged', function(objectTypeId) {
                if (objectTypeId == win.dataFrame.objectType.typeId)
                    win.parseSelectedData();
            });

            win.init();
        };


        return PlotType;
    });

