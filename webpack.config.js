/*
 * Copyright 2021 The PartChain Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const nodeExternals = require('webpack-node-externals');

const config = {
    mode: "production", // "production" | "development" | "none"
    // Chosen mode tells webpack to use its built-in optimizations accordingly.
    target: 'node',
    externals: [ nodeExternals() ],
    entry: "./src/index.ts", // string | object | array
    // defaults to ./src
    // Here the application starts executing
    // and webpack starts bundling
    output: {
        // options related to how webpack emits results
        path: path.resolve(__dirname, "chaincode", "production"), // string
        // the target directory for all output files
        // must be an absolute path (use the Node.js path module)
        filename: "index.js", // string
        // the url to the output directory resolved relative to the HTML page
        library: "part-chain-smart-contract", // string,
        // the name of the exported library
        libraryTarget: "umd", // universal module definition
        // the type of the exported library
        /* Advanced output configuration (click to show) */
        /* Expert output configuration (on own risk) */
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
};

module.exports = [ config ];
