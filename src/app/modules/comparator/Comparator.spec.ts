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

import Comparator from "./Comparator";
import Logger from './../logger/Logger';
Logger.level = 'fatal';
// @ts-ignore

describe('Comparator Unit Tests', () => {

    /**
     *
     */
    test('test of positive comparation of parsed objects: same attributes with same values in same order', () => {
        const object1 = {
            x: "hello",
            y: "world",
            z: [
                2,
                3
            ]
        };
        const object2 = {
            x: "hello",
            y: "world",
            z: [
                2,
                3
            ]
        };

        const result = Comparator.compareObjects(object1, object2);
        expect(result).toBe(true);
    });

    /**
     *
     */
    test('test of positive comparation of parsed objects: same attributes with same values in different order', () => {
        const object1 = {
            x: "hello",
            y: "world",
            z: [
                2,
                3
            ]
        };
        const object2 = {
            y: "world",
            x: "hello",
            z: [
                3,
                2
            ]
        };

        const result = Comparator.compareObjects(object1, object2);
        expect(result).toBe(true);
    });

    /**
     *
     */
    test('test of positive comparation of stringified objects: same attributes with same values in same order', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            x: "hello",
            y: "world"
        };

        const result = Comparator.compareStringifiedObjects(JSON.stringify(object1), JSON.stringify(object2));
        expect(result).toBe(true);
    });

    /**
     *
     */
    test('test of positive comparation of stringified objects: same attributes with same values in different order', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            y: "world",
            x: "hello"
        };

        const result = Comparator.compareStringifiedObjects(JSON.stringify(object1), JSON.stringify(object2));
        expect(result).toBe(true);
    });

    /**
     *
     */
    test('test of negative comparation of parsed objects: same attributes with different values in same order', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            x: "hello",
            y: "world2"
        };

        const result = Comparator.compareObjects(object1, object2);
        expect(result).toBe(false);
    });

    /**
     *
     */
    test('test of negative comparation of parsed objects: same attributes with different values in different order', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            y: "world2",
            x: "hello"
        };

        const result = Comparator.compareObjects(object1, object2);
        expect(result).toBe(false);
    });

    /**
     *
     */
    test('test of negative comparation of parsed objects: different attributes with same values', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            x: "hello",
            z: "world"
        };

        const result = Comparator.compareObjects(object1, object2);
        expect(result).toBe(false);
    });

    /**
     *
     */
    test('test of negative comparation of stringified objects: same attributes with different values in same order', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            x: "hello",
            y: "world2"
        };

        const result = Comparator.compareStringifiedObjects(JSON.stringify(object1), JSON.stringify(object2));
        expect(result).toBe(false);
    });

    /**
     *
     */
    test('test of negative comparation of stringified objects: same attributes with different values in different order', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            y: "world2",
            x: "hello"
        };

        const result = Comparator.compareStringifiedObjects(JSON.stringify(object1), JSON.stringify(object2));
        expect(result).toBe(false);
    });

    /**
     *
     */
    test('test of negative comparation of stringified objects: different attributes with same values', () => {
        const object1 = {
            x: "hello",
            y: "world"
        };
        const object2 = {
            x: "hello",
            z: "world"
        };

        const result = Comparator.compareStringifiedObjects(JSON.stringify(object1), JSON.stringify(object2));
        expect(result).toBe(false);
    });

});


