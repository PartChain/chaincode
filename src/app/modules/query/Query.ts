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

/**
 * Query operations class
 * @class Query
 * @export Query
 */
export default class Query {

    /**
     * Query parameters
     * @type {JSON}
     */
    params: JSON;

    /**
     * @constructor Query
     * @param params
     */
    constructor(params: JSON) {
        this.params = params;
    }

    /**
     * Query params to string
     */
    toString() {
        return JSON.stringify(this.params);
    }

    /**
     * Convert JSON payload to Bytes
     * @static
     * @param payload
     */
    static payloadAsBytes(payload: JSON) {
        return Buffer.from(
            JSON.stringify(payload)
        );
    }
}
