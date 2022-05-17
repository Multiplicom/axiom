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
        "require", "jquery", "_", "filesaver", "he",
        "AXM/AXMUtils", "AXM/DOM", "AXM/Controls/Controls", "AXM/Panels/Frame", "AXM/Panels/PanelBase", "AXM/Msg", "AXM/Icon",
        "AXM/Windows/SimplePopups",
        "AXM/Tables/TableInfo",
        "js.cookie",
        "AXM/DataFrames/Filter/FilterExpression"
    ],
    function (
        require, $, _, FileSaver, he,
        AXMUtils, DOM, Controls, Frame, PanelBase, Msg, Icon,
        SimplePopups,
        TableInfo,
        Cookies,
        FilterExpression
    ) {

        /**
         * Module encapsulating a panel that contains a paged table
         * @type {{}}
         */
        var Module = {};

        /**
         * Implements a panel that contains a paged table
         * @param {string} id - panel type id
         * @param {AXM.Tables.TableData} tableData - object containing the data of the table (content of the cells)
         * @param {AXM.Tables.TableInfo} tableInfo - object containing the definition of the table (column definitions)
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.create = function (id, tableData, tableInfo) {
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


            /**
             * Defines whether or not the user-adjusted layout should be stored
             * @param {boolean} newValue
             */
            panel.setStoreLayout = function (newValue) {
                panel._storeLayout = newValue;
            };


            /**
             * To be called to reflect changes in the table info
             */
            panel.updateTableInfo = function () {

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
                    if (col.isVisibleInTable())
                        panel._columns.push(col);
                });
            };
            panel.updateTableInfo();


            panel._colIsRightPart = function (colInfo) {
                return (!colInfo.isOpener) && (!colInfo.isSelector);
            };

            panel._getSubId = function (ext) {
                return panel._id + '_' + ext;
            };

            panel._getSub$El = function (ext) {
                return $('#' + panel._getSubId(ext));
            };

            panel._getColSubId = function (colNr, ext) {
                return panel._id + '_col_' + colNr + '_' + ext;
            };

            panel._getColSub$El = function (colNr, ext) {
                return $('#' + panel._getColSubId(colNr, ext));
            };


            /**
             * Returns the html implementing the panel
             * @returns {string}
             */
            panel.render = function () {

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

            /**
             * Returns the html implementing the table body
             * @returns {string}
             */
            panel.createHtmlBody = function () {
                panel._loadColumnSettings();

                var divLeftTableContainer = DOM.Div({id: panel._getSubId('leftTableScrollContainer')})
                    .addStyle('height', '100%')
                    .addStyle('display', 'inline-block')
                    .addStyle('background-color', 'rgb(247,247,247)');

                var divRightTableContainer = DOM.Div({id: panel._getSubId('rightTableScrollContainer')})
                    .addStyle('height', '100%')
                    .addStyle('overflow-x', 'scroll')
                    .addStyle('overflow-y', 'hidden')
                    .addStyle('display', 'inline-block')
                    .addStyle('background-color', 'rgb(247,247,247)');


                ///////////// Left table ////////////////////////////////

                var divLeftTable = DOM.Create('table', {parent: divLeftTableContainer})
                    .addCssClass('AXMPgTableLeft');
                var colLeftGroup = DOM.Create('colgroup', {parent: divLeftTable});
                var divLeftTableHead = DOM.Create('thead', {parent: divLeftTable});
                var divLeftTableHeadRow = DOM.Create('tr', {parent: divLeftTableHead, id: panel._divid_leftHeadRow});
                var divLeftTableBody = DOM.Create('tbody', {parent: divLeftTable, id: panel._divid_leftBody});


                ///////////// Right table ///////////////////////////////

                var divRightTable = DOM.Create('table', {parent: divRightTableContainer})
                    .addCssClass('AXMPgTableRight');
                var colRightGroup = DOM.Create('colgroup', {parent: divRightTable});
                var divRightTableHead = DOM.Create('thead', {parent: divRightTable});
                var divRightTableHeadRow = DOM.Create('tr', {parent: divRightTableHead, id: panel._divid_rightHeadRow});
                var divRightTableBody = DOM.Create('tbody', {parent: divRightTable, id: panel._divid_rightBody});


                $.each(panel._columns, function (colNr, colInfo) {
                    var col = DOM.Create('col', {
                        parent: panel._colIsRightPart(colInfo) ? colRightGroup : colLeftGroup,
                        id: panel._getColSubId(colNr, '')
                    })
                        .addStyle('width', colInfo._dispSize + 'px')
                        .addStyle('overflow', 'hidden')
                });

                return divLeftTableContainer.toString() + divRightTableContainer.toString();
            };


            /**
             * Attached the html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function () {
                var $ElLeftHeadRow = $('#' + panel._divid_leftHeadRow);
                var $ElRightHeadRow = $('#' + panel._divid_rightHeadRow);
                var $ElRightBody = $('#' + panel._divid_rightBody);
                var $ElLeftBody = $('#' + panel._divid_leftBody);

                var headerLeftHtml = '';
                var headerRightHtml = '';
                $.each(panel._columns, function createHeader(colNr, colInfo) {
                    var cell = DOM.Create('th', {id: panel._getColSubId('header', colNr)});
                    cell.addElem(colInfo.getName());
                    cell.addAttribute("title", colInfo.getName({styling: false}));
                    if (colInfo.canSort()) {
                        DOM.Div({parent: cell}).addCssClass('AXMPgTableColSortBox');
                    }
                    if (colInfo.canOpen()) {
                        cell.addStyle('cursor', 'pointer');
                        DOM.Div({parent: cell, id: panel._getColSubId('open', colNr)})
                            .addCssClass('AXMPgTableColOpenBox')
                            .addElem('<i class="fa fa-external-link-square"></i>');
                    }
                    DOM.Div({
                        parent: cell,
                        id: panel._getColSubId('dragger', colNr)
                    }).addCssClass('AXMPgTableRightColDragger');
                    if (panel._colIsRightPart(colInfo))
                        headerRightHtml += cell.toString();
                    else
                        headerLeftHtml += cell.toString();
                });
                $ElLeftHeadRow.html(headerLeftHtml);
                $ElRightHeadRow.html(headerRightHtml);

                $.each(panel._columns, function (colNr, colInfo) {
                    var $ElColDrag = panel._getColSub$El('dragger', colNr);
                    var $ElCol = panel._getColSub$El(colNr, '');
                    var $ElColHeader = panel._getColSub$El('header', colNr);
                    if (colInfo.canOpen())
                        $ElColHeader.mousedown(function (ev) {
                            colInfo.callOnOpen();
                            return false;
                        });
                    $ElColHeader.find('.AXMPgTableColSortBox').mousedown(function () {
                        panel._toggleSortByField(colInfo._id);
                    });
                    if (panel._colIsRightPart(colInfo)) {
                        var dispSizeStart = 0;
                        AXMUtils.create$ElDragHandler($ElColDrag,
                            function () {
                                dispSizeStart = colInfo._dispSize;
                            },
                            function (params) {
                                colInfo._dispSize = Math.max(35, dispSizeStart + params.diffTotalX);
                                $ElCol.width(colInfo._dispSize);
                            },
                            function () {
                                panel._storeColumnSettings();
                            }
                        )
                    }
                });

                $ElLeftBody.click(function (event) {
                    panel._handleCellClicked($(event.target),
                        {
                            shiftPressed: event.shiftKey,
                            controlPressed: event.ctrlKey
                        }
                    );
                });
                $ElRightBody.click(function (event) {
                    panel._handleCellClicked($(event.target),
                        {
                            shiftPressed: event.shiftKey,
                            controlPressed: event.ctrlKey
                        }
                    );
                });

                AXMUtils.create$ElScrollHandler(panel._getSub$El('leftTableScrollContainer'), panel._handleScrolled);
                AXMUtils.create$ElScrollHandler(panel._getSub$El('rightTableScrollContainer'), panel._handleScrolled);

                $('#' + panel._divid_rightBody).contextmenu(function (event) {
                    //alert('contextmenu');
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                });

                panel._updateSortStatus();
                panel.renderTableContent();
            };


            /**
             * Detach the html event handlers
             */
            panel.detachEventHandlers = function () {
                if (panel) {
                    var $ElLeftHeadRow = $('#' + panel._divid_leftHeadRow);
                    var $ElRightHeadRow = $('#' + panel._divid_rightHeadRow);
                    var $ElRightBody = $('#' + panel._divid_rightBody);
                    var $ElLeftBody = $('#' + panel._divid_leftBody);


                    $.each(panel._columns, function (colNr, colInfo) {
                        var $ElColDrag = panel._getColSub$El('dragger', colNr);
                        var $ElCol = panel._getColSub$El(colNr, '');
                        var $ElColHeader = panel._getColSub$El('header', colNr);
                        if (colInfo.canOpen())
                            $ElColHeader.unbind('mousedown');
                        $ElColHeader.find('.AXMPgTableColSortBox').unbind('mousedown');
                        if (panel._colIsRightPart(colInfo)) {
                            AXMUtils.remove$ElDragHandler($ElColDrag);
                        }
                    });
                    $ElLeftBody.unbind('click');
                    $ElRightBody.unbind('click');

                    AXMUtils.remove$ElScrollHandler(panel._getSub$El('leftTableScrollContainer'));
                    AXMUtils.remove$ElScrollHandler(panel._getSub$El('rightTableScrollContainer'));

                    $('#' + panel._divid_rightBody).unbind('contextmenu');

                    panel._updateSortStatus();
                    panel.renderTableContent();
                }
            };


            /**
             * Returns the html code for a single cell content
             * @param {int} rowNr - row number
             * @param {int} colNr - column number
             * @param {{}} rowData - content of the row
             * @param {AXM.TableInfo.colInfo} colInfo - column information
             */
            panel.renderCell = function (rowNr, colNr, rowData, colInfo) {
                if (colInfo.isOpener) {
                    var cell = `<div class="AXMPgTableLinkCell" title="${_TRL('Open this item')}">`;
                    cell += '<div class="AXMPgTableLinkIcon"><i class="fa fa-external-link-square"></i></div>';
                    cell += '<div style="display:inline-block;height:100%;width:1px;vertical-align:middle"></div>';
                    cell += '</div>';
                    return cell;
                }
                if (colInfo.isSelector) {
                    var rowId = rowData[panel._tableData.getPrimKey()];
                    var cell = `<div class="AXMPgTableSelectorCell" title="${_TRL('Select this item')}">`;
                    if (!panel._tableData.isItemSelected(rowId))
                        cell += '<div class="AXMPgTableSelectorIcon"><i class="fa fa-circle-thin"></i></div>';
                    else
                        cell += '<div class="AXMPgTableSelectorIconActive"><i class="fa fa-check-circle"></i></div>';
                    cell += '<div style="display:inline-block;height:100%;width:1px;vertical-align:middle"></div>';
                    cell += '</div>';
                    return cell;
                }
                if (colInfo.content2CellHtml)
                    return colInfo.content2CellHtml(rowData[colInfo.getId()], rowData);
                return colInfo.content2DisplayString(rowData[colInfo.getId()], rowData);
            };

            panel._getRowLeftId = function (rowNr) {
                return 'rowleft_' + panel.getId() + '_' + rowNr;
            };

            panel._getRowRightId = function (rowNr) {
                return 'rowright_' + panel.getId() + '_' + rowNr;
            };


            /**
             * Returns the html code for a single row in the table
             * @param {int} rowNr - table row number
             * @returns {{left: string, right: string}}
             * @private
             */
            panel._renderTableRow = function (rowNr) {
                if (rowNr < 0)
                    AXMUtils.Test.reportBug('Negative row number');
                if (rowNr >= panel._tableData.getRowCount())
                    AXMUtils.Test.reportBug(`Row number ${rowNr} outside count ${panel._tableData.getRowCount()}`);
                var rowLeftHtml = '<tr id="' + panel._getRowLeftId(rowNr) + '">';
                var rowRightHtml = '<tr id="' + panel._getRowRightId(rowNr) + '">';
                var rowData = panel._tableData.getRow(rowNr);
                if (!rowData)
                    AXMUtils.Test.reportBug('Unable to get row data');
                $.each(panel._columns, function (colNr, colInfo) {
                    var bkcolor = colInfo.content2BackgroundColor(rowData[colInfo.getId()], rowData);
                    var fgcolor = colInfo.content2ForegroundColor(rowData[colInfo.getId()], rowData);
                    var styles = '';
                    if (bkcolor)
                        styles += 'background-color:' + bkcolor.toString();
                    if (fgcolor)
                        styles += 'color:' + fgcolor.toString();
                    var titleText = '';
                    if ((!colInfo.isOpener) && (!colInfo.isSelector))
                        titleText = colInfo.content2DisplayString(rowData[colInfo.getId()], rowData);
                    if (titleText.indexOf('<') >= 0)
                        titleText = ""; // ugly hack because we don't want html content to be used in the tooltip
                    var cell = `<td style="${styles}" id="tbcell_${panel.getId() + '_' + rowNr + '_' + colNr}" title="${titleText}">`
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


            /**
             * Sets the html code for the table pager control
             * @private
             */
            panel._renderPager = function () {
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount - 1, panel._tableOffset + panel._tableLineCount - 1);
                panel._pagerInfo.modifyText(`<span style="font-size:90%">Current: ${rowFirst + 1}-${rowLast + 1}<br>Total: ${panel._tableRowCount}</span>`);
            };


            /**
             * Sets the html code for the table content
             * @param forceMeasureSize should be set to true if we want to be certain the size of the panel is measured/adjusted even tough the panel._sizeMeasured was already set to true.
             */
            panel.renderTableContent = function (forceMeasureSize) {

                panel._tableRowCount = panel._tableData.getRowCount();
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount - 1, panel._tableOffset + panel._tableLineCount - 1);

                if (!panel._tableData.requireRowRange(rowFirst, rowLast, () => panel.renderTableContent(true), panel.renderFail)) {
                    return;
                }

                var $ElRightBody = $('#' + panel._divid_rightBody);
                var $ElLeftBody = $('#' + panel._divid_leftBody);
                var bodyLeftHtml = '';
                var bodyRightHtml = '';
                for (var rowNr = rowFirst; rowNr <= rowLast; rowNr++) {
                    var rowHtml = panel._renderTableRow(rowNr);
                    bodyLeftHtml += rowHtml.left;
                    bodyRightHtml += rowHtml.right;
                }
                $ElLeftBody.html(bodyLeftHtml);
                $ElRightBody.html(bodyRightHtml);

                panel._renderHighlightRowNr();
                panel._renderPager();

                if (!panel._sizeMeasured || forceMeasureSize)
                    panel._measureSize();
            };


            /**
             * Renders an error message
             */
            panel.renderFail = function () {
                panel._pagerInfo.modifyText('<span style="color:red">Failed to load data</span>');
            };


            /**
             * Renders the highlight for the highlighted row
             * @private
             */
            panel._renderHighlightRowNr = function () {
                var $ElRightBody = $('#' + panel._divid_rightBody);
                var $ElLeftBody = $('#' + panel._divid_leftBody);
                $ElRightBody.find('tr').removeClass('AXMPgTableHightlightRow');
                $ElLeftBody.find('tr').removeClass('AXMPgTableHightlightRow');
                $("#" + panel._getRowLeftId(panel._currentRowNr)).addClass('AXMPgTableHightlightRow');
                $("#" + panel._getRowRightId(panel._currentRowNr)).addClass('AXMPgTableHightlightRow');

            };


            /**
             * Handles the clicking on an individual cell html element
             * @param {jquery} $El - clicked element
             * @param {{}} settings
             * @private
             */
            panel._handleCellClicked = function ($El, settings) {
                var cellInfo = panel._findTableCell$El($El);
                if (cellInfo) {
                    panel._currentRowNr = cellInfo.rowNr;
                    panel._renderHighlightRowNr();
                    if (cellInfo.colNr != null) {
                        var colInfo = panel._columns[cellInfo.colNr];
                        if (colInfo.isOpener)
                            panel._tableInfo.callOnOpenRow(cellInfo.rowNr, settings, panel._tableData);
                        if (colInfo.isSelector)
                            panel._handleSelectorClicked(cellInfo.rowNr, settings);
                    }
                }
            };

            /**
             * Handles the clicking on the icon maintaining the row selection state
             * @param {int} rowNr - table row number
             * @param {{}} settings
             * @private
             */
            panel._handleSelectorClicked = function (rowNr, settings) {
                var rowId = panel._tableData.getRowId(rowNr);
                if (rowId === null)
                    return;
                var prevState = panel._tableData.isItemSelected(rowId);
                if ((!settings.shiftPressed) || (panel._lastSelClickedRowNr == null))
                    panel._tableData.setItemSelected(rowId, !prevState);
                else {
                    for (var i = Math.min(rowNr, panel._lastSelClickedRowNr); i <= Math.max(rowNr, panel._lastSelClickedRowNr); i++) {
                        var t_rowId = panel._tableData.getRowId(i);
                        if (t_rowId !== null)
                            panel._tableData.setItemSelected(t_rowId, !prevState);
                    }
                }
                panel._lastSelClickedRowNr = rowNr;
                panel._tableData.notifySelectionModified();
            };


            /**
             * Handles the mouse scroll wheel event
             * @param params
             * @private
             */
            panel._handleScrolled = function (params) {
                panel._accumulatedScrollLineDiff -= params.deltaY;
                if (Math.abs(panel._accumulatedScrollLineDiff) >= 1) {
                    var nLines = Math.sign(panel._accumulatedScrollLineDiff) * Math.floor(Math.abs(panel._accumulatedScrollLineDiff));
                    panel.navigateLineDiff(nLines);
                    panel._accumulatedScrollLineDiff -= nLines;
                }
            };


            /**
             * Handles the toggling of the sort state for an individuale column
             * @param {string} colId - column id
             * @private
             */
            panel._toggleSortByField = function (colId) {
                panel._tableData._toggleSortByField(colId);
                panel.resetView();
                panel._updateSortStatus();
            };


            /**
             * Updates the row sort status
             * @private
             */
            panel._updateSortStatus = function () {
                $.each(panel._columns, function (colNr, colInfo) {
                    var $ElColHeader = panel._getColSub$El('header', colNr);
                    if (colInfo.canSort()) {
                        var sortInv = false;
                        var sortBox = $ElColHeader.find('.AXMPgTableColSortBox');
                        if (panel._tableData.getSortColumn() == colInfo._id) {
                            sortBox.addClass('AXMPgTableColSortBoxActive');
                            sortInv = panel._tableData.getSortInverse();
                        } else
                            sortBox.removeClass('AXMPgTableColSortBoxActive');
                        sortBox.html(`<i class="fa fa-arrow-${sortInv ? 'up' : 'down'}"></i>`);
                    }
                });
            };

            /**
             * Stores the column layout settings as a local cookie
             * @private
             */
            panel._storeColumnSettings = function () {
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
                        Cookies.set('TableSettings_' + panel.getTypeId(), content);
                }
            };


            /**
             * Loads the column layout settings from a local cookie, if present
             * @private
             */
            panel._loadColumnSettings = function () {
                if (panel._storeLayout) {
                    var encodedContent = Cookies.get('TableSettings_' + panel.getTypeId());
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


            /**
             * Returns row & column number of a cell, given the jquery cell element
             * @param {jquery} $El
             * @returns {rowNr, colNr}
             * @private
             */
            panel._findTableCell$El = function ($El) {
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


            /**
             * Clears the content of the table
             */
            panel.emptyContent = function () {
                var $ElRightBody = $('#' + panel._divid_rightBody);
                var $ElLeftBody = $('#' + panel._divid_leftBody);
                $ElLeftBody.html('');
                $ElRightBody.html('');
            };


            /**
             * Resets the table pager to top view
             */
            panel.resetView = function () {
                panel._tableOffset = 0;
                panel._lastSelClickedRowNr = null;
                panel._currentRowNr = 0;
                panel.invalidate();
            };


            /**
             * Forces an update of the displayed table content, refreshing any available cache
             */
            panel.reloadContent = function () {
                panel._tableData.resetBuffer();
                panel.invalidate();
            };

            /**
             * Re-renders the table content
             */
            panel.invalidate = function () {
                panel.renderTableContent();
            };


            /**
             * Navigates the pager to the first page
             */
            panel.navigateFirstPage = function () {
                panel._tableOffset = 0;
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            /**
             * Navigates the pager to the previous page
             */
            panel.navigatePreviousPage = function () {
                panel._tableOffset = Math.max(0, panel._tableOffset - panel._tableLineCount);
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            /**
             * Navigates the pager to the next page
             */
            panel.navigateNextPage = function () {
                panel._tableOffset = Math.min(Math.max(0, panel._tableRowCount - panel._tableLineCount + 2), panel._tableOffset + panel._tableLineCount);
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            /**
             * Navigates the pager to the last page
             */
            panel.navigateLastPage = function () {
                panel._tableOffset = Math.max(0, panel._tableRowCount - panel._tableLineCount + 2);
                panel._lastSelClickedRowNr = null;
                panel.renderTableContent();
            };

            /**
             * Navigates the pager over a number of lines (positive or negative
             * @param {int} diff - number of lines to change the offset
             */
            panel.navigateLineDiff = function (diff) {
                var $ElRightBody = $('#' + panel._divid_rightBody);
                var $ElLeftBody = $('#' + panel._divid_leftBody);

                var tableOffsetPrev = panel._tableOffset;
                var rowLastPrev = Math.min(panel._tableRowCount - 1, panel._tableOffset + panel._tableLineCount - 1);

                panel._tableOffset += diff;
                panel._tableOffset = Math.min(Math.max(0, panel._tableRowCount - panel._tableLineCount + 2), panel._tableOffset);
                panel._tableOffset = Math.max(0, panel._tableOffset);
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount - 1, panel._tableOffset + panel._tableLineCount - 1);
                diff = panel._tableOffset - tableOffsetPrev; // Corrected difference

                if (!panel._tableData.requireRowRange(rowFirst, rowLast, panel.renderTableContent.bind(panel), panel.renderFail))
                    return; // We need to fetch data first - no fast update here - full rendering will happen

                if (diff > 0) {
                    for (var rowNr = tableOffsetPrev; rowNr < panel._tableOffset; rowNr++) {
                        $ElLeftBody.find('#' + panel._getRowLeftId(rowNr)).remove();
                        $ElRightBody.find('#' + panel._getRowRightId(rowNr)).remove();
                    }
                    for (var rowNr = Math.max(rowLastPrev + 1, panel._tableOffset); rowNr <= rowLast; rowNr++) {
                        var rowHtml = panel._renderTableRow(rowNr);
                        $ElLeftBody.append(rowHtml.left);
                        $ElRightBody.append(rowHtml.right);
                    }
                }

                if (diff < 0) {
                    for (var rowNr = rowLastPrev + 1; rowNr > rowLast; rowNr--) {
                        $ElLeftBody.find('#' + panel._getRowLeftId(rowNr)).remove();
                        $ElRightBody.find('#' + panel._getRowRightId(rowNr)).remove();
                    }
                    for (var rowNr = Math.min(tableOffsetPrev - 1, rowLast); rowNr >= panel._tableOffset; rowNr--) {
                        var rowHtml = panel._renderTableRow(rowNr);
                        $ElLeftBody.prepend(rowHtml.left);
                        $ElRightBody.prepend(rowHtml.right);
                    }
                }

                panel._renderPager();
            };


            /**
             * Saves the table content to the client's machine
             */
            panel.saveLocal = function () {
                SimplePopups.ConfirmationBox('Do you want to download the table content<br>to your local computer?', 'Download', {}, function () {
                    panel._maxDownloadRowCount = 9999;
                    if (panel._tableData.requireRowRange(0, panel._maxDownloadRowCount, panel._exec_Save))
                        panel._exec_Save()
                });
            };


            /**
             * Executes saving the data to the client's machine
             * @private
             */
            panel._exec_Save = function () {
                var cnt = Math.min(panel._maxDownloadRowCount, panel._tableData.getRowCount());
                var data = '';
                var line = '';
                $.each(panel._columns, function addHeaders(colNr, colInfo) {
                    if (colInfo.getName().length > 0) {
                        if (line.length > 0)
                            line += '\t';
                        // Get column name without styling (if any)
                        line += colInfo.getName({styling: false});
                    }
                });
                data += line + '\n';
                const escapeMap = {'\n': '\\n', '\t': '\\t', '\r': '\\r', '\\': ''};
                for (var rowNr = 0; rowNr < cnt; rowNr++) {
                    var rowData = panel._tableData.getRow(rowNr);
                    var line = '';
                    $.each(panel._columns, function addRows(colNr, colInfo) {
                        if (colInfo.getName().length > 0) {
                            if (line.length > 0) {
                                line += '\t';
                            }
                            const content = colInfo.content2DisplayString(rowData[colInfo.getId()], rowData);

                            // We create a TSV file, so content shouldn't contain these escape characters
                            line += content.replace(/[\n\t\r\\]/g, x => escapeMap[x]);
                        }
                    });
                    data += line + '\n';
                }
                var blob = new Blob([he.decode(data)], {type: "text/plain;charset=utf-8"});
                FileSaver(blob, 'TableContent.txt');
                if (cnt < panel._tableData.getRowCount())
                    SimplePopups.ErrorBox(`Download was restricted to the first ${cnt} rows`);
            };


            /**
             * Resizes the panel
             * @param {int} xl - new x size
             * @param {int} yl - new y size
             */
            panel.resize = function (xl, yl) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                if (!panel)
                    return;
                panel._availableWidth = xl;
                panel._availableHeight = yl;
                panel._measureSize();
            };


            /**
             * Measures the available size for the table, and automatically adjusts the number of lines in the table
             * @private
             */
            panel._measureSize = function () {
                if (!panel._availableHeight)
                    return;

                var leftWidth = $('#' + panel._id + '_leftTableScrollContainer').width();
                $('#' + panel._id + '_rightTableScrollContainer').width((panel._availableWidth - leftWidth) + 'px');

                var $ElRightHeadRow = $('#' + panel._divid_rightHeadRow);
                var $ElRightBody = $('#' + panel._divid_rightBody);
                var tableHeight = $ElRightBody.height();
                var rowFirst = panel._tableOffset;
                var rowLast = Math.min(panel._tableRowCount - 1, panel._tableOffset + panel._tableLineCount - 1);
                var displayedLineCount = Math.max(1, rowLast - rowFirst + 1);
                var rowHeight = tableHeight * 1.0 / displayedLineCount;
                var headerHeight = $ElRightHeadRow.height();

                if (rowHeight > 0) {
                    panel._tableLineCount = Math.max(1, Math.floor((panel._availableHeight - headerHeight) / rowHeight) - 1);
                    panel._sizeMeasured = true;
                    panel.renderTableContent();
                }
            };

            panel.listen('UpdateTableRecordContent', function (msg) {
                if (msg.tableId == panel._tableInfo.tableId) {
                    panel.reloadContent();
                }
            });

            panel.listen('DeleteTableRecord', function (msg) {
                if (msg.tableId == panel._tableInfo.tableId) {
                    panel._tableData.setItemSelected(msg.primKey, false);
                    panel.reloadContent();
                }
            });

            panel.listen('UpdateTableInfo', function (tableid) {
                if (tableid == panel._tableInfo.tableId) {
                    panel.updateTableInfo();
                    panel._tableData.resetBuffer();
                    $('#tb' + panel._id).html(panel.createHtmlBody());
                    panel.renderTableContent();
                    panel.attachEventHandlers();
                }
            });

            panel.listen('TableSelectionModified', function (tableid) {
                if (tableid == panel._tableInfo.tableId) {
                    panel.renderTableContent();
                }
            });

            // We keep trying to measure the size, because we don't know when data will arrive
            var autoRetryMeasureSize = function () {
                if (panel == null)
                    return;
                if (panel._sizeMeasured)
                    return;
                panel._measureSize();
                setTimeout(autoRetryMeasureSize, 200)
            };
            // autoRetryMeasureSize();

            //Remove own object on closing
            panel.addTearDownHandler(function () {
                panel = null;
            });

            return panel;
        };


        /**
         * Creates a frame that contains a table panel
         * @param {string} id - panel type id
         * @param {AXM.Tables.TableData} tableData - object containing the data of the table (content of the cells)
         * @param {AXM.Tables.TableInfo} tableInfo - object containing the definition of the table (column definitions)
         * @returns {Object} - frame instance
         * @constructor
         */
        Module.createTableViewerFrame = function (id, tableData, tableInfo) {
            AXMUtils.Test.checkIsString(id);
            AXMUtils.Test.checkIsType(tableData, '@TableData');
            AXMUtils.Test.checkIsType(tableInfo, '@TableInfo');
            var thePanel = Module.create(id, tableData, tableInfo);
            var theFrame = Frame.FrameFinalCommands(thePanel);

            theFrame.addCommand({
                icon: Icon.createFA("fa-download", 0.85).setOpacity(0.7),
                hint: _TRL("Download table content to local machine")
            }, thePanel.saveLocal);


            theFrame.addSeparator();

            theFrame.addCommand({
                icon: Icon.createFA("fa-flip-horizontal fa-fast-forward", 0.85).setOpacity(0.7),
                hint: _TRL("First page")
            }, thePanel.navigateFirstPage);
            theFrame.addCommand({
                icon: Icon.createFA("fa-flip-horizontal fa-play", 0.85).setOpacity(0.7),
                hint: _TRL("Previous page")
            }, thePanel.navigatePreviousPage);
            theFrame.addCommand({
                icon: Icon.createFA("fa-play", 0.85).setOpacity(0.7),
                hint: _TRL("Next page")
            }, thePanel.navigateNextPage);
            theFrame.addCommand({
                icon: Icon.createFA("fa-fast-forward", 0.85).setOpacity(0.7),
                hint: _TRL("Last page")
            }, thePanel.navigateLastPage);

            thePanel._pagerInfo = Controls.Static({
                text: ''
            });

            if (tableData.supportsFilterExpressions()) {

                var btFilterQuery = Controls.Edit({
                    width: 200,
                    placeHolder: _TRL('Filter rows...'),
                    hasClearButton: true
                });

                var handleQueryUpdate = function () {
                    var expression = FilterExpression.create(btFilterQuery.getValue());
                    btFilterQuery.setValid(expression.isValid());

                    tableData.setFilterExpression(expression);
                    // invalidate and scroll to the top
                    thePanel.navigateFirstPage();
                }

                btFilterQuery.addNotificationHandler(AXMUtils.debounce(handleQueryUpdate, 200));

                theFrame.addSeparator();

                theFrame.addControl(btFilterQuery);
            }

            theFrame.addSeparator();

            theFrame.addControl(thePanel._pagerInfo);

            theFrame.getTablePanel = function () {
                return thePanel;
            };

            return theFrame;
        };

        return Module;
    });
