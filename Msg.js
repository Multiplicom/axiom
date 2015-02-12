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

define(
    function () {
        var Msg = {};

        Msg._listeners = [];
        Msg._listeneridmap = {};

        //Broadcasts a message (does not put any constraints on the number of recipients receiving the message)
        Msg.broadcast = function (msgId, content) {
            var receiverCount = 0
            for (var lnr = 0; lnr < Msg._listeners.length; lnr++) {
                if (Msg._listeners[lnr]!=null) {
                    if (msgId == Msg._listeners[lnr].msgId) {
                        Msg._listeners[lnr].callbackFunction(content);
                        receiverCount++;
                    }
                }
            }
            return receiverCount;
        };

        //Send a message (requires the message to be received by exactly one recipient)
        Msg.send = function (msgId, content) {
            var receiverCount = Msg.broadcast(msgId, content);
            if (receiverCount > 1)
                AXMreportError("Message was processed by more than one recipient");
            if (receiverCount == 0)
                AXMreportError("Message was not processed by any recipient");
        };

        //eventid: optional unique identifier to avoid duplicate entry of the same listener
        Msg.listen = function (eventid, msgId, callbackFunction) {
            if (typeof (eventid) != 'string')
                AXMreportError('Listener event id not provided');
            if (!callbackFunction)
                AXMreportError('No callback function provided for event listener');
            if ((eventid != '') && (eventid in Msg._listeneridmap)) {
                var idx = Msg._listeneridmap[eventid];
                Msg._listeners[idx].msgId = msgId;
                Msg._listeners[idx].callbackFunction = callbackFunction;
                return;
            }
            if (eventid != '')
                Msg._listeneridmap[eventid] = Msg._listeners.length;
            Msg._listeners.push({ eventid: eventid, msgId: msgId, callbackFunction: callbackFunction });
        };

        Msg.delListener = function(eventid) {
            if (eventid in Msg._listeneridmap) {
                var idx = Msg._listeneridmap[eventid];
                Msg._listeners[idx] = null;
                delete Msg._listeneridmap[eventid];
            }
        };

        return Msg
    });
