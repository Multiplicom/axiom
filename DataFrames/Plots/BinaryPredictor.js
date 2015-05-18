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
        "AXM/AXMUtils", "AXM/Stats", "AXM/Controls/Controls", "AXM/Color", "AXM/Panels/PanelHtml", "AXM/Windows/SimplePopups",
        "AXM/DataFrames/Plots/_GenericPlot",
        "AXM/DataFrames/DataTypes"

    ],
    function (
        require, $, _,
        AXMUtils, Stats, Controls, Color, PanelHtml, SimplePopups,
        _GenericPlot,
        DataTypes
    ) {

        var PlotType = _GenericPlot.createPlotType('binpredictor', _TRL('Binary predictor'), 'fa-arrows-h');
        PlotType.addPlotAspect('binval', _TRL('Binary value'), DataTypes.typeBoolean, true);
        PlotType.addPlotAspect('predictor', _TRL('Predictor'), DataTypes.typeFloat, true);

        PlotType.create = function(dataFrame, aspectMap) {
            var win = PlotType.createGeneric(dataFrame, aspectMap);

            win.plot = PanelHtml.create('', {}).enableVScrollBar().enableHScrollBar();



            win._createDisplayControls = function(dispGroup) {

                win.ctrl_costFN = Controls.Edit({value: 1000, width: 60});
                dispGroup.add(Controls.Compound.GroupHor({}, ['Cost FN:&nbsp', win.ctrl_costFN]));

                win.ctrl_costFP = Controls.Edit({value: 100, width: 60});
                dispGroup.add(Controls.Compound.GroupHor({}, ['Cost FP:&nbsp', win.ctrl_costFP]));

                win.ctrl_costUN = Controls.Edit({value: 10, width: 60});
                dispGroup.add(Controls.Compound.GroupHor({}, ['Cost Undet:&nbsp', win.ctrl_costUN]));

                win.ctrl_costFN.addNotificationHandler(win.clear);
                win.ctrl_costFP.addNotificationHandler(win.clear);
                win.ctrl_costUN.addNotificationHandler(win.clear);

                var bt_Update = Controls.Button({text: 'Update'});
                bt_Update.addNotificationHandler(win.render);
                dispGroup.add(bt_Update);

                //win.ctrl_showEnhInfo = Controls.Check({text: _TRL('Show enhancement'), checked: false})
                //    .addNotificationHandler(function() {
                //        win.render();
                //    });
                //dispGroup.add(win.ctrl_showEnhInfo);
                //
                //win.ctrl_showFracInfo = Controls.Check({text: _TRL('Show fraction info'), checked: true})
                //    .addNotificationHandler(function() {
                //        win.render();
                //    });
                //dispGroup.add(win.ctrl_showFracInfo);
                //
                //win.ctrl_showSelInfo = Controls.Check({text: _TRL('Show selection info'), checked: true})
                //    .addNotificationHandler(function() {
                //        win.render();
                //    });
                //dispGroup.add(win.ctrl_showSelInfo);

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

            //win.parseData = function() {
            //    var propBinVal = win.getAspectProperty('binval');
            //    var propPredictor = win.getAspectProperty('predictor');
            //    var dataBinVal = propBinVal.data;
            //    var dataPredictor = propPredictor.data;
            //    var dataPrimKey = win.getPrimKeyProperty().data;
            //
            //};


            win.clear = function() {
                win.plot.setContent('Not updated');

            };


            win.render = function() {
                var propBinVal = win.getAspectProperty('binval');
                var propPredictor = win.getAspectProperty('predictor');
                var dataBinVal = propBinVal.data;
                var dataPredictor = propPredictor.data;
                var dataPrimKey = win.getPrimKeyProperty().data;

                //win.parseData();
                var content = '';

                var data = [];
                for (var i=0; i<dataBinVal.length; i++) {
                    if ((dataBinVal[i]!==null) && (dataPredictor[i]!==null))
                        data.push({ binval: dataBinVal[i], predictor: dataPredictor[i]});
                }
                data.sort(AXMUtils.ByProperty('predictor'));


                var valsNeg = [];
                var valsPos = [];
                $.each(data, function(idx, pt) {
                    if (pt.binval==false)
                        valsNeg.push(pt.predictor);
                    if (pt.binval==true)
                        valsPos.push(pt.predictor);
                });
                var countNeg = valsNeg.length;
                var countPos = valsPos.length;
                //content += 'Count negative: {countneg}<br>Count positive: {countpos}<br>'.AXMInterpolate({countneg: valsNeg.length, countpos: valsPos.length});

                content += '<h1>Parametric</h1>';
                var dfNeg = Stats.NormDfEstimator(valsNeg);
                dfNeg.calcParametric();
                content += '<h3>Negative</h3>Count= {ct}<br>Average= {av}<br>Standard deviation= {stdev}<br>'.AXMInterpolate({ct: dfNeg.getCount(), av: dfNeg.getMean(), stdev: dfNeg.getStdev() });
                var dfPos = Stats.NormDfEstimator(valsPos);
                dfPos.calcParametric();
                content += '<h3>Positive</h3>Count= {ct}<br>Average= {av}<br>Standard deviation= {stdev}<br>'.AXMInterpolate({ct: dfPos.getCount(), av: dfPos.getMean(), stdev: dfPos.getStdev() });

                content += '<h3>Distance</h3>Difference= {diff}<br><b>Weighted difference= {wdiff}</b>'.AXMInterpolate({
                    diff: Math.abs(dfNeg.getMean()-dfPos.getMean()),
                    wdiff: Math.abs(dfNeg.getMean()-dfPos.getMean())/((dfNeg.getStdev()+dfPos.getStdev())/2)
                });


                // make sure negatives are smaller than positives
                var fac = 1;
                if (dfNeg.getMean()>dfPos.getMean()) {
                    fac = -1;
                    data.sort(AXMUtils.ByPropertyReverse('predictor'));
                }

                var costFN = parseFloat(win.ctrl_costFN.getValue());
                var costFP = parseFloat(win.ctrl_costFP.getValue());
                var costUN = parseFloat(win.ctrl_costUN.getValue());

                var bestDivisionNeg =-1.0E99;

                var optimNeg = function() {
                    var ntot = 0;
                    var nn = 0;
                    var np = 0;
                    var bestCost = 1e99;
                    for (var idx=0; idx<data.length-1; idx++) {
                        var pt = data[idx];
                        ntot++;
                        if (pt.binval)
                            np++;
                        else
                            nn++;
                        var cost = costFN*np + costUN*(data.length-ntot);
                        var tryDivisionNeg = (pt.predictor+data[idx+1].predictor)/2.0;
                        if (cost<bestCost) {
                            bestCost = cost;
                            bestDivisionNeg = tryDivisionNeg;
                        }
                    }
                };

                var bestDivisionPos =1.0E99;

                var optimPos = function() {
                    var ntot = 0;
                    var nn = 0;
                    var np = 0;
                    var bestCost = 1e99;
                    for (var idx=data.length-1; idx>0; idx--) {
                        var pt = data[idx];
                        ntot++;
                        if (pt.binval)
                            np++;
                        else
                            nn++;
                        var cost = costFP*nn + costUN*(data.length-ntot);
                        var tryDivisionPos = (pt.predictor+data[idx-1].predictor)/2.0;
                        if ((cost<bestCost) && (tryDivisionPos>=bestDivisionNeg)) {
                            bestCost = cost;
                            bestDivisionPos = tryDivisionPos;
                        }
                    }
                };

                if (costFN>costFP) {
                    optimPos();
                    optimNeg();
                }
                else {
                    optimNeg();
                    optimPos();
                }

                //determine error counts
                var ctFP = 0;
                var ctFN = 0;
                var ctUN = 0;
                for (var idx=0; idx<data.length; idx++) {
                    var pt = data[idx];
                    var predNeg = false;
                    var predUN = false;
                    var predPos = false;
                    if (pt.predictor*fac < bestDivisionNeg*fac)
                        predNeg = true;
                    if (pt.predictor*fac > bestDivisionPos*fac)
                        predPos = true;
                    if (!predNeg && !predPos)
                        predUN = true;
                    if (pt.binval) {
                        if (predNeg) ctFN++;
                    }
                    else {
                        if (predPos) ctFP++;
                    }
                    if (predUN) ctUN++;
                }

                content += '<h1>Cost estimate</h1>';
                content += 'Negative limit= {lim}<br>'.AXMInterpolate({lim:bestDivisionNeg});
                content += 'Positive limit= {lim}<br>'.AXMInterpolate({lim:bestDivisionPos});
                content += 'FN= {fn}<br>'.AXMInterpolate({fn: ctFN});
                content += 'FP= {fp}<br>'.AXMInterpolate({fp: ctFP});
                content += 'UN= {un}<br>'.AXMInterpolate({un: ctUN});

                var totCost = ctFN*costFN + ctFP*costFP + ctUN*costUN;
                content += '<b>Cost= {cost}</b><br>'.AXMInterpolate({cost: totCost});

                win.plot.setContent(content);

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

