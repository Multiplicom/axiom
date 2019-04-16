//Copyright (c) 2019 Multiplicom NV
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
        "AXM/AXMUtils", "AXM/DOM",
        "AXM/Controls/Compound", "AXM/Controls/Controls"
    ],
    function (
        require, $, _,
        AXMUtils, DOM,
        Compound, Control
    ) {

        var Module = {};

        Module.LegendItem = function(settings) {
            settings.reactOnClick = true;
            var legendItem = Control.Static(settings);

            legendItem.createHtml = function() {
                var rootEl = DOM.Create("div", {id: legendItem._getSubId('')});

                DOM.Label({id: legendItem._getSubId('_color'), parent: rootEl})
                    .addStyle('background-color', settings.color)
                    .addStyle('cursor', 'pointer')
                    .addAttribute('title', settings.tooltip)
                    .addElem('&nbsp;&nbsp;&nbsp;');

                DOM.Label({id: legendItem._getSubId('_spacer'), parent: rootEl})
                    .addStyle('cursor', 'pointer')
                    .addElem('&nbsp;');

                DOM.Label({ id: legendItem._getSubId('_label'), parent: rootEl, target: legendItem._getSubId('')})
                    .addStyle('cursor', 'pointer')
                    .addElem(settings.text);

                return rootEl.toString();
            };

            return legendItem;
        };

        Module.create = function(settings) {

            var colorLegend = Compound.CompoundControlBase();

            /**
             * Returns the html implementing the control
             * @returns {string}
             */
            colorLegend.createHtml = function(settings) {
                var div = DOM.Div({id: colorLegend._id+'_wrapper'});
                $.each(colorLegend._members, function(idx, member) {
                    var elemDiv = DOM.Div({parent:div});
                    elemDiv.addElem(member.createHtml());
                });
                return div.toString();
            };

            colorLegend.setProperty = function(property) {
                colorLegend.clear();
                if (property != null) {
                    var legendData = property.mapColors(property.data);
                    $.each(legendData, function(idx, legendItem) {

                        var tooltip = legendItem.representedValue.type === 'range' ?
                            "Select values from " + legendItem.representedValue.min + " to " + legendItem.representedValue.max :
                            "Select " + legendItem.representedValue.value;

                        colorLegend.add(
                            Module.LegendItem({
                                text: legendItem.content,
                                color: legendItem.color.toString(),
                                tooltip: tooltip
                            }).addNotificationHandler(function() {
                                    if (settings.selectionHandler)
                                        settings.selectionHandler(property, legendItem.representedValue);
                                })
                        );
                    });
                }
                colorLegend.liveUpdate();
            };

            colorLegend.liveUpdate = function() {
                var $El = $('#' + colorLegend._id+'_wrapper');
                $El.html(colorLegend.createHtml());
                colorLegend.attachEventHandlers();
            };


            return colorLegend;

        };

        return Module;
    });
