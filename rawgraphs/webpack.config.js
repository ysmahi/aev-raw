var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  devtool: debug ? "inline-sourcemap" : false, // true o false value required
  entry: "./js/app.js",
  output: {
    path: __dirname + "/static",
    filename: "app.bundle.js"
  },
  plugins: debug ? [] : [
+   new webpack.optimize.OccurrenceOrderPlugin(), // name was changed from OccurenceOrderPlugin to OccurrenceOrderPlugin
    new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
  ],
};