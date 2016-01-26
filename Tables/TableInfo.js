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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Color"
    ],
    function (
        require, $, _,
        AXMUtils, DOM, Color
    ) {

        var Module = {};


        Module.colInfo = function(id) {
            var coldef = AXMUtils.object('@ColInfo');
            coldef._id = id;
            coldef._name = id;
            coldef._dispSize = 140;
            coldef._onOpen = null;
            coldef._canSort = false;
            coldef._isVisibleInTable = true;

            coldef.setName = function(iName) {
                coldef._name = iName;
                return coldef;
            };

            coldef.setDispSize = function(dispSize) {
                coldef._dispSize = dispSize;
                return coldef;
            };

            coldef.setOnOpen = function(onOpen) {
                coldef._onOpen = onOpen;
                return coldef;
            };

            coldef.disableSort = function() {
                coldef._canSort = false;
                return coldef;
            };

            coldef.enableSort = function() {
                coldef._canSort = true;
                return coldef;
            };

            coldef.setIsVisibleInTable = function(visible) {
                coldef._isVisibleInTable = visible;
            };

            coldef.getId = function() {
                return coldef._id;
            };

            coldef.getName = function() {
                return coldef._name;
            };

            coldef.canOpen = function() {
                return !!coldef._onOpen;
            };

            coldef.canSort = function() {
                return coldef._canSort;
            };

            coldef.isVisibleInTable = function() {
                return coldef._isVisibleInTable;
            };

            coldef.callOnOpen = function() {
                if (!coldef.canOpen())
                    AXMUtils.reportBug('No column open handler');
                coldef._onOpen();
            };

            //overridable:
            coldef.content2DisplayString = function(content) {
                if (content===null)
                    return '';
                return String(content);
            };

            //overridable (should return an AXM.Color object):
            coldef.content2BackgroundColor = function(content) {
                return null;
            };

            //overridable (should return an AXM.Color object):
            coldef.content2ForegroundColor = function(content) {
                return null;
            };

            return coldef;
        };

        Module.tableInfo = function(tableId) {
            var tabledef = AXMUtils.object('@TableInfo');
            tabledef.tableId = tableId;
            tabledef._columns = [];
            tabledef._map_columns = {};
            tabledef._onOpenRow = null;
            tabledef._canSelect = false;

            tabledef.addColumn = function(colId) {
                AXMUtils.Test.checkIsString(colId);
                var colInfo = Module.colInfo(colId);
                tabledef._columns.push(colInfo);
                tabledef._map_columns[colId] = colInfo;
                return colInfo;
            };

            tabledef.setOnOpenRow = function(handler) {
                tabledef._onOpenRow = handler;
            };

            tabledef.makeCanSelect = function() {
                tabledef._canSelect = true;
            };

            tabledef.getColumns = function() {
                return tabledef._columns;
            };

            tabledef.delColumn = function(colId) {
                delete tabledef._map_columns[colId];
                var colIdx = -1;
                $.each(tabledef._columns, function(idx, colInfo) {
                    if (colInfo.getId() == colId)
                        colIdx = idx;
                });
                if (colIdx >= 0)
                    tabledef._columns.splice(colIdx, 1);
            };

            tabledef.hasColumn = function(colId) {
                var colInfo = tabledef._map_columns[colId];
                return !!colInfo;
            };

            tabledef.getColumn = function(colId) {
                var colInfo = tabledef._map_columns[colId];
                if (!colInfo)
                    AXMUtils.Test.reportBug('Invalid column {colid} for table {tableid}'.AXMInterpolate({colid: colId, tableid: tabledef.tableId}));
                return colInfo;
            };

            tabledef.getColumn_Optional = function(colId) {
                var colInfo = tabledef._map_columns[colId];
                return colInfo;
            };

            tabledef.canOpenRow = function() {
                return !!tabledef._onOpenRow;
            };

            tabledef.canSelect = function() {
                return tabledef._canSelect;
            };

            tabledef.callOnOpenRow = function(rowNr, settings, tableData) {
                if (!tabledef.canOpenRow())
                    AXMUtils.reportBug('No row open handler');
                tabledef._onOpenRow(rowNr, settings, tableData);
            };



            return tabledef;
        };

        return Module;
    });

