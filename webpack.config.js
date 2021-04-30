const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
    target: 'node',
    externals: [nodeExternals()],
    entry: path.resolve(__dirname, "index.ts"),
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname)
    },
    resolve: { extensions: ['.ts'] },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                  compress: {
                    comparisons: false,
                  },
                  mangle: {
                    safari10: true,
                  },
                  output: {
                    comments: false,
                    ascii_only: true,
                  },
                  warnings: false,
                },
            })
        ]
    }
}