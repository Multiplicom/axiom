import * as DOM from "AXM/DOM";
import * as AXMUtils from "AXM/AXMUtils";

class Decorator {
    constructor(
        name,
        [y, x] = orientation,
        [offsetX, offsetY] = offset,
        { size, opacity, color } = options
    ) {
        this.name = name;

        if (["left", "right"].indexOf(x) < 0) {
            AXMUtils.Test.reportBug("Decorator x position should be 'left' or 'right'");
        }

        if (["top", "bottom"].indexOf(y) < 0) {
            AXMUtils.Test.reportBug("Decorator y position should be 'top' or 'bottom'");
        }

        this.xPos = x;
        this.yPos = y;
        this.offsetX = offsetX;
        this.offsetY = offsetY;

        this.size = size;
        this.opacity = opacity;
        this.color = color;
    }
}

class IconStack {
    constructor(icons = [], { scaling } = { scaling: "1x" }) {
        if (icons.length < 0) {
            throw Error(`must have at least one icon to stack`);
        }

        this.icons = icons;

        const validFormFactors = ["lg", "1x", "2x", "3x", "4x", "5x"];
        if (!validFormFactors.includes(scaling)) {
            throw Error(`scaling factor must be one of ${validFormFactors.join(", ")}`);
        }

        this.scaling = scaling;
    }

    render() {
        return DOM.Span(
            { className: `fa-stack fa-lg` },
            this.icons.map(icon => {
                // icon.addClass(`fa-stack-${this.scaling}`);
                return icon;
            })
        );
    }
}

class Icon {
    constructor({ name, decorators = [], style = {}, classNames = [ ] } = {}) {
        Object.assign(this, AXMUtils.object("icon"));

        this.name = name;
        this._decorators = decorators;

        this._sizeFactor = 1;

        this.style = style;
        this.classNames = [
            `fa ${this.name}`,
            ...classNames
        ]
    }

    addClass(additionalClassName) {
        this.classNames.push(additionalClassName);
    }

    overrideStyle(additionalStyling = { k, v }) {
        Object.assign(this.style, additionalStyling);
    }

    getSize() {
        return this._sizeFactor;
    }

    get decorators() {
        return this._decorators;
    }

    changeSize(updatedSize) {
        this._sizeFactor = updatedSize; 
    }

    clone() {
        return _.cloneDeep(this);
    }

    addDecorator(name, xPos, offsetX, yPos, offsetY, size, opacity, color) {
        this.decorators.push(
            new Decorator(name, [yPos, xPos], [offsetX, offsetY], {
                size,
                opacity,
                color
            })
        );
        return this;
    }

    renderIcon() {
        return DOM.I({
            className: this.classNames.join(" "),
            style: Object.assign(this.style, {
                opacity: this.opacity
            })
        });
    }

    render() {
        // Avoids wrapper el when there's no decorations
        // for the icon.
        if (this.decorators.length < 1) {
            return this.renderIcon();
        }

        return DOM.Div(
            {
                style: {
                    position: "relative",
                    display: "inline-block ",
                    overflow: "visible"
                }
            },
            [
                this.renderIcon(),
                ...this.decorators.map(decorator =>
                    DOM.Div(
                        {
                            style: {
                                position: "absolute",
                                opacity: decorator.opacity,
                                color: decorator.color,
                                overflow: "visible",
                                [decorator.xPos]: `${decorator.offsetX * this._sizeFactor}px`,
                                [decorator.yPos]: `${decorator.offsetY * this._sizeFactor}px`
                            }
                        },
                        [
                            DOM.I({
                                className: `fa ${decorator.name}`,
                                style: {
                                    // "font-size": `${this._sizeFactor *
                                    //     this._baseSize *
                                    //     decorator.size}px`
                                    transform: `scale(${this._sizeFactor})`
                                }
                            })
                        ]
                    )
                )
            ]
        );
    }
}

export { Decorator, Icon, IconStack };
