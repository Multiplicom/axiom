const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
    entry: {
        axiom: "./src/AXM.js"
    },
    target: "web",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        library: "AXM",
        libraryTarget: "umd",
        umdNamedDefine: true
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
    plugins: [new ExtractTextPlugin("[name].css"), new CleanWebpackPlugin(["dist"])],
    externals: {
        _: "lodash",
        jquery: "jquery",
        jquery_cookie: "jquery.cookie",
        filesaver: "file-saver",
        awesomeplete: "awesomplete", // typo in an import somewhere
        awesomplete: "awesomplete",
        jquery_mousewheel: "jquery-mousewheel",
        codemirror: "codemirror"
    },
    resolve: {
        extensions: [".js", ".css"],
        modules: [path.resolve("./src"), path.join(__dirname, "node_modules")],
        alias: {
            // The only dependency that isn't available as an npm package. It has to be
            // packaged into the bundle and distributed with the library
            datetimepicker: path.resolve(__dirname, "lib/datetimepicker/datetimepicker")
        }
    },
    devtool: "source-map"
};
