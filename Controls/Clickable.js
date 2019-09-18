define(["require"], function() {
    "use strict";

    /**
     * @mixes
     */
    var Clickable = {
        attachEventHandlers: function addClickListener() {
            this._getSub$El("").click(
                function onControlClicked(event) {
                    if (this) {
                        this.performNotify(event);
                        event.stopPropagation();
                        // Don't return false, callback can 
                        // use Event.preventDefault instead 
                        // choose the behavior it likes.
                    }
                }.bind(this) 
            );
        },
        detachEventHandlers: function removeClickListener() {
            if (this) {
                this._getSub$El("").unbind("click");
            }
        }
    };

    return Clickable;
});
