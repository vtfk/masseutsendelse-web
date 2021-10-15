module.exports = {
  configureWebpack: {
    performance: {
      hints: false,
    },
    optimization: {
      splitChunks: {
        minSize: 10000,
        maxSize: 250000,
      }
    },
    module: {
      rules: [
        {
          test: /\.(react)\.?(jsx|tsx)(\?.*)?$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react'],
              plugins: ['transform-react-jsx']
            }
          }
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Compiles Sass to CSS
            "sass-loader",
          ],
        },
      ]
    }
  },
}