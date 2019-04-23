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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Msg", "AXM/Windows/SimplePopups"],
    function (require, $, _,
              AXMUtils, DOM, Msg, Popup) {


        /**
         * Module encapsulating a toolbox popup for a frame
         * @type {{}}
         */
        var Module = {};

        /**
         * List of all toolboxes that are currently present (hidden or visible)
         * @type {Array}
         * @private
         */
        Module._list = [];


        Module.create = function (icon, rootControl) {
            var toolBox = {};
            toolBox._id = AXMUtils.getUniqueID();
            toolBox._frame = null;
            toolBox._icon = icon;
            toolBox._rootControl = rootControl;
            toolBox._isActive = false;

            toolBox.getIcon = function () {
                return toolBox._icon;
            };

            toolBox._getStart$El = function () {
                return toolBox._frame.getRoot$El().find('.ToolBoxStart');
            };

            toolBox.start = function () {
                if (!toolBox._frame)
                    AXMUtils.reportBug("Toolbox not attached to frame");

                var toolBoxStart = DOM.Div({});
                toolBoxStart.addCssClass("ToolBoxStart");
                var startIcon = DOM.Div({ className: "ToolBoxStartIcon" });
                startIcon.addElem(toolBox.getIcon().renderHtml());
                toolBoxStart.addElem(startIcon);

                var frame = document.getElementById(toolBox._frame._id)
                frame.appendChild(toolBoxStart.htmlElement());

                var rootDiv = DOM.Div({id: toolBox._id});
                rootDiv.addCssClass("ToolBoxContainer");
                rootDiv.addElem(toolBox._rootControl.createHtml());

                $('.AXMContainer').append(rootDiv.toString());
                toolBox._$ElContainer = $('#' + toolBox._id);

                toolBox._getStart$El().click(toolBox.onClickStart);
                toolBox._rootControl.attachEventHandlers();

                Module._list.push(toolBox);
            };

            toolBox.close = function () {
                toolBox._getStart$El().unbind('click');
                toolBox._rootControl.detachEventHandlers();
                toolBox._$ElContainer.remove();
                var idx = -1;
                $.each(Module._list, function(i, item) {
                    if (item === toolBox)
                        idx = i;
                });
                if (idx>=0)
                    Module._list.splice(idx, 1);
            };

            toolBox.onClickStart = function () {
                if (toolBox._isActive)
                    return;
                toolBox._$ElContainer.css("z-index", AXMUtils.getCurrentZIndex()+100);
                toolBox._$ElContainer.css("visibility", "visible");
                var browserSize = AXMUtils.getBrowserSize();

                var boxW = toolBox._$ElContainer.outerWidth();
                var boxH = toolBox._$ElContainer.outerHeight();

                var left = toolBox._getStart$El().offset().left - boxW;
                if (left<0) left = 0;
                var top = toolBox._getStart$El().offset().top - 1;
                if (top+boxH > browserSize.sizeY-2)
                    top = browserSize.sizeY-2-boxH;
                if (top<0) top = 0;

                toolBox._$ElContainer.offset({
                    top: top,
                    left: left
                });

                toolBox._isActive = true;

                setTimeout(function() {
                    $(document).bind("mouseup.toolbox", toolBox._onDocClicked);
                }, 100);
            };

            toolBox.hide = function() {
                if (toolBox._isActive) {
                    toolBox._$ElContainer.css("visibility", "hidden");
                    setTimeout(function() {
                        toolBox._isActive = false;
                    }, 50); // introducing a delay to make sure that clicking the toolbox start element does not immediately reactives it
                    $(document).unbind("mouseup.toolbox");
                }
            };

            toolBox._onDocClicked = function(ev) {
                // If a blocking popup is currently active a click event
                // will originate from the transparant overlay. A user click 
                // on the overlay will wrongly close the toolbox because
                // it is not part of the same DOM subtree and thus "outside" 
                // of the toolbox.
                if (Popup.currentlyBlocking) {
                    return;
                }

                if (ev.target) {
                    var clicked$El = $(ev.target);
                    if (clicked$El.length < 1)
                        return;
                    if ((toolBox._$ElContainer[0]!=clicked$El[0]) && (!$.contains(toolBox._$ElContainer[0], clicked$El[0]))) {
                        toolBox.hide();
                    }

                }
            };

            return toolBox;
        };


        Msg.listen(null, "CloseTransientPopups", function() {
            $.each(Module._list, function(idx, box) {
                box.hide();
            });
        });


        return Module;
    });

