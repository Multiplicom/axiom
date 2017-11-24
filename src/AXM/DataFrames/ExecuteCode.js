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
        "AXM/DataFrames/DataTypes"
    ],
    function (
        require, $, _,
        AXMUtils, PopupWindow, Controls, SimplePopups,
        DataTypes
    ) {

        var Module = {
        };
        Module.lastExpr = '';

        Module.create = function(dataFrame, startExpr, onCompleted) {

            var win = PopupWindow.create({
                title: _TRL('Execute script for each row'),
                blocking:true,
                autoCenter: true
            });

            if (startExpr)
                Module.lastExpr = startExpr;
            var grp = Controls.Compound.GroupVert({separator: 15});
            grp.add(_TRL('<i>Use the following tokens in the script:</i>'));
            var grd = Controls.Compound.Grid({sepH:4, sepV: 2});
            $.each(dataFrame.getProperties(), function(idx, property) {
                var filterButton = Controls.Button({
                    icon: 'fa-plus-square',
                    width : 25,
                    height: 19,
                    buttonClass : 'AXMButtonCommandBar',
                    iconSizeFraction: 0.9
                }).addNotificationHandler(function() {
                    var str = win.ctrlExpr.getValue()+'pt.'+property.getId();
                    win.ctrlExpr.setValue(str);
                    win.ctrlExpr.setFocus();
                });
                grd.setItem(idx, 0, filterButton);
                grd.setItem(idx, 1, '<b>pt.'+property.getId()+'</b>');
                grd.setItem(idx, 2, property.getDispName());
            });
            grp.add(Controls.Compound.VScroller(grd,250));

            win.ctrlExpr = Controls.TextArea({
                width: 500, lineCount:6,
                fixedfont: true,
                noWrap: true,
                value: Module.lastExpr
            }).setHasDefaultFocus();
            grp.add(win.ctrlExpr);


            var btOK = Controls.Button({
                text: _TRL('Execute'),
                icon: 'fa-check'
            }).addNotificationHandler(function() {
                win.execute();
            });
            grp.add(btOK);

            win.execute = function() {
                win.close();
                var expr = win.ctrlExpr.getValue();
                Module.lastExpr =expr;
                for (var rowNr = 0; rowNr < dataFrame.getRowCount(); rowNr++) {
                    var newVal = null;
                    try {
                        var pt = {};
                        $.each(dataFrame.getProperties(), function(idx, property) {
                            pt[property.getId()] = property.data[rowNr];
                        });
                        eval(expr);
                        $.each(dataFrame.getProperties(), function(idx, property) {
                            property.data[rowNr] = pt[property.getId()];
                        });
                    }
                    catch(err) {
                    }
                }
                onCompleted();
            };


            win.setRootControl(Controls.Compound.StandardMargin(grp));
            win.start();
        };

        return Module;
    });

