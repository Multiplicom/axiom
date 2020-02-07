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
        "AXM/AXMUtils", "AXM/DOM", "AXM/Panels/PanelBase"],
    function (
        require, $, _,
        AXMUtils, DOM, PanelBase) {


        /**
         * Module encapsulating a panel that contains raw html code
         * @type {{}}
         */
        var Module = {};


        /**
         * Implements a panel that contains raw html code
         * @param {string} id - panel id
         * @returns {id}
         */
        Module.create = function(id) {
            var panel = PanelBase.create(id);
            panel._content = '';
            panel._scrollEventHandler = null;


            /**
             * Enables a vertical scroll bar for the panel
             * @returns {Object} - self
             */
            panel.enableVScrollBar = function() {
                panel._scrollbarV  = true;
                return panel;
            };

            /**
             * Enables a vertical scrolling without scrollbar
             * @returns {Object} - self
             */
            panel.enableVScrollingNoBar = function() {
                panel._scrollVNoBar  = true;
                return panel;
            };

            /**
             * Enables a horizontal scroll bar for the panel
             * @returns {Object} - self
             */
            panel.enableHScrollBar = function() {
                panel._scrollbarH  = true;
                return panel;
            };

            panel.setScrollEventHandler = function(handler) {
                panel._scrollEventHandler = handler;
            };

            /**
             * Sets the html content of the panel
             * @param {string} content - html content
             */
            panel.setContent = function(content) {
                panel._content = content;

                if (typeof content === 'string' || content instanceof String) {
                    panel.get$El().html(content.toString());
                }

                if (content instanceof DOMElement) {
                    var panelContent = document.getElementById(panel.getContentElementId());
                    
                    if (panelContent) {
                        // remove all content
                        panelContent.innerHTML = '';
                        
                        var documentFragment = document.createDocumentFragment();
                        documentFragment.appendChild(content.node$);

                        panelContent.appendChild(documentFragment);
                    }
                }
            };

            /**
             * Appends html content to the panel
             * @param {string} content - html content
             */
            panel.appendContent = function(content) {
                panel._content = content;
                panel.get$El().append(content);
            };


            /**
             * Returns the jquery element of the html content
             * @returns {jQuery}
             */
            panel.get$El = function() {
                return $('#' + panel.getId() + '_content');
            };


            /**
             * Returns the ID of the element with the content
             * @returns {string}
             */
            panel.getContentElementId = function() {
                return panel.getId() + '_content';
            };


            /**
             * Returns the html implementing the panel
             * @returns {string}
             */
            panel.createHtml = function() {
                var rootDiv = DOM.Div({id: panel.getId()+'_content'});
                rootDiv.addCssClass('AXMHtmlPanelBody');
                rootDiv.addStyle('width', '100%');
                rootDiv.addStyle('height', '100%');
                rootDiv.addStyle('overflow', 'hidden');
                if (panel._scrollbarV)
                    rootDiv.addStyle('overflow-y', 'scroll');
                if (panel._scrollbarH)
                    rootDiv.addStyle('overflow-x', 'scroll');
                rootDiv.addElem(panel._content);
                return rootDiv;
            };


            /**
             * Scrolls to the bottom of the content
             */
            panel.scrollToBottom = function() {
                var el = panel.get$El();
                el.animate({ scrollTop: el.height()}, 250);
            };


            /**
             * Attaches the html event handlers after DOM insertion
             */
            panel.attachEventHandlers = function() {
                //if (panel._rootControl)
                //    return panel._rootControl.attachEventHandlers();

                if (panel._scrollVNoBar) {
                    var el = panel.get$El();
                    AXMUtils.create$ElScrollHandler(el, function(data) {
                        //el.animate({ scrollTop: el.scrollTop()+data.deltaY*16}, 25);
                        panel.get$El().scrollTop(panel.get$El().scrollTop()+ -data.deltaY*16);
                    });
                }

                if (panel._scrollEventHandler)
                    panel.get$El().scroll(function(ev) {
                        var data = {};
                        panel._scrollEventHandler(data);
                    });

            };


            /**
             * Detaches the html event handlers
             */
            panel.detachEventHandlers = function() {
                if (panel && panel._scrollVNoBar) {
                    var el = panel.get$El();
                    AXMUtils.remove$ElScrollHandler(el);
                }

            };

            panel.resize = function(xl, yl) {
            };

            return panel;
        } ;

        return Module;
    });

