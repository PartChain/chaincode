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
    * Get current timestamp
    * @async
    * @public
    */
export const getCurrentTimestamp = async () => {
    const date = new Date();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const secs = date.getUTCSeconds();

    const timestampString = date.getUTCFullYear() +
        '-' + (month < 10 ? '0' : '') + month +
        '-' + (day < 10 ? '0' : '') + day +
        ' ' + (hours < 10 ? '0' : '') + hours +
        ':' + (minutes < 10 ? '0' : '') + minutes +
        ':' + (secs < 10 ? '0' : '') + secs;

    return timestampString;
}