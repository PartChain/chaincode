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

import Query from './Query';
describe('Query Unit Tests', () => {

    const json = JSON.parse(
        JSON.stringify({
            "key": "value"
        })
    );

    const query = new Query(json);

    test('test Query initialization', () => {
        expect(query.params).toStrictEqual(json);
    });

    test('test to string method', () => {
        expect(query.toString()).toStrictEqual(JSON.stringify(json));
    });

    test('test payload as bytes method', () => {
        expect(Buffer.isBuffer(Query.payloadAsBytes(json))).toBe(true);
    });
});
