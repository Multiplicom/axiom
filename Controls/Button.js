const Control = require("AXM/Controls/Control");
const DOM = require("AXM/DOM");
const { Icon } = require("AXM/Iconography");

class Help extends Control {
    constructor() {
        super();
    }

    createHtml() {
        return new Icon("fa-question-circle");
    }
}

class Button extends Control {
    constructor(
        { icon, text, enabled, className, style, hint, help, ...props } = {
            style: {}
        }
    ) {
        super();

        if (!icon instanceof Icon) {
            throw Error(`icon must be of type Icon`);
        }
        this.icon = icon;
        this.icon.addClass("AXMButtonIcon");
        this.icon.overrideStyle({ margin: `0.5em` });

        this.text = text;
        this.enabled = enabled;

        this.hint = hint;
        this.help = help;

        this.className = ["AXMButton", ...[className]].join(" ");
        this.extraStyles = style;

        this.props = props;
    }

    createHtml() {
        return DOM.Fragment([
            DOM.Div(
                {
                    className: this.className,
                    style: Object.assign(this.extraStyles, {
                        padding: ".5em",
                        height: "4em",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "flex-start"
                    }),
                    ...this.props
                },
                [this.icon, DOM.Text(this.text)]
            ),
            ...(this.help ? new Help(this.help) : [])
        ]);
    }
}

export { Button };
