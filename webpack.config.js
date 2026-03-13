const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    context: path.resolve(__dirname, "src"),
    entry: {
        "main": "./index.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        library: { type: "umd", name: "LuckyDrops" }
    },
    devtool: false,
    mode: "development",
    externals: ["sharp", "canvas", "electron/common"],
    resolve: {
        extensions: [".wasm", ".tsx", ".ts", ".mjs", ".jsx", ".js"]
    },
    ignoreWarnings: [
        { message: /TS2307/ },
        { message: /ts-loader/ },
        { message: /css/ }  // Ignorar warnings relacionados a CSS
    ],
    plugins: [
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
                    transpileOnly: true,
                    happyPackMode: true,
                    compilerOptions: {
                        types: []  // Não carregar tipos
                    }
                }
            },
            { 
                test: /\.(png|jpg|jpeg|gif|webp)$/, 
                type: "asset/resource", 
                generator: { filename: "assets/[name][ext]" } 
            },
            { 
                test: /\.(html|json)$/, 
                type: "asset/resource", 
                generator: { filename: "[base]" } 
            },
            { test: /\.data\.png$/, loader: "alt1/imagedata-loader", type: "javascript/auto" },
            { test: /\.fontmeta.json/, loader: "alt1/font-loader" }
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