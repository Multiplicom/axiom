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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Controls/Controls", "AXM/Panels/Frame", "AXM/Panels/PanelBase",
        "AXM/Tables/TableInfo"
    ],
    function (
        require, $, _,
        AXMUtils, DOM, Controls, Frame, PanelBase,
        TableInfo
    ) {

        var Module = {};

        Module.create = function(id, tableData, tableInfo) {
            var panel = PanelBase.create(id);
            AXMUtils.Test.checkIsType(tableData, '@TableData');
            AXMUtils.Test.checkIsType(tableInfo, '@TableInfo');

            panel._tableData = tableData;
            panel._tableInfo = tableInfo;


            panel._tableLineCount = 20;
            panel._tableOffset = 0;
            panel._currentRowNr = 0;

            panel._columns = [];

            if (tableInfo.canOpenRow()) {
                var openerCol = TableInfo.colInfo('_opener_');
                openerCol.isOpener = true;
                openerCol._dispSize = 25;
                openerCol.setName('');
                panel._columns.push(openerCol);
            }

            $.each(tableInfo.getColumns(), function(idx, col) {
                panel._columns.push(col);
            });

            panel._colIsRightPart = function(colInfo) {
                return (!colInfo.isOpener);
            };

            panel._getSubId = function(ext) {
                return panel._id + '_' + ext;
            };

            panel._getSub$El = function(ext) {
                return $('#' + panel._getSubId(ext));
            };

            panel._getColSubId = function(colNr, ext) {
                return panel._id + '_col_' + colNr + '_' + ext;
            };

            panel._getColSub$El = function(colNr, ext) {
                return $('#' + panel._getColSubId(colNr, ext));
            };

            panel.createHtml = function() {
                panel._divid_leftHeadRow = panel._getSubId('leftheadrow');
                panel._divid_leftBody = panel._getSubId('leftbody');
                panel._divid_rightHeadRow = panel._getSubId('rightheadrow');
                panel._divid_rightBody = panel._getSubId('rightbody');

                var divRoot = DOM.Div({})
                    .addStyle('width','100%')
                    .addStyle('height','100%')
                    .addStyle('overflow-x','hidden')
                    .addStyle('overflow-y','hidden')
                    .addStyle('white-space','nowrap');

                var divLeftTableContainer = DOM.Div({parent: divRoot, id: panel._getSubId('leftTableScrollContainer')})
                    //.addStyle('width','100px')
                    .addStyle('height','100%')
                    .addStyle('display', 'inline-block')
                    .addStyle('background-color','rgb(247,247,247)');

                var divRightTableContainer = DOM.Div({parent: divRoot, id: panel._getSubId('rightTableScrollContainer')})
                    //.addStyle('width','100%')
                    .addStyle('height','100%')
                    .addStyle('overflow-x','scroll')
                    .addStyle('overflow-y','hidden')
                    .addStyle('display', 'inline-block')
                    .addStyle('background-color','rgb(247,247,247)');


                ///////////// Left table ////////////////////////////////

                var divLeftTable = DOM.Create('table', {parent: divLeftTableContainer})
                    .addCssClass('AXMPgTableLeft');
                var colLeftGroup = DOM.Create('colgroup', {parent: divLeftTable});
                var divLeftTableHead = DOM.Create('thead', {parent: divLeftTable});
                var divLeftTableHeadRow = DOM.Create('tr', {parent: divLeftTableHead, id: panel._divid_leftHeadRow});
                var divLeftTableBody = DOM.Create('tbody', {parent: divLeftTable, id:panel._divid_leftBody});


                ///////////// Right table ///////////////////////////////

                var divRightTable = DOM.Create('table', {parent: divRightTableContainer})
                    .addCssClass('AXMPgTableRight');
                var colRightGroup = DOM.Create('colgroup', {parent: divRightTable});
                var divRightTableHead = DOM.Create('thead', {parent: divRightTable});
                var divRightTableHeadRow = DOM.Create('tr', {parent: divRightTableHead, id: panel._divid_rightHeadRow});
                var divRightTableBody = DOM.Create('tbody', {parent: divRightTable, id:panel._divid_rightBody});



                $.each(panel._columns, function(colNr, colInfo) {
                    var col = DOM.Create('col', {
                        parent: panel._colIsRightPart(colInfo) ? colRightGroup : colLeftGroup,
                        id: panel._getColSubId(colNr,'')
                    })
                        .addStyle('width', colInfo._dispSize + 'px')
                        .addStyle('overflow','hidden')
                });



                return divRoot.toString();
            };

            panel.attachEventHandlers = function() {
                var $ElLeftHeadRow = $('#'+panel._divid_leftHeadRow);
                var $ElRightHeadRow = $('#'+panel._divid_rightHeadRow);
                var $ElRightBody = $('#'+panel._divid_rightBody);
                var $ElLeftBody = $('#'+panel._divid_leftBody);

                var headerLeftHtml = '';
                var headerRightHtml = '';
                $.each(panel._columns, function(colNr, colInfo) {
                    var cell = DOM.Create('th', {id:panel._getColSubId('header',colNr)});
                    cell.addElem(colInfo.getName());
                    if (colInfo.canSort()) {
                        DOM.Div({parent: cell}).addCssClass('AXMPgTableColSortBox').addElem('<i class="fa fa-arrow-down"></i>');
                    }
                    if (colInfo.canOpen()) {
                        cell.addStyle('cursor','pointer');
                        DOM.Div({parent: cell, id: panel._getColSubId('open', colNr)})
                            .addCssClass('AXMPgTableColOpenBox')
                            .addElem('<i class="fa fa-external-link-square"></i>');
                    }
                    DOM.Div({parent: cell, id: panel._getColSubId('dragger',colNr)}).addCssClass('AXMPgTableRightColDragger');
                    if (panel._colIsRightPart(colInfo))
                        headerRightHtml += cell.toString();
                    else
                        headerLeftHtml += cell.toString();
                });
                $ElLeftHeadRow.html(headerLeftHtml);
                $ElRightHeadRow.html(headerRightHtml);

                $.each(panel._columns, function(colNr, colInfo) {
                    var $ElColDrag = panel._getColSub$El('dragger', colNr);
                    var $ElCol =panel._getColSub$El(colNr, '');
                    var $ElColHeader =panel._getColSub$El('header', colNr);
                    if (colInfo.canOpen())
                        $ElColHeader.mousedown(function(ev) {
                            colInfo.callOnOpen();
                            return false;
                        });
                    var dispSizeStart = 0;
                    AXMUtils.create$ElDragHandler($ElColDrag,
                        function() {
                            dispSizeStart = colInfo._dispSize;
                        },
                        function(params) {
                            colInfo._dispSize = Math.max(35, dispSizeStart + params.diffTotalX);
                            $ElCol.width(colInfo._dispSize);
                        },
                        function() {

                        }
                    )
                });

                $ElLeftBody.click(function(event) {
                    panel._handleCellClicked($(event.target));
                });
                $ElRightBody.click(function(event) {
                    panel._handleCellClicked($(event.target));
                });

                AXMUtils.create$ElScrollHandler(panel._getSub$El('leftTableScrollContainer'), panel._handleScrolled);
                AXMUtils.create$ElScrollHandler(panel._getSub$El('rightTableScrollContainer'), panel._handleScrolled);

                $('#'+panel._divid_rightBody).contextmenu(function(event) {
                    //alert('contextmenu');
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                });
                //$('#'+panel._divid_leftBody+'').dblclick(function(event) {
                //    panel._handleCellDoubleClicked($(event.target));
                //    event.stopPropagation();
                //    event.preventDefault();
                //    return false;
                //});
                //$('#'+panel._divid_rightBody+'').dblclick(function(event) {
                //    panel._handleCellDoubleClicked($(event.target));
                //    event.stopPropagation();
                //    event.preventDefault();
                //    return false;
                //});


                panel.renderTableContent();
            };


            panel.renderCell = function(rowNr, colNr, rowData, colInfo) {
                if (colInfo.isOpener) {
                    var cell = '<div class="AXMPgTableLinkCell">';
                    //cell += '<div style="display:inline-block;height:100%;width:1px;vertical-align:middle"/>';
                    cell += '<div class="AXMPgTableLinkIcon"><i class="fa fa-external-link-square"></i></div>';
                    cell += '<div style="display:inline-block;height:100%;width:1px;vertical-align:middle"/>';
                    cell += '</div>';
                    return cell;
                }
                var cell = rowData[colInfo.getId()];
                return cell;
            };

            panel.renderTableContent = function() {
                panel._tableRowCount = panel._tableData.getRowCount();
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount-1, panel._tableOffset+panel._tableLineCount-1);

                var $ElRightBody = $('#'+panel._divid_rightBody);
                var $ElLeftBody = $('#'+panel._divid_leftBody);
                var bodyLeftHtml = '';
                var bodyRightHtml = '';
                for (var rowNr = rowFirst; rowNr <= rowLast; rowNr ++) {
                    bodyLeftHtml += '<tr id="rowleft_'+panel.getId()+'_'+rowNr+'">';
                    bodyRightHtml += '<tr id="rowRight_'+panel.getId()+'_'+rowNr+'">';
                    var rowData = panel._tableData.getRow(rowNr);
                    $.each(panel._columns, function (colNr, colInfo) {
                        var cell = '<td id="tbcell_'+panel.getId()+'_'+rowNr+'_'+colNr+'">' + panel.renderCell(rowNr, colNr, rowData, colInfo) + '</td>';
                        if (panel._colIsRightPart(colInfo))
                            bodyRightHtml += cell;
                        else
                            bodyLeftHtml += cell;
                    });
                    bodyLeftHtml += '</tr>';
                    bodyRightHtml += '</tr>';
                }
                $ElLeftBody.html(bodyLeftHtml);
                $ElRightBody.html(bodyRightHtml);
                panel._renderHighlightRowNr();

                panel._pagerInfo.modifyText('<span style="font-size:80%">Current: {start}-{stop}<br>Total: {total}</span>'.AXMInterpolate({
                    start:rowFirst+1,
                    stop:rowLast+1,
                    total:panel._tableRowCount
                }));
            };

            panel._renderHighlightRowNr = function() {
                var $ElRightBody = $('#'+panel._divid_rightBody);
                var $ElLeftBody = $('#'+panel._divid_leftBody);
                $ElRightBody.find('tr').removeClass('AXMPgTableHightlightRow');
                $ElLeftBody.find('tr').removeClass('AXMPgTableHightlightRow');
                $("#rowLeft_"+panel.getId()+'_'+panel._currentRowNr).addClass('AXMPgTableHightlightRow');
                $("#rowRight_"+panel.getId()+'_'+panel._currentRowNr).addClass('AXMPgTableHightlightRow');

            };

            panel._handleCellClicked = function($El) {
                var cellInfo = panel._findTableCell$El($El);
                if (cellInfo) {
                    panel._currentRowNr = cellInfo.rowNr;
                    panel._renderHighlightRowNr();
                    if (cellInfo.colNr != null) {
                        var colInfo = panel._columns[cellInfo.colNr];
                        if (colInfo.isOpener)
                            panel._tableInfo.callOnOpenRow(cellInfo.rowNr);
                    }
                    //alert('Clicked '+cellInfo.rowNr+' '+cellInfo.colNr);
                }
            };

            panel._handleScrolled = function(params) {
                if (params.deltaY < 0)
                    panel.navigateLineDiff(+3);
                if (params.deltaY > 0)
                    panel.navigateLineDiff(-3);
            };

            //panel._handleCellDoubleClicked = function($El) {
            //    var cellInfo = panel._findTableCell$El($El);
            //    if (cellInfo) {
            //        alert('h');
            //    }
            //};

            panel._findTableCell$El = function($El) {
                if ($El.length == 0)
                    return null;
                var elId = $El.attr('id');
                if (elId) {
                    var idComps = elId.split('_');
                    if ((idComps.length > 0) && (idComps[0] == 'tbcell')) {
                        return {
                            rowNr: parseInt(idComps[2]),
                            colNr: parseInt(idComps[3])
                        };
                    }
                }
                return panel._findTableCell$El($El.parent());

            };

            panel.navigateFirstPage = function() {
                panel._tableOffset = 0;
                panel.renderTableContent();
            };

            panel.navigatePreviousPage = function() {
                panel._tableOffset = Math.max(0, panel._tableOffset-panel._tableLineCount);
                panel.renderTableContent();
            };


            panel.navigateNextPage = function() {
                panel._tableOffset = Math.min(Math.max(0, panel._tableRowCount-panel._tableLineCount+2), panel._tableOffset+panel._tableLineCount);
                panel.renderTableContent();
            };

            panel.navigateLastPage = function() {
                panel._tableOffset = Math.max(0, panel._tableRowCount-panel._tableLineCount+2);
                panel.renderTableContent();
            };

            panel.navigateLineDiff = function(diff) {
                panel._tableOffset += diff;
                panel._tableOffset = Math.min(Math.max(0, panel._tableRowCount-panel._tableLineCount+2), panel._tableOffset);
                panel._tableOffset = Math.max(0, panel._tableOffset);
                panel.renderTableContent();
            };

            panel.resize = function(xl, yl) {
                AXMUtils.Test.checkIsNumber(xl, yl);

                var leftWidth = $('#'+panel._id+'_leftTableScrollContainer').width();
                $('#'+panel._id+'_rightTableScrollContainer').width((xl-leftWidth)+'px');

                var $ElRightHeadRow = $('#'+panel._divid_rightHeadRow);
                var $ElRightBody = $('#'+panel._divid_rightBody);
                var rowHeight = $ElRightBody.height()*1.0/panel._tableLineCount;
                var headerHeight = $ElRightHeadRow.height();
                if (rowHeight>0) {
                    panel._tableLineCount = Math.max(1, Math.floor((yl - headerHeight) / rowHeight) - 1);
                    panel.renderTableContent();
                }
            };

            return panel;
        } ;


        Module.createTableViewerFrame = function(id, tableData, tableInfo) {
            AXMUtils.Test.checkIsString(id);
            AXMUtils.Test.checkIsType(tableData, '@TableData');
            AXMUtils.Test.checkIsType(tableInfo, '@TableInfo');
            var thePanel = Module.create(id, tableData, tableInfo);
            var theFrame = Frame.FrameFinalCommands(thePanel);

            theFrame.addCommand({
                icon: "fa-cog"
            }, thePanel.navigateLastPage);

            theFrame.addCommand({
                icon: "fa-filter"
            }, thePanel.navigateLastPage);

            theFrame.addSeparator();

            theFrame.addCommand({
                icon: "fa-flip-horizontal fa-fast-forward"
            }, thePanel.navigateFirstPage);
            theFrame.addCommand({
                icon: "fa-flip-horizontal fa-play"
            }, thePanel.navigatePreviousPage);
            theFrame.addCommand({
                icon: "fa-play"
            }, thePanel.navigateNextPage);
            theFrame.addCommand({
                icon: "fa-fast-forward"
            }, thePanel.navigateLastPage);

            thePanel._pagerInfo = Controls.Static({
                text:''
            });

            theFrame.addSeparator();

            theFrame.addControl(thePanel._pagerInfo);

            return theFrame;
        };

        return Module;
    });

