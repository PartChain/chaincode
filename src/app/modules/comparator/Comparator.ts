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

import Logger from './../logger/Logger';

/**
 * Comparator class
 * @class Comparator
 * @export Comparator
 */
export default class Comparator {

    /**
     * Compare object as strings
     * @static
     * @param string1
     * @param string2
     * @return {boolean}
     */
    static compareStringifiedObjects(string1: string, string2: string): boolean {
        Logger.info(`Comparison of stringfield objects "${string1}" and "${string2}`);

        const object1 = JSON.parse(string1);
        const object2 = JSON.parse(string2);

        return this.compareObjects(object1, object2);
    }

    /**
     * Compare objects
     * @static
     * @param object1
     * @param object2
     * @return {boolean}
     */
    static compareObjects(object1: any, object2: any): boolean {
        Logger.info(`Comparison of objects "${JSON.stringify(object1)}" and "${JSON.stringify(object2)}"`);

        object1 = this.prepareObject(object1);
        object2 = this.prepareObject(object2);

        const countOfKeys1 = Object.keys(object1).length;
        const countOfKeys2 = Object.keys(object2).length;
        Logger.info(`Count of keys - object1: "${countOfKeys1}", object2: "${countOfKeys2}"`);

        if (countOfKeys1 !== countOfKeys2) {
            return false;
        }

        for (let [key, value] of Object.entries(object1)) {
            if (
                !object2.hasOwnProperty(key)
                || JSON.stringify(value) !== JSON.stringify(object2[key])
            ) {
                Logger.info(`Property "${key}" is not set in object2 or has different value.`);

                Logger.info(`Objects are not equal.`);
                return false;
            }
        }

        Logger.info(`Objects are equal.`);
        return true;
    }

    /**
     * Prepare object
     * @protected
     * @param object
     * @return {object}
     */
    protected static prepareObject(object: any): object {
        object = JSON.parse(
            JSON.stringify(object)
        );

        for (let key of Object.keys(object)) {
            if (Array.isArray(object[key])) {
                object[key].sort();
            }
        }

        return object;
    }

}
