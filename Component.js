class Component {
    constructor(props, children) {
        this.props = props;
        this.children = children;
    }

    render() {
        // Noop
        return null;
    }
}

export { Component };