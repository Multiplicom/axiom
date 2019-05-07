define(["require"], function(require) {
    function Unit(suffix) {
        return function withSuffix(quantity) {
            if (quantity == null) {
                throw Error("Quantity cannot be null or undefined for Unit '" + suffix + "'")
            }

            return quantity + suffix;
        };
    }

    Unit.px = Unit("px");

    Unit.pc = Unit("%");

    return Unit;
});