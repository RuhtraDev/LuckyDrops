const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin"); // NOVO

module.exports = {
    context: path.resolve(__dirname, "src"),
    entry: {
        "main": "./index.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",  // Garante que o nome seja main.js
        library: { type: "umd", name: "LuckyDrops" }
    },
    devtool: false,
    mode: "development",
    externals: ["sharp", "canvas", "electron/common"],
    resolve: {
        extensions: [".wasm", ".tsx", ".ts", ".mjs", ".jsx", ".js"]
    },
    plugins: [
        // NOVO: Processa o HTML e injeta o script automaticamente
        new HtmlWebpackPlugin({
            template: "./index.html",  // Arquivo fonte em src/
            filename: "index.html",     // Será gerado em dist/
            inject: "body",             // Coloca o script no body
            scriptLoading: "blocking"   // Carregamento tradicional
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
            },
           
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