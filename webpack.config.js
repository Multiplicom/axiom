const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const ProgressBar = require("progress-bar-webpack-plugin");

module.exports = {
    entry: {
        axiom: "./src/AXM.js"
    },
    target: "web",
    output: {
        filename: "[name].js",
        library: "AXM",
        libraryTarget: "amd",
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /.js?$/,
                loader: "babel-loader",
                query: {
                    presets: ["env"]
                }
            },
            {
                test: /\.css?$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            }
        ]
    },
    plugins: [
        // Progress bar when running Webpack.
        new ProgressBar(),
        // All stylesheets bundled in single css
        new ExtractTextPlugin("[name].css"),
        // These are globals that are depended on implicitly
        // by Axiom library code. Webpack has to be made aware
        // of them.
        new webpack.ProvidePlugin({
            $: "jquery",
            _: "lodash",
            // 
            // Whenever _TRL global is encountered it is replaced 
            // by a function invocation _TRL. Default here means it
            // is not a named export but the default exported function. 
            //
            _TRL: [path.resolve(__dirname, "src/AXM/_TRL.js"), "default"]
        })
    ],
    externals: {
        //
        // These dependencies are "externalized". They are listed in the
        // package.json and installed by the Client App. They are not
        // bundled together with the library to reduce bundle size.
        //
        _: "lodash",
        jquery: "jquery",
        blob: "blob.js",
        filesaver: "file-saver",
        awesomeplete: "awesomplete", // (sic. -- there was a typo in the import)
        awesomplete: "awesomplete",
        jquery_cookie: "jquery.cookie",
        jquery_mousewheel: "jquery-mousewheel",
        codemirror: "codemirror"
    },
    resolve: {
        extensions: [".js", ".css"],
        modules: [path.resolve("./src"), path.join(__dirname, "node_modules")],
        alias: {
            // Axiom globals
            ARMReq: path.resolve(__dirname, "src/AXM/AXMReq"),
            //
            // The only dependency of Axiom that isn't available as a Node
            // module. It has to be distributed together with the library
            // and has to be part of the bundle.
            //
            datetimepicker: path.resolve(__dirname, "lib/datetimepicker/datetimepicker")
        }
    },
    devtool: "source-map"
};
