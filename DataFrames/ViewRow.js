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
        "AXM/DataFrames/Query"
    ],
    function (
        require, $, _,
        AXMUtils, PopupWindow, Controls, SimplePopups,
        FrameQuery
    ) {

        var Module = {
        };

        Module.create = function(dataFrame, primKey, parentWin) {
            var win = PopupWindow.create({
                title: _TRL('Data point'),
                blocking:false,
                autoCenter: true
            });

            var dataPrimKey = dataFrame.getPrimKeyProperty().data;
            var rowNr = -1;
            for (var i = 0; i < dataFrame.getRowCount(); i++) {
                if (primKey == dataPrimKey[i])
                    rowNr = i;
            }
            if (rowNr < 0)
                AXMUtils.reportBug(_TRL('Invalid dataframe item'));

            var rootGrp = Controls.Compound.GroupVert({separator: 12});

            var grp = Controls.Compound.Grid({});
            rootGrp.add(Controls.Compound.VScroller(grp, 400));

            var rowData = {}
            $.each(dataFrame.getProperties(), function(idx, property) {
                grp.setItem(idx, 0, property.getDispName());
                grp.setItem(idx, 1, property.content2DisplayString(property.data[rowNr]));
                rowData[property.getId()] = property.data[rowNr];
                if (parentWin.performRowSelected) {
                    var filterButton = Controls.Button({
                        icon: 'fa-filter',
                        width : 25,
                        height: 19,
                        buttonClass : 'AXMButtonCommandBar',
                        iconSizeFraction: 0.9,
                    }).addNotificationHandler(function() {
                        win.filter(property);
                    });
                    grp.setItem(idx, 2, filterButton);
                }
                grp.setItem(idx, 3, '<span style="color:rgb(192,192,192);font-size:80%">' + property.getId() + '</span>');
            });

            var openHandler = dataFrame.getObjectType().getOpenHandler();
            if (openHandler) {
                var btOpen = Controls.Button({
                    text: _TRL('Open'),
                    icon: 'fa-arrow-right'
                }).addNotificationHandler(function() {
                    openHandler(primKey, rowData);
                });
                rootGrp.add(btOpen);
            }


            $.each(dataFrame.getRowOpenHandlerList(), function(idx, handlerInfo) {
                var btOpen = Controls.Button({
                    text: _TRL(handlerInfo.name),
                    icon: 'fa-arrow-right'
                }).addNotificationHandler(function() {
                    handlerInfo.handler(primKey, rowData);
                    win.close();
                });
                rootGrp.add(btOpen);
            });

            win.filter = function(property) {
                var value = property.data[rowNr];
                if (property.getDataType().isString())
                    value = "'"+value+"'";
                var expr = 'pt.' + property.getId() +' == ' + value;
                FrameQuery.create(dataFrame, expr, function(selList, expr) {
                    win.close();
                    parentWin.performRowSelected(selList, expr);
                });
            };

            win.setRootControl(Controls.Compound.StandardMargin(rootGrp));
            win.start();
        };

        return Module;
    });

