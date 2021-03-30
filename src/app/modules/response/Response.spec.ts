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

import Response from './Response';

describe('Response Unit Tests', () => {

    const errorCode = 404;
    const successCode = 200;

    const payload = {
        key: 'value'
    };

    const json = JSON.parse(JSON.stringify(payload));

    const successResponse = {
        data: json,
        status: successCode
    };

    const errorResponse = {
        error: json,
        status: errorCode
    };

    test('test of success response object creation', () => {
        expect(Response.successObject(json, successCode)).toStrictEqual(successResponse);
    });

    test('test of error response object creation', () => {
        expect(Response.errorObject(json, errorCode)).toStrictEqual(errorResponse);
    });

    test('test of response object preparation', () => {
        expect(Response.prepareObject(json, successCode)).toStrictEqual(successResponse);
        expect(Response.prepareObject(json, errorCode)).toStrictEqual(errorResponse);
    });

});
