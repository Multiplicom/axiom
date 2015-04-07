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
        "AXM/AXMUtils", "AXM/Color", "AXM/Panels/PanelCanvasZoomPan", "AXM/Windows/SimplePopups",
        "AXM/DataFrames/Plots/_GenericPlot",
        "AXM/DataFrames/DataTypes"

    ],
    function (
        require, $, _,
        AXMUtils, Color, PanelCanvasZoomPan, SimplePopups,
        _GenericPlot,
        DataTypes
    ) {

        var PlotType = _GenericPlot.createPlotType('bargraph', 'Bar graph');
        PlotType.addPlotAspect('category', 'Category', DataTypes.typeString, true);

        PlotType.create = function(dataFrame, aspectMap) {
            var win = PlotType.createGeneric(dataFrame, aspectMap);
            win.catSizeX = 20;

            win.plot = PanelCanvasZoomPan.create('', {scaleMarginY: 120});
            win.plot._directRedraw = true;
            win.plot.setZoomDirections(true, false);

            win.plot.drawXScale = function(drawInfo) {
                var plot = win.plot;
                var ctx = drawInfo.ctx;
                var scaleX = plot.getXScale();
                var offsetX = plot.getXOffset();
                var xL2S = function(vlx) {
                    return vlx *scaleX + offsetX;
                };
                var topY = drawInfo.sizeY - plot.scaleMarginY;
                ctx.save();
                ctx.font = "11px Arial";
                ctx.fillStyle = "rgb(0,0,0)";
                ctx.textAlign = 'right';
                $.each(win._categories, function(idx, category) {
                    var x1 = xL2S((idx+0) * win.catSizeX);
                    var x2 = xL2S((idx+1) * win.catSizeX);
                    ctx.save();
                    ctx.translate(Math.round((x1+x2)/2+3), topY+3);
                    ctx.rotate(-Math.PI/2);
                    ctx.fillText(category.dispName, 0, 0);
                    ctx.restore();
                });
                ctx.restore();
            };

            win.plot.drawYScale = function(drawInfo) {

            };


            win.plot.drawCenter = function(drawInfo) {
                var plot = win.plot;
                var ctx = drawInfo.ctx;
                var scaleX = plot.getXScale();
                var offsetX = plot.getXOffset();
                var scaleY = plot.getYScale();
                var offsetY = plot.getYOffset();
                plot.scaleX = scaleX; plot.offsetX = offsetX;
                drawInfo.scaleX = scaleX; drawInfo.offsetX = offsetX;
                drawInfo.scaleY = scaleY; drawInfo.offsetY = offsetY;

                var xL2S = function(vlx) {
                    return vlx *scaleX + offsetX;
                };
                var yL2S = function(vly) {
                    return vly *scaleY + offsetY;
                };

                var dataCat = win.getAspectProperty('category').data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                //count current selection
                var catSelMap = {};
                var rowSelGet = win.dataFrame.objectType.rowSelGet
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var cat = dataCat[rowNr];;
                    if (!catSelMap[cat])
                        catSelMap[cat] = { count: 0};
                    if (rowSelGet(dataPrimKey[rowNr])) {
                        catSelMap[cat].count += 1;
                    }
                }


                ctx.fillStyle="#FFFFFF";
                ctx.fillRect(0, 0, drawInfo.sizeX,  drawInfo.sizeY);

                ctx.strokeStyle =  Color.Color(0,0,0).toStringCanvas();

                $.each(win._categories, function(idx, category) {
                    var x1 = xL2S((idx+0) * win.catSizeX);
                    var x2 = xL2S((idx+1) * win.catSizeX);
                    var y1 = yL2S(0.0);
                    var y2 = yL2S(category.count*1.0/win._maxCount);
                    ctx.fillStyle=Color.Color(0.85,0.9,0.95).toStringCanvas();
                    ctx.beginPath();
                    ctx.rect(x1, y1, x2-x1, y2-y1);
                    ctx.fill();
                    ctx.stroke();

                    var selCount = catSelMap[category.name].count;
                    if (selCount > 0) {
                        var y2s = yL2S(selCount*1.0/win._maxCount);
                        ctx.fillStyle=Color.Color(1,0.0,0,0.5).toStringCanvas();
                        ctx.beginPath();
                        ctx.rect(x1+1, y1, (x2-x1)/2, y2s-y1);
                        ctx.fill();
                    }

                    ctx.save();
                    ctx.font = "11px Arial";
                    ctx.fillStyle = "rgb(0,0,0)";
                    ctx.translate(Math.round((x1+x2)/2+3), Math.round(y2)-2);
                    ctx.rotate(-Math.PI/2);
                    ctx.fillText(category.count, 0, 0);
                    ctx.restore();
                });

                //panel.drawPlot(drawInfo);

            };


            win.updateAspect = function(aspectId) {
                win.parseData();
                win.plot.render();
            };

            win.parseData = function() {
                var propCat = win.getAspectProperty('category');
                var dataCat = propCat.data;

                var catMap = {};
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var val = dataCat[rowNr];
                    if (!catMap[val]) {
                        catMap[val] = {
                            name: val,
                            dispName: propCat.content2DisplayString(val),
                            count: 0
                        }
                    }
                    catMap[val].count +=1 ;
                }
                win._categories = [];
                win._maxCount = 1;
                $.each(catMap, function(idx, cat) {
                    win._categories.push(cat);
                    win._maxCount = Math.max(win._maxCount, cat.count);
                });

                win.plot.setXRange(0, Math.max(500, win._categories.length*win.catSizeX));
                win.plot.setYRange(0, 1.2);
            };


            win.plot.onMouseClick = function(ev, info) {
                var xL2S = function(vlx) {
                    return vlx *win.plot.scaleX + win.plot.offsetX;
                };

                $.each(win._categories, function(idx, category) {
                    var x1 = xL2S((idx+0) * win.catSizeX);
                    var x2 = xL2S((idx+1) * win.catSizeX);
                    if ((info.x>=x1) && (info.x<x2))
                        win.openCategory(category);
                });
            };

            win.openCategory = function(catInfo) {
                var objectType = win.dataFrame.objectType;
                var selList = [];
                var dataCat = win.getAspectProperty('category').data;
                var dataPrimKey = win.getPrimKeyProperty().data;
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    if (dataCat[rowNr] == catInfo.name)
                        selList.push(dataPrimKey[rowNr]);
                }
                var actions = [
                    {
                        name: 'Add to selection',
                        action: function() {
                            $.each(selList, function(idx, rowId) {
                                objectType.rowSelSet(rowId, true);
                            });
                            objectType.rowSelNotifyChanged();
                        }
                    },
                    {
                        name: 'Replace selection',
                        action: function() {
                            objectType.rowSelClear();
                            $.each(selList, function(idx, rowId) {
                                objectType.rowSelSet(rowId, true);
                            });
                            objectType.rowSelNotifyChanged();
                        }
                    },
                ];
                SimplePopups.ActionChoiceBox(
                    'Bar graph',
                    '{propname}= {value}<br>({count} points)'.AXMInterpolate({
                        propname: win.getAspectProperty('category').getDispName(),
                        value: catInfo.dispName,
                        count: catInfo.count
                    }),
                    actions);
            }


            win.initPlot = function() {
                win.parseData();
            };


            win.init();
        };


        return PlotType;
    });

