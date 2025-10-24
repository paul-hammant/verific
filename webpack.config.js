// Optional webpack config for future bundling/minification
// Currently not used - app works with static files from CDN

const path = require('path');

module.exports = {
  mode: 'production',
  entry: './public/app-url-based.js',
  output: {
    filename: 'app.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true
  }
};
