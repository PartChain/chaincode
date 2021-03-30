
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

import Logger from "../logger/Logger";

/**
 * @class Response
 * @module Response
 */
export default class Response {

    /**
     * Create JSON response object
     * @static
     * @param res
     * @param payload
     * @param status
     */
    static json(res: any, payload: JSON,  status: number = 200) {
        return res
            .status(status)
            .json(
                Response.prepareObject(payload, status)
            );
    }

    /**
     * Prepare object for response
     * @static
     * @param payload
     * @param status
     */
    static prepareObject(payload: JSON, status: number) {
        if (status >= 200 && status < 400) {
            return Response.successObject(payload, status);
        }

        return Response.errorObject(payload, status);
    }

    /**
     * Create an error object
     * @static
     * @param payload
     * @param status
     */
    static errorObject(payload: JSON, status: number) {
            return {
                error: payload,
                status: status
            }
    }

    /**
     * Create and success object
     * @static
     * @param payload
     * @param status
     */
    static successObject(payload: Object, status: number) {
        Logger.info(`Payload in the success object response =${JSON.stringify(payload)}`)

        
            return {
                data: payload,
                status: status
            }
    }

    
    /**
     * Create a common object
     * @static
     * @param error
     * @param data
     * @param status
     */
    static commonObject(error: any, data: any, status: number) {
        const object = Object.create({});
        object.status = status;

        if (error) {
            object.error = error;
        }
        if (data) {
            object.data = data;
        }

        return object;
    }
}
