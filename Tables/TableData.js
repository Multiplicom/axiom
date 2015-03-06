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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Msg"],
    function (
        require, $, _,
        AXMUtils, DOM, Msg) {

        var Module = {};

        var ranseed = 0;
        var random = function () {
            ranseed = (ranseed * 9301 + 49297) % 233280;
            return ranseed / (233280.0);
        };

        var alphabet='abcdefghijklmnopqrstuvwxyz      ';
        var alphabetlen = alphabet.length;

        var randomString = function(avLen) {
            var st = '';
            var len = Math.round(avLen * (1+0.5*random()));
            for (var i=0; i<len; i++) {
                st += alphabet[Math.floor(alphabetlen*random())];
            }
            return st;
        };

        Module.create = function(id, primKey) {
            var tableData = AXMUtils.object('@TableData');
            tableData._id = id;
            tableData._primKey = primKey;

            tableData._sortCol = null;
            tableData._sortInverse = true;

            tableData.getId = function() {
                return tableData._id;
            };



            tableData._toggleSortByField = function(colId) {
                if (colId != tableData._sortCol) {
                    tableData._sortCol = colId;
                    tableData._sortInverse = false;
                }
                else {
                    tableData._sortInverse = !tableData._sortInverse;
                }
                tableData.resetBuffer();
            };

            tableData._sortByField = function(colId, inverse) {
                tableData._sortCol = colId;
                tableData._sortInverse = !!inverse;
                tableData.resetBuffer();
            };

            tableData.getPrimKey = function() {
                return tableData._primKey;
            };

            tableData.getSortColumn = function() {
                return tableData._sortCol;
            };

            tableData.getSortInverse = function() {
                return tableData._sortInverse;
            };

            tableData.resetBuffer = function() {
                reportError('Not implemented');
            };

            tableData.getRowCount = function() {
                reportError('Not implemented');
            };

            tableData.getRow = function(rowNr) {
                reportError('Not implemented');
            };

            tableData.requireRowRange = function(rowFirst, rowLast, onAvailable) {
                reportError('Not implemented');
            };


            // Item selection functionality

            tableData._selectedItemsMap = {};
            tableData._selectedCount = 0;

            tableData.setItemSelected = function(itemId, state) {
                if (state == tableData.isItemSelected(itemId))
                    return;
                tableData._selectedCount += state?+1:-1;
                tableData._selectedItemsMap[itemId] = state;
            };

            tableData.isItemSelected = function(itemId) {
                return !!tableData._selectedItemsMap[itemId];
            };

            tableData.getSelectedItemCount = function() {
                return tableData._selectedCount;
            };

            tableData.getSelectedItemList = function() {
                var lst = [];
                $.each(tableData._selectedItemsMap, function(id, status) {
                    if (status)
                        lst.push(id);
                });
                return lst;
            };

            tableData.notifySelectionModified = function() {
                Msg.broadcast('TableSelectionModified', tableData.getId());
            };


            tableData.clearSelection = function() {
                tableData._selectedItemsMap = {};
                tableData._selectedCount = 0;
                tableData.notifySelectionModified();
            };


            return tableData;
        };


        Module.DummyData = function(rowCount, iranseed) {
            ranseed = iranseed;
            var tableData = Module.create();
            tableData._cols = [];

            tableData.addTextCol = function(id, len) {
                tableData._cols.push({ tpe:'text', id:id, len:len});
            };

            tableData.addIntCol = function(id, minv, maxv) {
                tableData._cols.push({ tpe:'int', id:id, minv:minv, maxv:maxv});
            };

            tableData.addFloatCol = function(id, minv, maxv) {
                tableData._cols.push({ tpe:'float', id:id, minv:minv, maxv:maxv});
            };

            tableData.requireRowRange = function() {
                return true;
            };

            tableData.getRow = function(rowNr) {
                if ((rowNr<0) || (rowNr>=rowCount))
                    AXMUtils.reportBug('Invalid row number');
                ranseed = rowNr;
                var rowInfo =  {
                    index: rowNr+1
                };
                $.each(tableData._cols, function(colNr, colInfo) {
                    if (colInfo.tpe=='text')
                        rowInfo[colInfo.id] = randomString(colInfo.len);
                    if (colInfo.tpe=='int')
                        rowInfo[colInfo.id] = Math.round(colInfo.minv + random() * (colInfo.maxv-colInfo.minv));
                    if (colInfo.tpe=='float')
                        rowInfo[colInfo.id] = colInfo.minv + random() * (colInfo.maxv-colInfo.minv);
                });
                return rowInfo;
            };

            tableData.getRowCount = function() {
                return rowCount;
            };


            return tableData;
        };

        return Module;
    });

