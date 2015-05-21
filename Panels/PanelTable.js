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
        "require", "jquery", "_", "blob", "filesaver",
        "AXM/AXMUtils", "AXM/DOM", "AXM/Controls/Controls", "AXM/Panels/Frame", "AXM/Panels/PanelBase", "AXM/Msg",
        "AXM/Windows/SimplePopups",
        "AXM/Tables/TableInfo"
    ],
    function (
        require, $, _, Blob, FileSaver,
        AXMUtils, DOM, Controls, Frame, PanelBase, Msg,
        SimplePopups,
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
            panel._lastSelClickedRowNr = null;

            panel._columns = [];

            panel._accumulatedScrollLineDiff = 0;
            panel._storeLayout = true;


            panel.setStoreLayout = function(newValue) {
                panel._storeLayout = newValue;
            };

            panel.updateTableInfo = function() {

                panel._columns = [];

                if (tableInfo.canOpenRow()) {
                    var openerCol = TableInfo.colInfo('_opener_');
                    openerCol.isOpener = true;
                    openerCol._dispSize = 25;
                    openerCol.setName('');
                    panel._columns.push(openerCol);
                }

                if (tableInfo.canSelect()) {
                    var selectorCol = TableInfo.colInfo('_selector_');
                    selectorCol.isSelector = true;
                    selectorCol._dispSize = 25;
                    selectorCol.setName('');
                    panel._columns.push(selectorCol);
                }

                $.each(tableInfo.getColumns(), function (idx, col) {
                    panel._columns.push(col);
                });
            };
            panel.updateTableInfo();



            panel._colIsRightPart = function(colInfo) {
                return (!colInfo.isOpener) && (!colInfo.isSelector);
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

                var divRoot = DOM.Div({id: 'tb' + panel._id})
                    .addStyle('width', '100%')
                    .addStyle('height', '100%')
                    .addStyle('overflow-x', 'hidden')
                    .addStyle('overflow-y', 'hidden')
                    .addStyle('white-space', 'nowrap');

                divRoot.addElem(panel.createHtmlBody());

                return divRoot.toString();
            };

            panel.createHtmlBody = function() {
                panel._loadColumnSettings();

                var divLeftTableContainer = DOM.Div({ id: panel._getSubId('leftTableScrollContainer')})
                    //.addStyle('width','100px')
                    .addStyle('height','100%')
                    .addStyle('display', 'inline-block')
                    .addStyle('background-color','rgb(247,247,247)');

                var divRightTableContainer = DOM.Div({ id: panel._getSubId('rightTableScrollContainer')})
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



                return divLeftTableContainer.toString() + divRightTableContainer.toString();
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
                    cell.addAttribute('title', colInfo.getName())
                    if (colInfo.canSort()) {
                        DOM.Div({parent: cell}).addCssClass('AXMPgTableColSortBox');
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
                    $ElColHeader.find('.AXMPgTableColSortBox').mousedown(function() {
                        panel._toggleSortByField(colInfo._id);
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
                            panel._storeColumnSettings();
                        }
                    )
                });

                $ElLeftBody.click(function(event) {
                    panel._handleCellClicked($(event.target),
                        {
                            shiftPressed: event.shiftKey,
                            controlPressed: event.ctrlKey
                        }
                    );
                });
                $ElRightBody.click(function(event) {
                    panel._handleCellClicked($(event.target),
                    {
                        shiftPressed: event.shiftKey,
                            controlPressed: event.ctrlKey
                    }
                    );
                });

                AXMUtils.create$ElScrollHandler(panel._getSub$El('leftTableScrollContainer'), panel._handleScrolled);
                AXMUtils.create$ElScrollHandler(panel._getSub$El('rightTableScrollContainer'), panel._handleScrolled);

                $('#'+panel._divid_rightBody).contextmenu(function(event) {
                    //alert('contextmenu');
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                });

                //$ElLeftHeadRow.find('th').bind('mouseenter', function(){
                //    var $this = $(this);
                //    $this.attr('title', $this.text());
                //});
                //$ElRightHeadRow.find('th').bind('mouseenter', function(){
                //    var $this = $(this);
                //    $this.attr('title', $this.text());
                //});

                panel._updateSortStatus();
                panel.renderTableContent();
            };


            panel.renderCell = function(rowNr, colNr, rowData, colInfo) {
                if (colInfo.isOpener) {
                    var cell = '<div class="AXMPgTableLinkCell">';
                    cell += '<div class="AXMPgTableLinkIcon"><i class="fa fa-external-link-square"></i></div>';
                    cell += '<div style="display:inline-block;height:100%;width:1px;vertical-align:middle"/>';
                    cell += '</div>';
                    return cell;
                }
                if (colInfo.isSelector) {
                    var rowId = rowData[panel._tableData.getPrimKey()];
                    var cell = '<div class="AXMPgTableSelectorCell">';
                    if (!panel._tableData.isItemSelected(rowId))
                        cell += '<div class="AXMPgTableSelectorIcon"><i class="fa fa-circle-thin"></i></div>';
                    else
                        cell += '<div class="AXMPgTableSelectorIconActive"><i class="fa fa-check-circle"></i></div>';
                    cell += '<div style="display:inline-block;height:100%;width:1px;vertical-align:middle"/>';
                    cell += '</div>';
                    return cell;
                }
                if (colInfo.content2CellHtml)
                    return colInfo.content2CellHtml(rowData[colInfo.getId()], rowData);
                return colInfo.content2DisplayString(rowData[colInfo.getId()], rowData);
            };

            panel._getRowLeftId = function(rowNr) {
                return 'rowleft_'+panel.getId()+'_'+rowNr;
            };

            panel._getRowRightId = function(rowNr) {
                return 'rowright_'+panel.getId()+'_'+rowNr;
            };

            panel._renderTableRow = function(rowNr) {
                if (rowNr < 0)
                    AXMUtils.Test.reportBug('Negative row number');
                if (rowNr >= panel._tableData.getRowCount())
                    AXMUtils.Test.reportBug('Row number {nr} outside count {cnt}'.AXMInterpolate({nr: rowNr, count: panel._tableData.getRowCount()}));
                var rowLeftHtml = '<tr id="' + panel._getRowLeftId(rowNr) + '">';
                var rowRightHtml = '<tr id="' + panel._getRowRightId(rowNr) + '">';
                var rowData = panel._tableData.getRow(rowNr);
                if (!rowData)
                    AXMUtils.Test.reportBug('Unable to get row data');
                $.each(panel._columns, function (colNr, colInfo) {
                    var bkcolor = colInfo.content2BackgroundColor(rowData[colInfo.getId()], rowData);
                    var styles = '';
                    if (bkcolor)
                        styles += 'background-color:'+bkcolor.toString();
                    var titleText = '';
                    if ((!colInfo.isOpener) && (!colInfo.isSelector) )
                        titleText = colInfo.content2DisplayString(rowData[colInfo.getId()], rowData);
                    var cell = '<td style="{styles}" id="tbcell_{id}" title="{titletext}">'.AXMInterpolate({
                            styles: styles,
                            id: panel.getId()+'_'+rowNr+'_'+colNr,
                            titletext: titleText
                        })
                        + panel.renderCell(rowNr, colNr, rowData, colInfo)
                        + '</td>';
                    if (panel._colIsRightPart(colInfo))
                        rowRightHtml += cell;
                    else
                        rowLeftHtml += cell;
                });
                rowLeftHtml += '</tr>';
                rowRightHtml += '</tr>';
                return {
                    left: rowLeftHtml,
                    right: rowRightHtml
                }
            };

            panel._renderPager = function() {
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount-1, panel._tableOffset+panel._tableLineCount-1);
                panel._pagerInfo.modifyText('<span style="font-size:80%">Current: {start}-{stop}<br>Total: {total}</span>'.AXMInterpolate({
                    start:rowFirst+1,
                    stop:rowLast+1,
                    total:panel._tableRowCount
                }));
            };

            panel.renderTableContent = function() {
                panel._tableRowCount = panel._tableData.getRowCount();
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount-1, panel._tableOffset+panel._tableLineCount-1);

                if (!panel._tableData.requireRowRange(rowFirst, rowLast, panel.renderTableContent))
                    return;

                var $ElRightBody = $('#'+panel._divid_rightBody);
                var $ElLeftBody = $('#'+panel._divid_leftBody);
                var bodyLeftHtml = '';
                var bodyRightHtml = '';
                for (var rowNr = rowFirst; rowNr <= rowLast; rowNr ++) {
                    var rowHtml = panel._renderTableRow(rowNr);
                    bodyLeftHtml += rowHtml.left;
                    bodyRightHtml += rowHtml.right;
                }
                $ElLeftBody.html(bodyLeftHtml);
                $ElRightBody.html(bodyRightHtml);

                panel._renderHighlightRowNr();
                panel._renderPager();

                if (!panel._sizeMeasured)
                    panel._measureSize();
            };

            panel._renderHighlightRowNr = function() {
                var $ElRightBody = $('#'+panel._divid_rightBody);
                var $ElLeftBody = $('#'+panel._divid_leftBody);
                $ElRightBody.find('tr').removeClass('AXMPgTableHightlightRow');
                $ElLeftBody.find('tr').removeClass('AXMPgTableHightlightRow');
                $("#" + panel._getRowLeftId(panel._currentRowNr)).addClass('AXMPgTableHightlightRow');
                $("#" + panel._getRowRightId(panel._currentRowNr)).addClass('AXMPgTableHightlightRow');

            };

            panel._handleCellClicked = function($El, settings) {
                var cellInfo = panel._findTableCell$El($El);
                if (cellInfo) {
                    panel._currentRowNr = cellInfo.rowNr;
                    panel._renderHighlightRowNr();
                    if (cellInfo.colNr != null) {
                        var colInfo = panel._columns[cellInfo.colNr];
                        if (colInfo.isOpener)
                            panel._tableInfo.callOnOpenRow(cellInfo.rowNr, settings);
                        if (colInfo.isSelector)
                            panel._handleSelectorClicked(cellInfo.rowNr, settings);
                    }
                    //alert('Clicked '+cellInfo.rowNr+' '+cellInfo.colNr);
                }
            };

            panel._handleSelectorClicked = function(rowNr, settings) {
                var rowId = panel._tableData.getRowId(rowNr);
                if (rowId === null)
                    return;
                var prevState = panel._tableData.isItemSelected(rowId);
                if ((!settings.shiftPressed) || (panel._lastSelClickedRowNr == null))
                    panel._tableData.setItemSelected(rowId, !prevState);
                else {
                    for (var i=Math.min(rowNr,panel._lastSelClickedRowNr); i<=Math.max(rowNr,panel._lastSelClickedRowNr); i++) {
                        var t_rowId = panel._tableData.getRowId(i);
                        if (t_rowId !== null)
                            panel._tableData.setItemSelected(t_rowId, !prevState);
                    }
                }
                panel._lastSelClickedRowNr = rowNr;
                panel._tableData.notifySelectionModified();
            };

            panel._updateScrollLineDiff = function() {
                if (panel._accumulatedScrollLineDiff) {
                    panel.navigateLineDiff(panel._accumulatedScrollLineDiff);
                    panel._accumulatedScrollLineDiff = 0;
                }
            };
            //panel._throttled_updateScrollLineDiff = AXMUtils.debounce2(panel._updateScrollLineDiff, 20);


            panel._handleScrolled = function(params) {
                if (params.deltaY < 0)
                    panel._accumulatedScrollLineDiff += 3;
                if (params.deltaY > 0)
                    panel._accumulatedScrollLineDiff -= 3;
                panel._updateScrollLineDiff();
            };

            panel._toggleSortByField = function(colId) {
                panel._tableData._toggleSortByField(colId);
                panel.resetView();
                //panel.renderTableContent();
                panel._updateSortStatus();
            };

            panel._updateSortStatus = function() {
                $.each(panel._columns, function(colNr, colInfo) {
                    var $ElColHeader =panel._getColSub$El('header', colNr);
                    if (colInfo.canSort()) {
                        var sortInv = false;
                        var sortBox = $ElColHeader.find('.AXMPgTableColSortBox');
                        if (panel._tableData.getSortColumn() == colInfo._id) {
                            sortBox.addClass('AXMPgTableColSortBoxActive');
                            sortInv = panel._tableData.getSortInverse();
                        }
                        else
                            sortBox.removeClass('AXMPgTableColSortBoxActive');
                        sortBox.html('<i class="fa fa-arrow-{dir}"></i>'.AXMInterpolate({dir: sortInv?'up':'down' }));
                    }
                });
            };

            panel._storeColumnSettings = function() {
                if (panel._storeLayout) {
                    var colSettings = [];
                    $.each(panel._columns, function (colNr, colInfo) {
                        colSettings.push({
                            id: colInfo.getId(),
                            size: colInfo._dispSize
                        })
                    });
                    var content = window.btoa(JSON.stringify(colSettings));
                    if (content.length < appData.maxCookieLength)
                        $.cookie('TableSettings_' + panel.getTypeId(), content);
                }
            };

            panel._loadColumnSettings = function() {
                if (panel._storeLayout) {
                    var encodedContent = $.cookie('TableSettings_' + panel.getTypeId());
                    if (!encodedContent)
                        return;
                    var content = window.atob(encodedContent);
                    var colSettings = JSON.parse(content);
                    var settingMap = {};
                    $.each(colSettings, function (idx, colSetting) {
                        settingMap[colSetting.id] = colSetting;
                    });
                    $.each(panel._columns, function (colNr, colInfo) {
                        var colSetting = settingMap[colInfo.getId()];
                        if (colSetting) {
                            colInfo.setDispSize(colSetting.size);
                        }
                    });
                }
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

            panel.emptyContent = function() {
                var $ElRightBody = $('#'+panel._divid_rightBody);
                var $ElLeftBody = $('#'+panel._divid_leftBody);
                $ElLeftBody.html('');
                $ElRightBody.html('');
            };

            panel.resetView = function() {
                panel._tableOffset = 0;
                panel._lastSelClickedRowNr = null;
                panel._currentRowNr = 0;
                panel.invalidate();
            };

            panel.reloadContent = function() {
                panel._tableData.resetBuffer();
                panel.invalidate();
            };

            panel.invalidate = function() {
                panel.renderTableContent();
            };

            panel.navigateFirstPage = function() {
                panel._tableOffset = 0;
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            panel.navigatePreviousPage = function() {
                panel._tableOffset = Math.max(0, panel._tableOffset-panel._tableLineCount);
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            panel.navigateNextPage = function() {
                panel._tableOffset = Math.min(Math.max(0, panel._tableRowCount-panel._tableLineCount+2), panel._tableOffset+panel._tableLineCount);
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            panel.navigateLastPage = function() {
                panel._tableOffset = Math.max(0, panel._tableRowCount-panel._tableLineCount+2);
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            panel.navigateLineDiff = function(diff) {
                var $ElRightBody = $('#'+panel._divid_rightBody);
                var $ElLeftBody = $('#'+panel._divid_leftBody);

                tableOffsetPrev = panel._tableOffset;
                var rowLastPrev = Math.min(panel._tableRowCount-1, panel._tableOffset+panel._tableLineCount-1);

                panel._tableOffset += diff;
                panel._tableOffset = Math.min(Math.max(0, panel._tableRowCount-panel._tableLineCount+2), panel._tableOffset);
                panel._tableOffset = Math.max(0, panel._tableOffset);
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount-1, panel._tableOffset+panel._tableLineCount-1);
                diff = panel._tableOffset - tableOffsetPrev; // Corrected difference

                if (!panel._tableData.requireRowRange(rowFirst, rowLast, panel.renderTableContent))
                    return; // We need to fetch data first - no fast update here - full rendering will happen

                if (diff > 0) {
                    for (var rowNr = tableOffsetPrev; rowNr < panel._tableOffset; rowNr++) {
                        $ElLeftBody.find('#'+panel._getRowLeftId(rowNr)).remove();
                        $ElRightBody.find('#'+panel._getRowRightId(rowNr)).remove();
                    }
                    for (var rowNr = rowLastPrev+1; rowNr <=rowLast; rowNr++) {
                        var rowHtml = panel._renderTableRow(rowNr);
                        $ElLeftBody.append(rowHtml.left);
                        $ElRightBody.append(rowHtml.right);
                    }
                }

                if (diff < 0) {
                    for (var rowNr = rowLastPrev+1; rowNr >rowLast; rowNr--) {
                        $ElLeftBody.find('#'+panel._getRowLeftId(rowNr)).remove();
                        $ElRightBody.find('#'+panel._getRowRightId(rowNr)).remove();
                    }
                    for (var rowNr = tableOffsetPrev-1; rowNr >= panel._tableOffset; rowNr--) {
                        var rowHtml = panel._renderTableRow(rowNr);
                        $ElLeftBody.prepend(rowHtml.left);
                        $ElRightBody.prepend(rowHtml.right);
                    }
                }

                panel._renderPager();

                //var rowFirst = panel._tableOffset;
                //var rowLast = Math.min(panel._tableRowCount-1, panel._tableOffset+panel._tableLineCount-1);
                //
                //if (!panel._tableData.requireRowRange(rowFirst, rowLast, panel.renderTableContent))
                //    return;
                //
                //var bodyLeftHtml = '';
                //var bodyRightHtml = '';
                //for (var rowNr = rowFirst; rowNr <= rowLast; rowNr ++) {
                //    bodyLeftHtml += '<tr id="' + panel._getRowLeftId(rowNr) + '">';
                //    bodyRightHtml += '<tr id="' + panel._getRowRightId(rowNr) + '">';

                //panel._lastSelClickedRowNr = null;
                //panel.renderTableContent();
            };

            panel.saveLocal = function() {
                SimplePopups.ConfirmationBox('Do you want to download the table content<br>to your local computer?', 'Download', {}, function() {
                    panel._maxDownloadRowCount = 9999;
                    if (panel._tableData.requireRowRange(0, panel._maxDownloadRowCount, panel._exec_Save))
                        panel._exec_Save()
                });
            };

            panel._exec_Save = function() {
                var cnt = Math.min(panel._maxDownloadRowCount, panel._tableData.getRowCount());
                var data = '';
                var line  = '';
                $.each(panel._columns, function (colNr, colInfo) {
                    if (colInfo.getName().length>0) {
                        if (line.length>0)
                            line += '\t';
                        line += colInfo.getName();
                    }
                });
                data += line + '\n';
                for (var rowNr = 0; rowNr < cnt ; rowNr ++) {
                    var rowData = panel._tableData.getRow(rowNr);
                    var line  = '';
                    $.each(panel._columns, function (colNr, colInfo) {
                        if (colInfo.getName().length>0) {
                            if (line.length>0)
                                line += '\t';
                            line += colInfo.content2DisplayString(rowData[colInfo.getId()], rowData);
                        }
                    });
                    data += line + '\n';
                }
                var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
                FileSaver(blob, 'TableContent.txt');
                if (cnt < panel._tableData.getRowCount())
                    SimplePopups.ErrorBox('Download was restricted to the first {cnt} rows'.AXMInterpolate({cnt: cnt}));
            };

            panel.resize = function(xl, yl) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                panel._availableWidth = xl;
                panel._availableHeight = yl;
                panel._measureSize();
            }

            panel._measureSize = function() {
                if (!panel._availableHeight)
                    return;

                var leftWidth = $('#'+panel._id+'_leftTableScrollContainer').width();
                $('#'+panel._id+'_rightTableScrollContainer').width((panel._availableWidth-leftWidth)+'px');

                var $ElRightHeadRow = $('#'+panel._divid_rightHeadRow);
                var $ElRightBody = $('#'+panel._divid_rightBody);
                var tableHeight = $ElRightBody.height();
                var rowHeight = tableHeight*1.0/panel._tableLineCount;
                var headerHeight = $ElRightHeadRow.height();
                if (rowHeight>0) {
                    panel._tableLineCount = Math.max(1, Math.floor((panel._availableHeight - headerHeight) / rowHeight) - 1);
                    panel._sizeMeasured = true;
                    panel.renderTableContent();
                }
            };

            //todo: tear down these events listeners in the proper tear down function

            Msg.listen('', 'UpdateTableRecordContent', function(msg) {
                if (msg.tableId==panel._tableInfo.tableId) {
                    panel.reloadContent();
                }
            });

            Msg.listen('', 'DeleteTableRecord', function(msg) {
                if (msg.tableId==panel._tableInfo.tableId) {
                    panel._tableData.setItemSelected(msg.primKey, false);
                    panel.reloadContent();
                }
            });

            Msg.listen('', 'UpdateTableInfo', function(tableid) {
                if (tableid==panel._tableInfo.tableId) {
                    panel.updateTableInfo();
                    panel._tableData.resetBuffer();
                    $('#tb'+panel._id).html(panel.createHtmlBody());
                    panel.renderTableContent();
                    panel.attachEventHandlers();
                }
            });

            Msg.listen('', 'TableSelectionModified', function(tableid) {
                if (tableid==panel._tableInfo.tableId) {
                    panel.renderTableContent();
                }
            });

            return panel;
        } ;


        Module.createTableViewerFrame = function(id, tableData, tableInfo) {
            AXMUtils.Test.checkIsString(id);
            AXMUtils.Test.checkIsType(tableData, '@TableData');
            AXMUtils.Test.checkIsType(tableInfo, '@TableInfo');
            var thePanel = Module.create(id, tableData, tableInfo);
            var theFrame = Frame.FrameFinalCommands(thePanel);

            theFrame.addCommand({
                icon: "fa-download",
                hint: _TRL("Download table content to local machine")
            }, thePanel.saveLocal);

            //theFrame.addCommand({
            //    icon: "fa-filter"
            //}, thePanel.navigateLastPage);

            theFrame.addSeparator();

            theFrame.addCommand({
                icon: "fa-flip-horizontal fa-fast-forward",
                hint: _TRL("First page")
            }, thePanel.navigateFirstPage);
            theFrame.addCommand({
                icon: "fa-flip-horizontal fa-play",
                hint: _TRL("Previous page")
            }, thePanel.navigatePreviousPage);
            theFrame.addCommand({
                icon: "fa-play",
                hint: _TRL("Next page")
            }, thePanel.navigateNextPage);
            theFrame.addCommand({
                icon: "fa-fast-forward",
                hint: _TRL("Last page")
            }, thePanel.navigateLastPage);

            thePanel._pagerInfo = Controls.Static({
                text:''
            });

            theFrame.addSeparator();

            theFrame.addControl(thePanel._pagerInfo);

            theFrame.getTablePanel = function() {
                return thePanel;
            }

            return theFrame;
        };

        return Module;
    });

