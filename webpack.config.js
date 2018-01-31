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
        new ProgressBar(),
        // All stylesheets bundled in single css
        new ExtractTextPlugin("[name].css"),
        /**
         * These globals are implicitly depended on by the library. When webpack
         * ecounters one of these symbols (keys) it implicitly imports the 
         * modules (values) so they are available in scope. 
         * 
         * jQuery and lodash are node modules, but _TRL is a first-party global
         * function that is expected to be globally available within the module
         */
        new webpack.ProvidePlugin({
            $: "jquery",
            _: "lodash",
            // Replace _TRL with the default exported function from _TRL.js 
            _TRL: [path.resolve(__dirname, "src/AXM/AXMUtils"), "_TRL"],
            AXMReq: [path.resolve(__dirname, "src/AXM/AXMUtils"), "AXMReq"],
        })
    ],
    resolve: {
        extensions: [".js", ".css"],
        modules: [path.resolve("./src"), path.join(__dirname, "node_modules")],
        alias: {
            _: "lodash",
            jquery_cookie: "jquery.cookie",
            blob: "blob.js",
            filesaver: "file-saver",
            awesomeplete: "awesomplete", // typo in an import somewhere
            awesomplete: "awesomplete",
            jquery_mousewheel: "jquery-mousewheel",
            codemirror: "codemirror",            
            // The only dependency that isn't available as an npm package. It has to be 
            // packaged into the bundle and distributed with the library
            datetimepicker: path.resolve(__dirname, "lib/datetimepicker/datetimepicker")
        }
    },
    devtool: "source-map"
};
