const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const ProgressBar = require('progress-bar-webpack-plugin');

module.exports = {
  entry: {
    axiom: "./src/AXM.js"
  },
  output: {
    filename: "[name].js",
    library: "AXM",
    libraryTarget: "amd",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.css?$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /.js?$/,
        loader: "babel-loader",
        query: {
          presets: ["env"]
        }
      }
    ]
  },
  plugins: [
    new ProgressBar(),
    new ExtractTextPlugin("[name].css"),
    // 
    // These are globals that are (implicitly) depended on 
    // by Axiom and client apps written using it. They 
    // are not injected using the module system, so Webpack
    // has to be made aware of their existence, so they can
    // be adequately injected.
    //
    new webpack.ProvidePlugin({
      _TRL: "_TRL",
      $: "jquery"
    })
  ],
  resolve: {
    extensions: [".js", ".css"],
    modules: ["src"],
    alias: {
      //
      // Axiom Globals
      //
      _TRL: path.resolve(__dirname, 'src/AXM/_TRL'),
      ARMReq: path.resolve(__dirname, 'src/AXM/AXMReq'),
      //
      // Externals
      //
      _: path.resolve(__dirname, "lib/lodash"),
      blob: path.resolve(__dirname, "lib/Blob"),
      jquery: path.resolve(__dirname, "lib/jquery"),
      filesaver: path.resolve(__dirname, "lib/FileSaver"),
      codemirror: path.resolve(__dirname, "lib/CodeMirror/lib/codemirror"),
      awesomeplete: path.resolve(__dirname, "lib/awesomplete/awesomplete.js"),
      jquery_cookie: path.resolve(__dirname, "lib/jquery_cookie"),
      datetimepicker: path.resolve(
        __dirname,
        "lib/datetimepicker/datetimepicker"
      ),
      codemirror_yaml: path.resolve(
        __dirname,
        "lib/CodeMirror/modes/yaml/yaml"
      ),
      jquery_mousewheel: path.resolve(__dirname, "lib/jquery_mousewheel")
    }
  },
  devtool: "source-map"
};
