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

        var PlotType = _GenericPlot.createPlotType('histogram', _TRL('Histogram'), 'fa-area-chart');

        PlotType.addPlotAspect('value', _TRL('Value'), DataTypes.typeFloat, true);

        PlotType.create = function(dataFrame, aspectMap) {
            var win = PlotType.createGeneric(dataFrame, aspectMap);

            win.plot = PanelCanvasXYPlot.create('', {selectXDirOnly: true});
            win.plot._directRedraw = true; //might be changed
            win._opacity = 0.40;


            win._createDisplayControls = function(dispGroup) {

                win.ctrl_Resolution = Controls.Slider({
                    width:160,
                    minValue: -1,
                    maxValue: +1,
                    step: 0.01,
                    value: 0,
                    text: _TRL('Resolution')
                })
                    .addNotificationHandler(function() {
                        win.parseData();
                        win.paint();
                    });
                dispGroup.add(win.ctrl_Resolution);

                win.infoCtrl = Controls.Static({});
                win.infoSelectionCtrl = Controls.Static({});
                dispGroup.add(win.infoCtrl);
                dispGroup.add(win.infoSelectionCtrl);
            };

            win.paint = function() {
                win.plot.paint();
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

                var dataVal = win.getAspectProperty('value').data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                var binValuesSelected = [];
                for (var i=0; i<win._binCount; i++)
                    binValuesSelected.push(0);
                var rowSelGet = win.dataFrame.objectType.rowSelGet;
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    if (rowSelGet(dataPrimKey[rowNr]))
                        binValuesSelected[Math.floor((dataVal[rowNr]-win._binOffset)/win._binSize)] ++;
                }

                ctx.strokeStyle =  Color.Color(0,0,0).toStringCanvas();
                for (var binNr=0; binNr<win._binCount; binNr ++) {
                    var binCount = win._binValues[binNr];
                    var x1 = Math.round(xL2S(win._binOffset + (binNr+0) * win._binSize))+0.5;
                    var x2 = Math.round(xL2S(win._binOffset + (binNr+1) * win._binSize))+0.5;
                    var y1 = Math.round(yL2S(0.0))+0.5;
                    var y2 = Math.round(yL2S(binCount))+0.5;
                    ctx.fillStyle = Color.Color(0.8,0.8,0.8).toStringCanvas();
                    ctx.beginPath();
                    ctx.rect(x1, y1, x2-x1, y2-y1);
                    ctx.fill();
                    ctx.stroke();
                    var selCount = binValuesSelected[binNr];
                    if (selCount > 0) {
                        var y2s = yL2S(selCount);
                        ctx.fillStyle=Color.Color(1,0.0,0,0.5).toStringCanvas();
                        ctx.beginPath();
                        ctx.rect(x1+1, y1, (x2-x1), y2s-y1);
                        ctx.fill();
                    }
                }
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
                win.paint();
            };

            /**
             * Create text for display in info section of the plot
             * @param {[]} values: list of data values
             * @returns {String}: info text to display
             * @private
             */
            win._infoText = function(values) {

                var minVal = +1.0e99;
                var maxVal = -1.0e99;
                var sum = 0;
                var count = values.length;

                for (var rowNr = 0; rowNr < count; rowNr++) {
                    var val = values[rowNr];
                    if (val<minVal) minVal = val;
                    if (val>maxVal) maxVal = val;
                    sum += val;
                }

                var str = '';
                str += 'Min: ' + minVal + '<br>';
                str += 'Max: ' + maxVal + '<br>';
                str += 'Count: ' + count + '<br>';
                str += 'Sum: ' + sum + '<br>';
                var average = sum/count;
                str += 'Average: ' + average + '<br>';

                var stdev = 0;
                for (var i=0; i<values.length; i+= 1)
                    stdev += Math.pow(values[i]-average, 2.0);
                stdev = Math.sqrt(stdev/values.length);
                str += 'Stdev: ' + stdev + '<br>';

                function median(values) {
                    values.sort( function(a,b) {return a - b;} );
                    var half = Math.floor(values.length/2);
                    if(values.length % 2)
                        return values[half];
                    else
                        return (values[half-1] + values[half]) / 2.0;
                }

                str += 'Median: ' + median(values) + '<br>';

                return str
            };

            win.parseData = function() {
                var propVal = win.getAspectProperty('value');
                var dataVal = propVal.data;

                var values = [];
                var minVal = +1.0e99;
                var maxVal = -1.0e99;
                var count = 0;
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var val = dataVal[rowNr];
                    if (val !== null && !(isNaN(val))) {
                        values.push(val);
                        if (val<minVal) minVal = val;
                        if (val>maxVal) maxVal = val;
                        count ++;
                    }
                }

                var resolMultFac = Math.exp(2*win.ctrl_Resolution.getValue());

                var binSize = 1;
                if (minVal == maxVal)
                    binSize = minVal * 0.1;
                else {
                    var jumpPrototypes = [1, 2, 5];
                    var optimalbincount = Math.floor(Math.sqrt(count))*resolMultFac;
                    optimalbincount = Math.max(optimalbincount, 2);
                    optimalbincount = Math.min(optimalbincount, 200);
                    var optimalbinsize = (maxVal-minVal)*1.0/optimalbincount;
                    var mindist = 1.0e99;
                    $.each(jumpPrototypes, function(idx, jumpPrototype) {
                        var q=Math.floor(AXMUtils.log10(optimalbinsize/jumpPrototype));
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
                }

                win._binSize = binSize;
                win._binOffset = Math.floor(minVal/binSize)*binSize;
                win._binCount = Math.floor((maxVal-win._binOffset)/binSize)+1;
                win._binValues = [];
                for (var i=0; i<win._binCount; i++)
                    win._binValues.push(0);
                $.each(values, function(idx, val) {
                    var binNr = Math.floor((val-win._binOffset)/binSize);
                    if ((binNr<0)  || (binNr>=win._binCount))
                        AXMUtils.reportBug(_TRL('Invalid bin'));
                    win._binValues[binNr] += 1;
                });

                win._maxBinSize = 1;
                $.each(win._binValues, function(idx, value) {
                    if (value > win._maxBinSize)
                        win._maxBinSize = value;
                });


                var rangeX = AXMUtils.valueRange(win._binOffset, win._binOffset+win._binCount*win._binSize);
                rangeX.extendFraction(0.1);
                var rangeY = AXMUtils.valueRange(0, win._maxBinSize);
                rangeY.extendFraction(0.1);
                win.plot.setXRange(rangeX.getMin(), rangeX.getMax());
                win.plot.setYRange(rangeY.getMin(), rangeY.getMax());
                win.plot.setXLabel(propVal.getDispName());

                win.infoCtrl.modifyText(win._infoText(values));
                win.parseSelectedData();

            };

            /**
             * Parse selected data, calculate properties and display them in the Display section of the plot.
             */
            win.parseSelectedData = function() {
                var propVal = win.getAspectProperty('value');
                var dataVal = propVal.data;

                var dataPrimKey = win.getPrimKeyProperty().data;
                var rowSelGet = win.dataFrame.objectType.rowSelGet;

                var values = [];
                for (var rowNr = 0; rowNr < dataVal.length; rowNr++){
                    if (rowSelGet(dataPrimKey[rowNr])){
                        var val = dataVal[rowNr];
                        if (val !== null && !(isNaN(val))) {
                            values.push(val);
                        }
                    }
                }
                var str = 'Selection: '.bold() + '<br>';
                str += win._infoText(values);
                win.infoSelectionCtrl.modifyText(str);
            };

            win.modifySetting = function(settingKey, settingValue) {
                if (settingKey == "Resolution") {
                    win.ctrl_Resolution.setValue(settingValue);
                    return;
                }
                throw "Invalid plot setting: " + settingKey;
            };

            win.setXRange = function(mn, mx) {
                win.plot.setXRange(mn, mx);
                win.paint();
            };

            win.listen('DataFrameRowSelChanged', function(objectTypeId) {
                if (objectTypeId == win.dataFrame.objectType.typeId)
                    win.parseSelectedData();
            });


            win.init();
            return win;
        };

        return PlotType;
    });

