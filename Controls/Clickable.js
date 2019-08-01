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
                        this.performNotify();
                        event.stopPropagation();
                        return false;
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
