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
        "require", "jquery", "_", "filesaver",
        "AXM/AXMUtils", "AXM/DOM", "AXM/Controls/Controls", "AXM/Panels/Frame", "AXM/Panels/PanelBase", "AXM/Msg",
        "AXM/Windows/SimplePopups",
        "AXM/Tables/TableInfo"
    ],
    function (
        require, $, _, FileSaver,
        AXMUtils, DOM, Controls, Frame, PanelBase, Msg,
        SimplePopups,
        TableInfo
    ) {

        /**
         * Module encapsulating a panel that contains a  table
         * @type {{}}
         */
        var Module = {};

        /**
         * Implements a panel that contains a table
         * @param {string} id - panel type id
         * @returns {Object} - panel instance
         * @constructor
         */
        Module.create = function(typeId) {
            var panel = PanelBase.create(typeId);

            panel._columns = [];
            panel._rows = [];
            panel._activeControls = [];

            panel.addColumn = function(colId, colName, colControl) {
                panel._columns.push({
                    colId: colId,
                    colName: colName,
                    colControl: colControl
                });
            };

            panel.addRow = function(rowInfo) {
                $.each(panel._columns, function(idx, column) {
                    if (rowInfo[column.colId])
                        AXMUtils.Test.checkIsType(rowInfo[column.colId], '@Control');
                });
                panel._rows.push(rowInfo);
            };

            panel.resetColumns = function() {
                panel._columns = [];
            };

            panel.resetRows = function() {
                panel._rows = [];
                panel._clearActiveControls();
            };

            panel._clearActiveControls = function() {
                $.each(panel._activeControls, function(idx, control) {
                    control.tearDown();
                });
                panel._activeControls = [];
            };

            /**
             * Returns the html implementing the panel
             * @returns {string}
             */
            panel.createHtml = function() {

                var divRoot = DOM.Div({id: 'rt' + panel._id})
                    .addStyle('width', '100%')
                    .addStyle('height', '100%')
                    //.addStyle('overflow-x', 'scroll')
                    .addStyle('position', 'relative');
                    //.addStyle('background-color', 'yellow')

                //divRoot.addElem(panel.createHtmlBody());

                var divRoot = DOM.Div({id: 'tb' + panel._id, parent: divRoot})
                    //.addStyle('width', '100%')
                    .addStyle('height', 'calc(100% - 20px)')
                    .addStyle('margin-top', '20px')
                    .addStyle('overflow-x', 'scroll')
                    .addStyle('overflow-y', 'scroll')
                    .addStyle('white-space', 'nowrap');
                //.addStyle('position', 'relative')
                //.addStyle('background-color', 'yellow')

                //divRoot.addElem(panel.createHtmlBody());

                return divRoot.toString();
            };



            panel.render = function() {
                panel._clearActiveControls();

                var content ='<table style="padding-top:0px" class="FHTable">';

                content += '<tr style="">';
                $.each(panel._columns, function(idx, column) {
                    content += '<th><div style="padding:6px;padding-top:10px;padding-bottom:10px">';
                    if (column.colControl) {
                        content += column.colControl.createHtml();
                        panel._activeControls.push(column.colControl);
                    }
                    else
                        content += column.colName;
                    content += "</div></th>";
                });
                content += '</tr>';

                $.each(panel._rows, function(idx, row) {
                    content += '<tr>';
                    $.each(panel._columns, function(idx, column) {
                        content += '<td style="padding:6px;padding-top:10px;padding-bottom:10px">';
                        if (row[column.colId]) {
                            content += row[column.colId].createHtml();
                            panel._activeControls.push(row[column.colId]);
                        }
                        content += "</td>";
                    });
                    content += '</tr>';
                });

                content += "</table>";

                $('#tb'+panel._id).html(content);

                $.each(panel._columns, function(idx, column) {
                    if (column.colControl)
                        content += column.colControl.attachEventHandlers();
                });

                $.each(panel._rows, function(idx, row) {
                    $.each(panel._columns, function(idx, column) {
                            if (row[column.colId])
                                row[column.colId].attachEventHandlers();
                    });
                });

            };

                /**
             * Attached the html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function() {
            };


            /**
             * Detach the html event handlers
             */
            panel.detachEventHandlers = function() {
            };




            /**
             * Resizes the panel
             * @param {int} xl - new x size
             * @param {int} yl - new y size
             */
            panel.resize = function(xl, yl) {
                AXMUtils.Test.checkIsNumber(xl, yl);
                panel._availableWidth = xl;
            };



            //Remove own object on closing
            panel.addTearDownHandler(function() {
                panel._clearActiveControls();
                panel = null;
            });

            return panel;
        } ;

        return Module;
    });

