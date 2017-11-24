const path = require("path");
module.exports = {
  entry: path.join(__dirname, "src", "AXM"),
  output: {
    filename: "axiom.js",
    library: "axiom",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /.js?$/,
        include: [path.resolve(__dirname, "src")],
        exclude: [
          path.resolve(__dirname, "node_modules"),
          path.resolve(__dirname, "bower_components")
        ],
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
      "jquery": "lib/jquery",
      "jquery_cookie": "lib/jquery_cookie",
      "_": "lib/lodash",
      "blob": "lib/Blob",
      "filesaver": "lib/FileSaver",
      "resumable": "externals/resumable",
      "datetimepicker": "lib/datetimepicker/datetimepicker",
      "codemirror": "lib/CodeMirror/lib/codemirror",
      "codemirror_yaml": "lib/CodeMirror/modes/yaml/yaml"
    }
  },
  devtool: "source-map"
};
