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
        "AXM/AXMUtils", "AXM/Msg", "AXM/Windows/PopupWindow", "AXM/Panels/Frame", "AXM/Panels/PanelForm", "AXM/Panels/PanelTable", "AXM/Controls/Controls", "AXM/Windows/SimplePopups", "AXM/Tables/TableData", "AXM/Tables/TableInfo",
        "AXM/DataFrames/ViewRow", "AXM/DataFrames/CalcProperty", "AXM/DataFrames/ExecuteCode", "AXM/DataFrames/CopyProperty", "AXM/DataFrames/Append"
    ],
    function (
        require, $, _,
        AXMUtils, Msg, PopupWindow, Frame, PanelForm, PanelTable, Controls, SimplePopups, TableData, TableInfo,
        ViewRow, CalcProperty, ExecuteCode, CopyProperty, Append
    ) {

        var Module = {
        };

        Module._activeWindows = [];

        Msg.listen('', 'CloseWindow', function(win) {
            for (var i=0; i<Module._activeWindows.length; i++) {
                if (Module._activeWindows[i] == win) {
                    Module._activeWindows.splice(i,1);
                    return;
                }
            }
        });


        Module.create = function(dataFrame) {

            var objectType = dataFrame.getObjectType();
            var typeId = 'df_'+objectType.getTypeId();
            var primKey = objectType.getPrimKey();

            var tableData = TableData.create(typeId, primKey);

            var tableInfo = TableInfo.tableInfo(typeId);

            tableData.resetBuffer = function() {
                tableData.sortIdx = [];
                for (var i=0; i<dataFrame.getRowCount(); i++)
                    tableData.sortIdx.push(i);
                var sortColId = tableData.getSortColumn();
                var sortInv = tableData.getSortInverse();
                if (sortColId) {
                    var sortVals = [];
                    for (var i=0; i<dataFrame.getRowCount(); i++)
                        sortVals.push(dataFrame.getRowInfo(i)[sortColId]);
                    tableData.sortIdx.sort(function(idx1, idx2) {
                        var val1 = sortVals[idx1];
                        var val2 = sortVals[idx2];
                        var discr = ((val1 < val2) ? -1 : ((val1 > val2) ? 1 : 0));
                        if (sortInv)
                            discr = -discr;
                        return discr;
                    });
                }
            };


            tableData.requireRowRange = function() {
                return true;
            };

            tableData.getRow = function(rowNr) {
                return dataFrame.getRowInfo(tableData.sortIdx[rowNr]);
            };

            tableData.getRowId = function(rowNr) {
                var row = tableData.getRow(rowNr);
                if (!row)
                    return null;
                return row[primKey];
            };

            tableData.getRowCount = function() {
                return dataFrame.getRowCount();
            };


            $.each(dataFrame.getProperties(), function(idx, propInfo) {
                var colInfo = tableInfo.addColumn(propInfo.getId());
                colInfo.setName(propInfo.getDispName());
                colInfo.content2DisplayString = propInfo.content2DisplayString;
                colInfo.enableSort();
            });

            tableData.resetBuffer();

            var Compound = Controls.Compound;
            var win = PopupWindow.create({
                title: '{name} (Table)'.AXMInterpolate({name: dataFrame.getName()}),
                blocking:false,
                autoCenter: true,
                resizable: true,
                sizeX: 700,
                sizeY: 500,
                canDock:true
            });

            win.dataFrame = dataFrame;
            Module._activeWindows.push(win);

            win.init = function() {
                var rootFrame = Frame.FrameSplitterHor();
                //rootFrame.setHalfSplitterSize(0);

                var formHeader = PanelForm.create('intro');
                rootFrame.addMember(Frame.FrameFinal(formHeader)).setFixedDimSize(Frame.dimX, 200);

                var headerGroup = Controls.Compound.GroupVert({}).setSeparator(17);
                formHeader.setRootControl(headerGroup);
                win.createControls(headerGroup);

                win.tableData = tableData;
                win.tableInfo = tableInfo;

                win.tableInfo.setOnOpenRow(function(rowNr) {
                    var primKey = dataFrame.getPrimKeyProperty().data[win.tableData.sortIdx[rowNr]];
                    ViewRow.create(dataFrame, primKey, win);
                });

                //win.tableInfo.makeCanSelect();

                //obj.tableInfo.setOnOpenRow(obj.onOpenedSample);
                win.tableFrame = PanelTable.createTableViewerFrame('tb_seqruns', win.tableData, win.tableInfo);
                win.tablePanel = win.tableFrame.getTablePanel();
                win.tablePanel.setStoreLayout(false);

                rootFrame.addMember(win.tableFrame);


                win.setRootFrame(rootFrame);
                win.start();
            };


            win.createControls = function(group) {

                var btViewPlot = Controls.Button({
                    width: 160,
                    height: 60,
                    text: _TRL('Create view'),
                    icon: 'fa-eye'
                })
                    .addNotificationHandler(function() {
                        dataFrame.promptPlot();
                    });

                var btCalcCol = Controls.Button({
                    width: 160,
                    height: 60,
                    text: _TRL('Calculate new property'),
                    icon: 'fa-calculator'
                })
                    .addNotificationHandler(function() {
                        CalcProperty.create(dataFrame, '', function() {
                            win.close();
                            Module.create(dataFrame);
                        });
                    });

                var btExec = Controls.Button({
                    width: 160,
                    height: 60,
                    text: _TRL('Execute script for each row'),
                    icon: 'fa-terminal'
                })
                    .addNotificationHandler(function() {
                        ExecuteCode.create(dataFrame, '', function() {
                            win.close();
                            Module.create(dataFrame);
                        });
                    });

                var btCopyCol = Controls.Button({
                    width: 160,
                    height: 60,
                    text: _TRL('Import property from other dataframe'),
                    icon: 'fa-copy'
                })
                    .addNotificationHandler(function() {
                        CopyProperty.create(dataFrame, function() {
                            win.close();
                            Module.create(dataFrame);
                        });
                    });

                var btAppend = Controls.Button({
                    width: 160,
                    height: 60,
                    text: _TRL('Append other dataframe'),
                    icon: 'fa-plus-square'
                })
                    .addNotificationHandler(function() {
                        Append.create(dataFrame, function() {
                            win.close();
                            Module.create(dataFrame);
                        });
                    });

                var btSaveLocal = Controls.Button({
                    width: 160,
                    height: 60,
                    text: _TRL('Save to local computer'),
                    icon: 'fa-cloud-download'
                })
                    .addNotificationHandler(function() {
                        dataFrame.saveLocalFile();
                    });

                group.add(Controls.Compound.StandardMargin(Controls.Compound.GroupVert({}, [
                    btViewPlot,
                    btCalcCol,
                    btExec,
                    btCopyCol,
                    btAppend,
                    btSaveLocal
                ])));


                win.createSelectionTools(group);
            };


            win.createSelectionTools = function(rootGrp) {
                //var Controls = AXM.Controls;
                //var Compound = Controls.Compound;
                //
                //win._selectionActionButtons = [];
                //
                //var selectionGroup = Compound.GroupVert({separator: 6});
                //rootGrp.add(Compound.Section(Compound.StandardMargin(selectionGroup), 'Selected files'));
                //win._controls.selectedItemsText = Controls.Static({text:''});
                //selectionGroup.add(win._controls.selectedItemsText);
                //
                //var button_clear = Controls.Button({
                //    icon: 'fa-times',
                //    text: "Clear selection",
                //    width: 130,
                //    height: 50,
                //    iconSizeFraction: 1.4
                //}).addNotificationHandler(function() { win.tableData.clearSelection() });
                //win._selectionActionButtons.push(button_clear);
                //
                //var button_delete = Controls.Button({
                //    icon: 'fa-trash',
                //    text: "Delete selected files",
                //    width: 130,
                //    height: 50,
                //    iconSizeFraction: 1.4
                //}).addNotificationHandler(win.deleteSelection);
                //win._selectionActionButtons.push(button_delete);
                //
                //selectionGroup.add(Compound.GroupHor({}, [button_clear, button_delete]) );

            };

            win._updateSelectedStatus = function() {
                //var count = win.tableData.getSelectedItemCount();
                //var txt = 'None selected';
                //if (count==1)
                //    txt = 'One file selected';
                //if (count>1)
                //    txt = count + ' files selected';
                //win._controls.selectedItemsText.modifyText(txt);
                //$.each(win._selectionActionButtons, function(idx, button) {
                //    button.setEnabled(count>0);
                //});
            };


            win.init();

        };

        return Module;
    });

