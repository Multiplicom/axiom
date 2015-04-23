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

        var PlotType = _GenericPlot.createPlotType('histogram', 'Multi-category histogram');

        PlotType.addPlotAspect('category', 'Category', DataTypes.typeString, true);
        PlotType.addPlotAspect('value', 'Value', DataTypes.typeFloat, true);

        PlotType.create = function(dataFrame, aspectMap) {
            var win = PlotType.createGeneric(dataFrame, aspectMap);

            win.plot = PanelCanvasXYPlot.create('', {selectXDirOnly: true});
            win.plot._directRedraw = true; //!!!
            win._opacity = 0.40;


            win._createDisplayControls = function(dispGroup) {
                win._ctrlNormalise = Controls.Check({text: 'Normalise per category', checked: false})
                    .addNotificationHandler(function() {
                        win.parseData();
                        win.plot.render();
                    });
                dispGroup.add(win._ctrlNormalise);

                win.colorLegendCtrl = Controls.Static({});
                dispGroup.add(win.colorLegendCtrl);
            };

            win.initPlot = function() {
                win.parseData();
            };


            win.plot.drawPlot = function(drawInfo) {
                var plot = win.plot;
                var ctx = drawInfo.ctx;
                var scaleX = plot.getXScale();
                var offsetX = plot.getXOffset();
                var scaleY = plot.getYScale();
                var offsetY = plot.getYOffset();
                plot.scaleX = scaleX; plot.offsetX = offsetX;
                plot.scaleY = scaleY; plot.offsetY = offsetY;
                drawInfo.scaleX = scaleX; drawInfo.offsetX = offsetX;
                drawInfo.scaleY = scaleY; drawInfo.offsetY = offsetY;
                var xL2S = win.plot.coordXLogic2Win;
                var yL2S = win.plot.coordYLogic2Win;

                var propCat = win.getAspectProperty('category');
                var dataVal = win.getAspectProperty('value').data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                //var binValuesSelected = [];
                //for (var i=0; i<win._binCount; i++)
                //    binValuesSelected.push(0);
                //var rowSelGet = win.dataFrame.objectType.rowSelGet;
                //for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                //    if (rowSelGet(dataPrimKey[rowNr]))
                //        binValuesSelected[Math.floor((dataVal[rowNr]-win._binOffset)/win._binSize)] ++;
                //}

                $.each(win._categories, function(idx, cat) {
                    ctx.strokeStyle =  propCat.getSingleColor(cat.catVal).toStringCanvas();
                    ctx.fillStyle =  propCat.getSingleColor(cat.catVal).toStringCanvas();
                    ctx.beginPath();
                    for (var binNr=0; binNr<win._binCount; binNr ++) {
                        var binCount = cat._binValues[binNr];
                        var x1 = Math.round(xL2S(win._binOffset + (binNr+0.5) * win._binSize))+0.5;
                        var y1 = Math.round(yL2S(binCount))+0.5;
                        if (binNr == 0)
                            ctx.moveTo(x1,y1);
                        else
                            ctx.lineTo(x1,y1);
                    }
                    ctx.stroke();
                    for (var binNr=0; binNr<win._binCount; binNr ++) {
                        var binCount = cat._binValues[binNr];
                        var x1 = Math.round(xL2S(win._binOffset + (binNr+0.5) * win._binSize))+0.5;
                        var y1 = Math.round(yL2S(binCount))+0.5;
                        ctx.beginPath();
                        ctx.arc(x1, y1, 3, 0, 2 * Math.PI, false);
                        ctx.closePath();
                        ctx.fill();
                    }
                });

            };

            win.plot.handleRectSelection = function(pt1, pt2) {
                var xMin = win.plot.coordXWin2Logic(Math.min(pt1.x, pt2.x));
                var xMax = win.plot.coordXWin2Logic(Math.max(pt1.x, pt2.x));

                var dataVal = win.getAspectProperty('value').data;
                var dataPrimKey = win.getPrimKeyProperty().data;
                var selList = [];
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    if ((dataVal[rowNr]>=xMin) && (dataVal[rowNr]<=xMax))
                        selList.push(dataPrimKey[rowNr]);
                }
                win.performRowSelected(selList);
            };


            win.updateAspect = function(aspectId) {
                win.parseData();
                win.plot.render();
            };

            win.parseData = function() {

                var propCat = win.getAspectProperty('category');
                var dataCat = propCat.data;

                win.colorLegendCtrl.modifyText('');

                var catMap = {};
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var val = dataCat[rowNr];
                    if (!catMap[val]) {
                        catMap[val] = {
                            catVal: val,
                            dispName: propCat.content2DisplayString(val),
                        }
                    }
                }
                win._categories = [];
                $.each(catMap, function(idx, cat) {
                    win._categories.push(cat);
                });



                var propVal = win.getAspectProperty('value');
                var dataVal = propVal.data;

                var values = [];
                var minVal = +1.0e99;
                var maxVal = -1.0e99;
                var count = 0;
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var val = dataVal[rowNr];
                    if (val !== null) {
                        values.push(val);
                        if (val<minVal) minVal = val;
                        if (val>maxVal) maxVal = val;
                        count ++;
                    }
                }

                var jumpPrototypes = [1, 2, 5];
                var optimalbincount = Math.floor(Math.sqrt(count/win._categories.length));
                optimalbincount = Math.max(optimalbincount, 2);
                optimalbincount = Math.min(optimalbincount, 200);
                var optimalbinsize = (maxVal-minVal)*1.0/optimalbincount;
                var mindist = 1.0e99;
                var binSize = 1;
                $.each(jumpPrototypes, function(idx, jumpPrototype) {
                    var q=Math.floor(Math.log10(optimalbinsize/jumpPrototype));
                    var TryJump1A = Math.pow(10, q) * jumpPrototype;
                    var TryJump1B = Math.pow(10, q + 1) * jumpPrototype;
                    if (Math.abs(TryJump1A - optimalbinsize) < mindist) {
                        mindist = Math.abs(TryJump1A - optimalbinsize);
                        binSize = TryJump1A;
                    }
                    if (Math.abs(TryJump1B - optimalbinsize) < mindist) {
                        mindist = Math.abs(TryJump1B - optimalbinsize);
                        binSize = TryJump1B;
                    }
                });

                win._binSize = binSize;
                win._binOffset = Math.floor(minVal/binSize)*binSize;
                win._binCount = Math.floor((maxVal-win._binOffset)/binSize)+1;

                $.each(win._categories, function(idx, cat) {
                    cat._binValues = [];
                    for (var i = 0; i < win._binCount; i++)
                        cat._binValues.push(0);
                });
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var cat = dataCat[rowNr];
                    var val = dataVal[rowNr];
                    if (val !== null) {
                        var binNr = Math.floor((val-win._binOffset)/binSize);
                        if ((binNr<0)  || (binNr>=win._binCount))
                            AXMUtils.reportBug('Invalid bin');
                        catMap[cat]._binValues[binNr] += 1;
                    }
                }

                if (win._ctrlNormalise.getValue()) {
                    $.each(win._categories, function(idx, cat) {
                        var totCount = 0;
                        $.each(cat._binValues, function(idx, value) {
                            totCount += value;
                        });
                        if (totCount == 0)
                            totCount = 1.0E-99;
                        $.each(cat._binValues, function(idx, value) {
                            cat._binValues[idx] = value*1.0/totCount;
                        });
                    });
                }

                win._maxBinSize = 1.0e-99;
                $.each(win._categories, function(idx, cat) {
                    $.each(cat._binValues, function(idx, value) {
                        if (value > win._maxBinSize)
                            win._maxBinSize = value;
                    });
                });

                var rangeX = AXMUtils.valueRange(win._binOffset, win._binOffset+win._binCount*win._binSize);
                rangeX.extendFraction(0.1);
                var rangeY = AXMUtils.valueRange(0, win._maxBinSize);
                rangeY.extendFraction(0.1);
                win.plot.setXRange(rangeX.getMin(), rangeX.getMax());
                win.plot.setYRange(rangeY.getMin(), rangeY.getMax());

                var legendData = propCat.mapColors(dataCat);
                var legendHtml = '';
                $.each(legendData, function(idx, legendItem) {
                    legendHtml += '<span style="background-color: {col};">&nbsp;&nbsp;&nbsp;</span>&nbsp;'.AXMInterpolate({col: legendItem.color.toString()});
                    legendHtml += legendItem.content;
                    legendHtml += '<br>';
                });
                win.colorLegendCtrl.modifyText(legendHtml);
                win.plot.setXLabel(propVal.getDispName());

            };


            win.init();
        };

        return PlotType;
    });

