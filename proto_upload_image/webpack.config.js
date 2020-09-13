const webpack = require('webpack');
module.exports = {
    entry: {
        app: ['./main.js']
    },
    output: {
        path: __dirname,
        publicPath: '/',
        libraryTarget: "commonjs",
        filename: './dist/image-processor.min.js',
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({ output: { comments: false } }),
        new webpack.optimize.AggressiveMergingPlugin()
    ],
    target: 'node',
    node: {
        net: 'empty',
        tls: 'empty',
        fs: 'empty',
        child_process: 'empty'
    },
    devServer: {
        disableHostCheck: true
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                loader: 'babel'
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            }
        ]
    }
};
