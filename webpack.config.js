const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const nodeEnv = process.env.NODE_ENV;
const isProduction = nodeEnv !== 'development';
// Common plugins
let plugins = [
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(nodeEnv),
        },
    }),
    new webpack.NamedModulesPlugin()
    ,new webpack.HotModuleReplacementPlugin()
];
if (!isProduction) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
}
const entry = isProduction ? [
    path.resolve(path.join(__dirname, './src/index.js')),
] : [
    path.resolve(path.join(__dirname, './src/index.js')),
];
const targetFileName = isProduction ? 'server.prod.js':"server.dev.js";

module.exports = {
    mode: nodeEnv,
    devtool: false,
    externals: [
        nodeExternals()
    ],
    name : 'server',
    plugins: plugins,
    target: 'node',
    entry: entry,
    output: {
        publicPath: './',
        path: path.resolve(__dirname, './target/'),
        filename: targetFileName,
        libraryTarget: "commonjs2"
    },
    resolve: {
        extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },
    module : {
        rules: [
            {
                test: /\.(js|jsx)$/,
                loader: "babel-loader",
                options : {
                    babelrc : true,

                }
            }
        ],
    },
    node: {
        console: false,
        global: false,
        process: false,
        Buffer: false,
        __filename: false,
        __dirname: false,
    }
};