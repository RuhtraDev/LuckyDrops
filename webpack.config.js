const path = require("path");

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
    // IGNORAR ERROS DOS MÓDULOS DO ALT1
    ignoreWarnings: [
        { module: /@alt1\/base/ },
        { module: /@alt1\/chatbox/ },
        { message: /TS2322/ },
        { message: /TS2554/ },
        { message: /TS2345/ },
        { message: /TS2403/ },
        { message: /TS7053/ },
        { message: /TS7006/ }
    ],
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            { test: /\.css$/, use: ["style-loader", "css-loader"] },
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