const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: path.join(__dirname, "src", "AXM"),
  output: {
    filename: "axiom.js",
    library: "AXM",
    libraryTarget: "amd",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /.js?$/,
        include: [path.resolve(__dirname, "src")],
        exclude: [],
        loader: "babel-loader",
        query: {
          presets: ["env"]
        }
      }
    ]
  },
  resolve: {
    extensions: [".json", ".js", ".css"],
    modules: ["src"],
    alias: {
      _: path.resolve(__dirname, "lib/lodash"),
      blob: path.resolve(__dirname, "lib/Blob"),
      jquery: path.resolve(__dirname, "lib/jquery"),
      filesaver: path.resolve(__dirname, "lib/FileSaver"),
      codemirror: path.resolve(__dirname, "lib/CodeMirror/lib/codemirror"),
      awesomeplete: path.resolve(__dirname, "lib/awesomplete/awesomplete.js"),
      jquery_cookie: path.resolve(__dirname, "lib/jquery_cookie"),
      jquery_mousewheel: path.resolve(__dirname, "lib/jquery_mousewheel"),
      datetimepicker: path.resolve(__dirname, "lib/datetimepicker/datetimepicker"),
      codemirror_yaml: path.resolve(__dirname, "lib/CodeMirror/modes/yaml/yaml")
    }
  },
  devtool: "source-map"
};
