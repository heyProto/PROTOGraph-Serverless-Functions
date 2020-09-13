const webpack = require('webpack');
module.exports = {
    entry: './main.js',
    output: {
        path: __dirname,
        publicPath: '/',
        libraryTarget: "commonjs",
        filename: './dist/ssr-cards.min.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    ],
    node: {
        net: 'empty',
        tls: 'empty',
        fs: 'empty'
    },
    devServer: {
        disableHostCheck: true
    }
    // ,
    // module: {
    //     loaders: [
    //         {
    //             test: /\.jsx?$/,
    //             exclude: /node_modules/,
    //             loader: 'babel',
    //             query:
    //             {
    //                 presets: ['react']
    //             }
    //         },
    //         {
    //             test: /\.css$/,
    //             loaders: ["style-loader", "css-loader", "sass-loader"]
    //         },
    //         {
    //             test: /\.json$/,
    //             loader: 'json-loader'
    //         }
    //     ]
    // }
};
// { output: { comments: false } }