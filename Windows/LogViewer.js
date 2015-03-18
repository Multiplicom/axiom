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
        "AXM/AXMUtils", "AXM/Windows/PopupWindow", "AXM/Panels/Frame", "AXM/Panels/PanelHtml", "AXM/Controls/Controls"],
    function (
        require, $, _,
        Utils, Popupwin, Frame, PanelHtml, Controls) {

        var Module = {};

        Module.create = function(title, logContent) {

            var fmtLogContent = '';
            var logLines = logContent.split('\n');

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
                            tme: new Date(timeStamp).getTime(),
                            title: sectionTitle
                        });
                        var sectionLevel = sectionStack.length;
                        var headerLine = '<div class="reportheader"><h{levela}>{title}</h{levelb}></div>'.AXMInterpolate({levela: sectionLevel, levelb: sectionLevel, title: sectionTitle});
                        fmtLogContent += headerLine;
                        fmtLogContent += '<div class="reportbody">';
                    }
                    if (logLine.indexOf('<SECT<') == 0) {
                        var tme = new Date(timeStamp).getTime();
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

            var win = Popupwin.create({
                title: title,
                autoCenter: true,
                resizable: true,
                sizeX: 700,
                sizeY: 500
            });

            win.init = function() {

                win.panelHtml = PanelHtml.create('intro');
                win.panelHtml.enableVScrollBar().enableHScrollBar();
                var rootFrame = Frame.FrameFinalCommands(win.panelHtml);

                var bt_noWrap = rootFrame.addCommand({
                    icon: "fa-align-left"
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

