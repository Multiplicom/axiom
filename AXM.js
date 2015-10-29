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
        "AXM/Msg", "AXM/AXMUtils", "AXM/Color", "AXM/DOM", "AXM/DrawUtils", "AXM/Icon",
        "AXM/Application",
        "AXM/Tables/TableData", "AXM/Tables/TableInfo",
        "AXM/Controls/Controls", "AXM/Controls/Compound",
        "AXM/Panels/Frame", "AXM/Panels/FlexTabber", "AXM/Panels/PanelForm", "AXM/Panels/PanelTable", "AXM/Panels/PanelCanvas", "AXM/Panels/PanelCanvasZoomPan", "AXM/Panels/PanelCanvasXYPlot", "AXM/Panels/PanelHtml",
        "AXM/Windows/RootWindow", "AXM/Windows/PopupWindow", "AXM/Windows/SimplePopups", "AXM/Windows/LogViewer", "AXM/Windows/DocViewer",
        "AXM/DataFrames/DataFrame"
    ],
    function (
        require, $, _,
        Msg, Utils, Color, DOM, DrawUtils, Icon,
        Application,
        TableData, TableInfo,
        Controls, Compound,
        Frame, FlexTabber, PanelForm, PanelTable, PanelCanvas, PanelCanvasZoomPan, PanelCanvasXYPlot, PanelHtml,
        RootWindow, PopupWindow, SimplePopups, LogViewer, DocViewer,
        DataFrame
    ) {

        /**
         * Module encapsulating a hierarchical tree of all Axiom modules
         * @type {{}}
         */
        var Module = {
            Msg: Msg,
            DOM: DOM,
            Utils: Utils,
            Color: Color,
            DrawUtils: DrawUtils,
            Test: Utils.Test,
            Icon: Icon,
            Application: Application,
            Tables: {
                TableData:TableData,
                TableInfo: TableInfo
            },
            Controls: Controls,
            Panels: {
                Frame: Frame,
                FlexTabber: FlexTabber,
                PanelForm: PanelForm,
                PanelTable: PanelTable,
                PanelCanvas: PanelCanvas,
                PanelCanvasZoomPan: PanelCanvasZoomPan,
                PanelCanvasXYPlot: PanelCanvasXYPlot,
                PanelHtml: PanelHtml
            },
            Windows: {
                RootWindow: RootWindow,
                PopupWindow: PopupWindow,
                SimplePopups: SimplePopups,
                LogViewer: LogViewer,
                DocViewer: DocViewer
            },
            DataFrame: DataFrame
        };


        return Module;
    });

