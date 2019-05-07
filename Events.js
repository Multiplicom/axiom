define(function(require, exports, module) {
    "use strict";

    function SyntheticEvent(elementId, eventType, listener) {
        this.id = elementId;
        this.type = eventType.toLowerCase();
        this.listener = listener;
    }

    var _pool = null;
    function EventPool() {
        this.events = [];
        return _pool === null ? this : _pool;
    }

    function createEventListener(event) {
        // Attach to all children instead of root node alone. The event(s)
        // mostly originate from down the DOM tree and bubble up.
        const element = document.getElementById(event.id);
        element.querySelectorAll("*").forEach(function(childNode) {
            childNode.addEventListener(event.type, event.listener);
        });
    }

    EventPool.prototype.addEventListener = function addEventListener(id, eventType, listener) {
        this.events.push(new SyntheticEvent(id, eventType, listener));
    };

    EventPool.prototype.attach = function attachEventListeners() {
        this.events.forEach(createEventListener);
    };

    module.exports = new EventPool();
});
