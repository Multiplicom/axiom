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
        "AXM/AXMUtils", "AXM/Controls/Controls", "AXM/Color", "AXM/Panels/PanelHtml", "AXM/Windows/SimplePopups",
        "AXM/DataFrames/Plots/_GenericPlot",
        "AXM/DataFrames/DataTypes"

    ],
    function (
        require, $, _,
        AXMUtils, Controls, Color, PanelHtml, SimplePopups,
        _GenericPlot,
        DataTypes
    ) {

        var PlotType = _GenericPlot.createPlotType('crosstab', _TRL('Crosstab'), 'fa-bar-chart');
        PlotType.addPlotAspect('category1', _TRL('Rows category'), DataTypes.typeAnyCategorical, true);
        PlotType.addPlotAspect('category2', _TRL('Columns category'), DataTypes.typeAnyCategorical, true);

        PlotType.create = function(dataFrame, aspectMap) {
            var win = PlotType.createGeneric(dataFrame, aspectMap);

            win.plot = PanelHtml.create('', {}).enableVScrollBar().enableHScrollBar();



            win._createDisplayControls = function(dispGroup) {

                win.ctrl_showEnhInfo = Controls.Check({text: _TRL('Show enhancement'), checked: false})
                    .addNotificationHandler(function() {
                        win.render();
                    });
                dispGroup.add(win.ctrl_showEnhInfo);

                win.ctrl_showFracInfo = Controls.Check({text: _TRL('Show fraction info'), checked: true})
                    .addNotificationHandler(function() {
                        win.render();
                    });
                dispGroup.add(win.ctrl_showFracInfo);

                win.ctrl_showSelInfo = Controls.Check({text: _TRL('Show selection info'), checked: true})
                    .addNotificationHandler(function() {
                        win.render();
                    });
                dispGroup.add(win.ctrl_showSelInfo);

                //
                //win.ctrlSortType = Controls.DropList({}).addNotificationHandler(function() {
                //    win.parseData();
                //    win.plot.render();
                //});
                //win.ctrlSortType.addState('val', _TRL("Alphabetical"));
                //win.ctrlSortType.addState('count', _TRL("Count"));
                //dispGroup.add(Controls.Compound.GroupVert({}, [
                //    _TRL('Sort by:'),
                //    win.ctrlSortType
                //]));
                //win.colorLegendCtrl = Controls.Static({});
                //dispGroup.add(win.colorLegendCtrl);

            };

            win.updateAspect = function(aspectId) {
                win.render();
            };

            win.parseData = function() {
                var propCat1 = win.getAspectProperty('category1');
                var dataCat1 = propCat1.data;
                var propCat2 = win.getAspectProperty('category2');
                var dataCat2 = propCat2.data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                win.cats1 = [];
                var cat1Map = {};
                win.cats2 = [];
                var cat2Map = {};
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var val1 = dataCat1[rowNr];
                    if (!cat1Map[val1]) {
                        cat1Map[val1] = {
                            catVal: val1,
                            dispName: propCat1.content2DisplayString(val1),
                            count: 0
                        };
                        win.cats1.push(cat1Map[val1]);
                    }
                    cat1Map[val1].count +=1;

                    var val2 = dataCat2[rowNr];
                    if (!cat2Map[val2]) {
                        cat2Map[val2] = {
                            catVal: val2,
                            dispName: propCat2.content2DisplayString(val2),
                            count: 0
                        };
                        win.cats2.push(cat2Map[val2]);
                    }
                    cat2Map[val2].count +=1;

                }

                win.cats1.sort(AXMUtils.ByProperty('dispName'));
                win.cats2.sort(AXMUtils.ByProperty('dispName'));

                var cat1Map = {};
                $.each(win.cats1, function(idx, cat) { cat1Map[cat.catVal]=idx; });
                var cat2Map = {};
                $.each(win.cats2, function(idx, cat) { cat2Map[cat.catVal]=idx; });



                win.cellData = [];
                $.each(win.cats1, function(idx1, cat1) {
                    var row = [];
                    $.each(win.cats2, function(idx2, cat2) {
                        row.push({
                            count: 0,
                            selCount: 0
                        })
                    });
                    win.cellData.push(row);
                });

                var rowSelGet = win.dataFrame.objectType.rowSelGet;
                win.totCount = 0;
                for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                    var val1 = dataCat1[rowNr];
                    var val2 = dataCat2[rowNr];
                    var cellInfo = win.cellData[cat1Map[val1]][cat2Map[val2]]
                    cellInfo.count++;
                    if (rowSelGet(dataPrimKey[rowNr]))
                        cellInfo.selCount++;
                    win.totCount++;
                }

                win.maxCellCount = 0;
                $.each(win.cats1, function(idx1, cat1) {
                    $.each(win.cats2, function(idx2, cat2) {
                        var cellInfo = win.cellData[idx1][idx2];
                        cellInfo.enhancement = cellInfo.count*1.0 / (cat1.count*cat2.count) * win.totCount-1;
                    });
                });

                win.maxCellCount = 0;
                win.maxCellEnhancement = 0.1;
                $.each(win.cats1, function(idx1, cat1) {
                    $.each(win.cats2, function(idx2, cat2) {
                        var cellInfo = win.cellData[idx1][idx2];
                        win.maxCellCount = Math.max(win.maxCellCount, cellInfo.count);
                        win.maxCellEnhancement = Math.max(win.maxCellEnhancement, Math.abs(cellInfo.enhancement));
                    });
                });
                win.maxCellEnhancement = Math.min(win.maxCellEnhancement, 5);
            };

            var writeFrac = function(val) {
                return (100*val).toFixed(2)+'%';
            };


            win.renderHeadInfo = function() {
                var content = '';
                content += '<table class="AXMCrossTableCell">';

                content += '<tr><th>Count:</th><td><b>{val}</b></td></tr>'.AXMInterpolate({
                    val: win.totCount
                });

                content += '</table>';
                return content;
            };


            win.renderCatInfo = function(propInfo, info) {
                var content = '';
                content += '<div class="AXMCrossTableSmall">'+propInfo.getDispName()+'</div>';
                content += '<div class="AXMCrossTableLarge">'+info.dispName+'</div>';
                content += '<table class="AXMCrossTableCell">';

                content += '<tr><th>Count:</th><td><b>{val}</b></td></tr>'.AXMInterpolate({
                    val: info.count
                });

                if (win._dispFracInfo) {
                    content += '<tr><th>Frac&nbsp;tot:</th><td>{val}</td></tr>'.AXMInterpolate({
                        val: writeFrac(info.count * 1.0 / win.totCount)
                    });
                }

                content += '</table>';
                return content;
            };

            win.renderCellInfo = function(idx1, idx2) {
                var content = '';
                var content = '<table class="AXMCrossTableCell">';
                var cellInfo = win.cellData[idx1][idx2];


                content += '<tr><th>Count:</th><td><b>{val}</b></td></tr>'.AXMInterpolate({
                    val: cellInfo.count
                });

                if (win._dispEnhInfo) {
                    content += '<tr><th>Enhanc:</th><td>{val}</td></tr>'.AXMInterpolate({
                        val: writeFrac(cellInfo.enhancement)
                    });
                }

                if (win._dispFracInfo) {
                    content += '<tr><th>Frac&nbsp;tot:</th><td>{val}</td></tr>'.AXMInterpolate({
                        val: writeFrac(cellInfo.count * 1.0 / win.totCount)
                    });
                    content += '<tr><th>Frac&nbsp;Row:</th><td>{val}</td></tr>'.AXMInterpolate({
                        val: writeFrac(cellInfo.count * 1.0 / win.cats1[idx1].count)
                    });
                    content += '<tr><th>Frac&nbsp;Col:</th><td>{val}</td></tr>'.AXMInterpolate({
                        val: writeFrac(cellInfo.count * 1.0 / win.cats2[idx2].count)
                    });
                }

                if (win._dispSelInfo) {
                    content += '<tr><th>Sel:</th><td>{val}</td></tr>'.AXMInterpolate({
                        val: cellInfo.selCount
                    });
                    content += '<tr><th>Frac&nbsp;Sel:</th><td>{val}</td></tr>'.AXMInterpolate({
                        val: writeFrac(cellInfo.selCount*1.0/Math.max(cellInfo.count,1))
                    });
                }


                content += '</table>';
                return content;
            };

            win.render = function() {
                var propCat1 = win.getAspectProperty('category1');
                var propCat2 = win.getAspectProperty('category2');

                win._dispEnhInfo = win.ctrl_showEnhInfo.getValue();
                win._dispSelInfo = win.ctrl_showSelInfo.getValue();
                win._dispFracInfo = win.ctrl_showFracInfo.getValue();

                win.parseData();
                var content = '<table class="AXMCrossTable">';

                content += '<tr>';
                content += '<th><div>';
                content += win.renderHeadInfo();
                content += '</div></th>';
                $.each(win.cats2,  function(idx2, cat2Info) {
                    content += '<th><div>';
                    content += win.renderCatInfo(propCat2, cat2Info);
                    content += '</div></th>';
                });
                content += '</tr>';

                $.each(win.cats1,  function(idx1, cat1Info) {
                    content += '<tr>';

                    content += '<th><div>';
                    content += win.renderCatInfo(propCat1, cat1Info);
                    content += '</div></th>';

                    $.each(win.cats2,  function(idx2, cat2Info) {
                        var cellInfo = win.cellData[idx1][idx2];
                        cellInfo._id = AXMUtils.getUniqueID();
                        var colorFr = cellInfo.count*1.0/win.maxCellCount;
                        var col = Color.Color(1-0.6*colorFr, 1-0.3*colorFr*colorFr, 1);
                        if (win._dispEnhInfo) {
                            colorFr = cellInfo.enhancement*1.0/win.maxCellEnhancement;
                            if (colorFr>0) {
                                if (colorFr > 1) colorFr = 1;
                                col = Color.Color(1-0.6*colorFr, 1-0.3*colorFr*colorFr, 1);
                            }
                            else {
                                colorFr = -colorFr;
                                if (colorFr > 1) colorFr = 1;
                                col = Color.Color(1, 1-0.3*colorFr*colorFr, 1-0.6*colorFr);
                            }
                        }
                        content += '<td style="background-color: {col}"><div id="{id}" style="height:100%;padding:8px">'.AXMInterpolate({id: cellInfo._id, col: col.toString()});
                        content += win.renderCellInfo(idx1, idx2);
                        content += '</div></td>';
                    });

                    content += '</tr>';
                });

                content += '</table>';

                win.plot.setContent(content);

                $.each(win.cats1,  function(idx1, cat1Info) {
                    $.each(win.cats2,  function(idx2, cat2Info) {
                        var cellInfo = win.cellData[idx1][idx2];
                        $('#'+cellInfo._id).click(function() {
                            var selList = [];
                            var dataCat1 = win.getAspectProperty('category1').data;
                            var dataCat2 = win.getAspectProperty('category2').data;
                            var dataPrimKey = win.getPrimKeyProperty().data;
                            for (var rowNr = 0; rowNr < win.dataFrame.getRowCount(); rowNr++) {
                                if ((dataCat1[rowNr] == cat1Info.catVal) && (dataCat2[rowNr] == cat2Info.catVal))
                                    selList.push(dataPrimKey[rowNr]);
                            }
                            var dispText = '';
                            dispText += _TRL('{propname}= {value}').AXMInterpolate({
                                propname: win.getAspectProperty('category1').getDispName(),
                                value: cat1Info.dispName
                            });
                            dispText += _TRL('{propname}= {value}').AXMInterpolate({
                                propname: win.getAspectProperty('category2').getDispName(),
                                value: cat2Info.dispName
                            });
                            win.performRowSelected(selList, dispText);
                        })
                    });

                    content += '</tr>';
                });

            };


            win.initPlot = function() {
//                win.render();
            };


            win.plot.render = win.render;
            win.init();
            win.render();
        };


        return PlotType;
    });

