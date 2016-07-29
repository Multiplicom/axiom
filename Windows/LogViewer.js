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
        "AXM/AXMUtils", "AXM/Test", "AXM/Windows/PopupWindow", "AXM/Panels/Frame", "AXM/Panels/PanelHtml", "AXM/Controls/Controls"],
    function (
        require, $, _,
        Utils, Test, Popupwin, Frame, PanelHtml, Controls) {

        /**
         * Module encapsulating a popup window that is displaying a structured log file
         * @type {{}}
         */
        var Module = {};

        /**
         * Creates a list of log lines for a dictionary without timestamps
         * @param {object} metaDict - target dict
         */
        Module.dictToLogText = function(metaDict){
            var logContent = '';

            $.each(metaDict, function(key, value){
                    if(Utils.isString(value)){
                        var valueContent = value;
                        while (valueContent.indexOf('$|$') >= 0)
                            valueContent = valueContent.replace('$|$', '<br>');
                        logContent += '<div class="AXMLogLine"><b>' + key + ': </b>'  + valueContent + '</div>';
                    }
                }
            );

            return logContent
        };

        /**
         * Creates a list of log lines without timestamps or other layout
         * @param {object} logLines - target lines
         */
        Module.baseLogText = function(logLines){
            var logContent = '';

            $.each(logLines, function(idx, logLine) {
                logContent += '<div class="AXMLogLine">' + logLine + '</div>';
            });

            return logContent
        };

        /**
         * Parse the log lines
         * @param {array} logLines - array of log lines
         */
        Module.parseLogLines = function(logLines){
            var fmtLogContent = '';
            var sectionStack = [];

            $.each(logLines, function(idx, logLine) {

                var timeStamp = logLine.substring(0,19);
                logLine = logLine.substring(20);
                if (logLine.substring(0,2) == '#@') {
                    logLine = logLine.substring(2);
                    if (logLine.indexOf('>SECT>') == 0) {
                        fmtLogContent += '<div class="reportunit">';
                        var sectionTitle = logLine.substring('>SECT>'.length);
                        sectionStack.push({
                            tme: new Date(timeStamp.replace(/-/g, "/")).getTime(),
                            title: sectionTitle
                        });
                        var sectionLevel = sectionStack.length;
                        var headerLine = '<div class="reportheader"><h{levela}>{title}</h{levelb}></div>'.AXMInterpolate({levela: sectionLevel, levelb: sectionLevel, title: sectionTitle});
                        fmtLogContent += headerLine;
                        fmtLogContent += '<div class="reportbody">';
                    }
                    if (logLine.indexOf('<SECT<') == 0) {
                        var tme = new Date(timeStamp.replace(/-/g, "/")).getTime();
                        if (sectionStack.length == 0)
                            Utils.reportBug('Closing section is not matched by opening section on line '+idx);
                        var sectionInfo = sectionStack.pop();
                        var timeDiff = (tme-sectionInfo.tme)/1000;
                        var timeDiffStr = timeDiff%60+'s';
                        timeDiff = Math.floor(timeDiff/60);
                        if (timeDiff > 0) {
                            timeDiffStr = timeDiff%60+'m' + timeDiffStr;
                            timeDiff = Math.floor(timeDiff/60);
                            if (timeDiff > 0) {
                                timeDiffStr = timeDiff%60+'h' + timeDiffStr;
                            }
                        }
                        fmtLogContent += '<div class="AXMLogElapsedInfo">{title} elapsed {str}</div>'.AXMInterpolate({title: sectionInfo.title, str: timeDiffStr});
                        fmtLogContent += '</div></div>';
                    }
                    if (logLine.indexOf('>WARNING>') == 0) {
                        fmtLogContent += '<div class="AXMLogWarning">';
                    }
                    if (logLine.indexOf('<WARNING<') == 0) {
                        fmtLogContent += '</div>';
                    }
                    if (logLine.indexOf('>ERROR>') == 0) {
                        fmtLogContent += '<div class="AXMLogError">';
                    }
                    if (logLine.indexOf('<ERROR<') == 0) {
                        fmtLogContent += '</div>';
                    }
                }
                else {
                    while (logLine.indexOf('$|$') >= 0)
                        logLine = logLine.replace('$|$', '<br>');
                    fmtLogContent += '<div class="AXMLogLine"><span class="AXMLogTimeStamp">' + timeStamp + '</span> '  + logLine + '</div>';
                }
            });

            while (sectionStack.length > 0) {
                var sectionInfo = sectionStack.pop();
                fmtLogContent += '<div class="AXMLogElapsedInfo" style="color: orangered">{title} busy</div>'.AXMInterpolate({title: sectionInfo.title});
                fmtLogContent += '</div></div>';

            }

            return fmtLogContent
        };

        /**
         * Creates a popup window that is displaying a structured log file
         * @param {string} title - popup title
         * @param {string} logContent - structured log content
         * @param {object} settings - meta information about the log containing additional settings
         * @constructor
         */
        Module.create = function(title, logContent, settings) {

            var fmtLogContent = '';
            var logLines = logContent.split('\n');

            if(settings.meta){
                fmtLogContent += '<div class="reportunit">';
                fmtLogContent += '<div class="reportheader"><h1>Information</h1></div>';
                fmtLogContent += '<div class="reportbody">';
                fmtLogContent += Module.dictToLogText(settings.meta);
                fmtLogContent += '</div></div>';
            }


            if(settings.warning)
                fmtLogContent += '<div class="AXMLogWarning">';
            if(settings.error)
                fmtLogContent += '<div class="AXMLogError">';

            fmtLogContent += '<div class="reportunit">';
            fmtLogContent += '<div class="reportheader"><h1>Content</h1></div>';
            fmtLogContent += '<div class="reportbody">';
            fmtLogContent += Module.parseLogLines(logLines);
            fmtLogContent += '</div></div>';

            if(settings.stackTrace){
                fmtLogContent += '<div class="reportunit">';
                fmtLogContent += '<div class="reportheader"><h1>Stack trace</h1></div>';
                fmtLogContent += '<div class="reportbody">';
                fmtLogContent += Module.baseLogText(settings.stackTrace.split('\n'));
                fmtLogContent += '</div></div>';
            }

            if(settings.warning)
                fmtLogContent += '</div>';
            if(settings.error)
                fmtLogContent += '</div>';

            var win = Popupwin.create({
                title: title,
                autoCenter: true,
                sizeX: 700,
                sizeY: 500
            });


            /**
             * Initialises the popup
             */
            win.init = function() {

                win.panelHtml = PanelHtml.create('intro');
                win.panelHtml.enableVScrollBar().enableHScrollBar();
                var rootFrame = Frame.FrameFinalCommands(win.panelHtml);

                var bt_noWrap = rootFrame.addCommand({
                    icon: "fa-align-left",
                    hint: "Do not wrap log lines"
                }, function() {
                    win.noWrap = !win.noWrap;
                    bt_noWrap.setChecked(win.noWrap);
                    if (win.noWrap)
                        win.panelHtml.get$El().find('.AXMLogLine').addClass('AXMLogLineNoWrap');
                    else
                        win.panelHtml.get$El().find('.AXMLogLine').removeClass('AXMLogLineNoWrap');
                });


                win.panelHtml.setContent(fmtLogContent);

                win.setRootFrame(rootFrame);
                win.start();

                win.panelHtml.get$El().find('.reportheader').click(function(ev) {
                    $(this).parent().children('.reportbody').slideToggle(300);
                });

            };



            win.init();

        };

        return Module;
    });

