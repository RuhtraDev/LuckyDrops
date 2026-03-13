const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    context: path.resolve(__dirname, "src"),
    entry: {
        "main": "./index.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        library: { type: "umd", name: "LuckyDrops" }
    },
    devtool: false,
    mode: "development",
    externals: ["sharp", "canvas", "electron/common"],
    resolve: {
        extensions: [".wasm", ".tsx", ".ts", ".mjs", ".jsx", ".js"]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html",
            filename: "index.html",
            inject: "body",
            scriptLoading: "blocking"
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "css/style.css", to: "css/style.css" }
            ]
        })
    ],
    module: {
        rules: [
            { 
                test: /\.tsx?$/, 
                loader: "ts-loader",
                options: {
                    transpileOnly: true
                }
            },
            { 
                test: /\.(png|jpg|jpeg|gif|webp)$/, 
                type: "asset/resource", 
                generator: { filename: "assets/[name][ext]" } 
            }
        ]
    },
    devServer: {
        static: { directory: path.join(__dirname, "dist") },
        compress: true,
        port: 9000,
        hot: true,
        open: true
    }
};