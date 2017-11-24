const path = require('path');
module.exports = {
  entry: path.join(__dirname, 'src', 'AXM'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /.js?$/,
      include: [
        path.resolve(__dirname, 'src')
      ],
      exclude: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'bower_components')
      ],
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  },
  resolve: {
    extensions: ['.json', '.js', '.css'],
    alias: {
      
    }
  },
  devtool: 'source-map',
  devServer: {
    publicPath: path.join('/dist/')
  }
};