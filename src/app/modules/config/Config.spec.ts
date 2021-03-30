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

import Config from './Config';
import Logger from './../logger/Logger';
Logger.level = 'fatal';

describe('Config Unit Tests', () => {
    const configPath = './chaincode/development/resources/config.json';
    const keysPath = './chaincode/development/resources/keyfiles';

    const config = new Config(configPath, keysPath);

    test('is directory method with valid path', () => {
        expect(Config.isDirectory(keysPath)).toBe(true);
    });

    test('is directory method with invalid path', () => {
        expect(Config.isDirectory(configPath)).toBe(false);
    });

    test('invalid invoke of Config constructor', () => {
        expect(() => new Config(keysPath, configPath)).toThrow();
    });

    test('if public keys were loaded', () => {
        expect(Object.keys(config.publicKeys).length).toBeGreaterThan(0);
    });

    test('if config object was loaded', () => {
        expect(Object.keys(config.config).length).toBeGreaterThan(0);
    });

    test('get config map', () => {
        expect(Object.keys(config.configMap).length).toBeGreaterThan(0);
    });

    test('get organization config method', () => {
        expect(Object.keys(config.getConfig('Lion')).length).toBeGreaterThan(0);
    });

    test('get organization public key method', () => {
        expect(config.getKey('antelope').length).toBeGreaterThan(0);
    });
});
