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

import { readFileSync, readdirSync, lstatSync } from 'fs';
import Logger from './../logger/Logger';

/**
 * Configuration of smart contract
 * @class Config
 * @export Config
 */
export default class Config {

    /**
     * Configuration data
     * @type any
     */
    config: any;

    /**
     * Public keys
     * @type any
     */
    publicKeys: any = {};

    /**
     * @constructor Config
     * @param configPath
     * @param keysDir
     */
    constructor(configPath: string, keysDir: string) {
        this.config = JSON.parse(readFileSync(`${configPath}`, 'utf-8').toString());
        this.loadKeys(keysDir);

        Logger.info(`Loaded configuration: ${JSON.stringify(this.config)}`);
    }

    /**
     * Is given path directory
     * @static
     * @param source
     */
    static isDirectory(source: any) {
        return lstatSync(source).isDirectory();
    }

    /**
     * Load keys
     * @param path
     */
    loadKeys(path: string) {
        readdirSync(path).map(
            source => {
                source = `${path}/${source}`;
                if (!Config.isDirectory(source)) {
                    const name = source.split('/');
                    const key = name[name.length - 1].replace('.txt', '');
                    if (key.substr(0, 1) !== ".") {
                        this.publicKeys[key] = readFileSync(`${source}`, 'utf-8').toString();
                    }
                }
            }
        );

        Logger.info(`Loaded keys: ${JSON.stringify(this.publicKeys)}`);
    }

    /**
     * Get config map
     * @return {*}
     */
    get configMap(): any {
        return this.config;
    }

    /**
     * Get config by given key
     * @param key
     * @return {*}
     */
    getConfig(key: string): any {
        return !!this.config[key] ? this.config[key] : undefined;
    }

    /**
     * Get public key by given name
     * @param name
     * @return {string}
     */
    getKey(name: string): string {
        return !!this.publicKeys[name] ? this.publicKeys[name] : undefined;
    }

}
