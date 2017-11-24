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
    "AXM/Test"
],
    function (Test) {

        /**
         * Module encapsulating functionality to send and receive messages
         * @type {{}}
         */
        var Msg = {};

        Msg._listeners = [];
        Msg._listeneridmap = {};

        /**
         * Broadcasts a message (does not put any constraints on the number of recipients receiving the message)
         * @param {string} msgId - message ID
         * @param {{}} content - message content
         * @returns {Array} - results returned by each recipient
         */
        Msg.broadcast = function (msgId, content) {
            var results = [];
            for (var lnr = 0; lnr < Msg._listeners.length; lnr++) {
                if (Msg._listeners[lnr]!=null) {
                    if (msgId == Msg._listeners[lnr].msgId) {
                        var result = Msg._listeners[lnr].callbackFunction(content);
                        results.push(result);
                    }
                }
            }
            return results;
        };

        /**
         * Sends a message (requires the message to be received by exactly one recipient)
         * @param {string} msgId - message ID
         * @param {{}} content - message content
         * @returns {*} - result returned by recipient
         */
        Msg.send = function (msgId, content) {
            var results = Msg.broadcast(msgId, content);
            var receiverCount = results.length;
            if (receiverCount > 1)
                Test.reportBug("Message was processed by more than one recipient");
            if (receiverCount == 0)
                Test.reportBug("Message was not processed by any recipient");
            return results[0];
        };

        /**
         * Subscribes to a specific message
         * @param {string} eventid - id of this subscription (can be empty)
         * @param {string} msgId - message ID to listen to
         * @param {function} callbackFunction - called when the message was sent
         */
        Msg.listen = function (eventid, msgId, callbackFunction) {
            if ((typeof (eventid) !== 'string') && (eventid!==null))
                Test.reportBug('Listener event id not provided');
            if (!msgId)
                Test.reportBug("No event ID provided");
            if (!callbackFunction)
                Test.reportBug('No callback function provided for event listener');
            if ((eventid != '') && (eventid in Msg._listeneridmap)) {
                var idx = Msg._listeneridmap[eventid];
                Msg._listeners[idx].msgId = msgId;
                Msg._listeners[idx].callbackFunction = callbackFunction;
                return;
            }
            if (eventid)
                Msg._listeneridmap[eventid] = Msg._listeners.length;
            Msg._listeners.push({ eventid: eventid, msgId: msgId, callbackFunction: callbackFunction });
        };


        /**
         * Removes a subscription
         * @param {string} eventid - id of the subscription
         */
        Msg.delListener = function(eventid) {
            if (eventid in Msg._listeneridmap) {
                var idx = Msg._listeneridmap[eventid];
                Msg._listeners[idx] = null;
                delete Msg._listeneridmap[eventid];
            }
        };

        return Msg
    });
