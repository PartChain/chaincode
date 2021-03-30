
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

const hash = require('object-hash');
/**
 * 
 * Calculate the hash of hash of input data
 * @static
 * @async
 * @param input // String to hash
 */
export const getHashOfHash = async (input: string) => {
    Logger.info(`-- getHashOfHash: begin --`);
    const hash_sha256 = require('crypto').createHash('sha256').update(input).digest('base64');
    const hash_sha512 = require('crypto').createHash('sha512').update(input).digest('base64');
    const Key = require('crypto').createHash('sha512').update(JSON.stringify(hash_sha256 + hash_sha512)).digest('base64');
    Logger.info(`-- getHashOfHash: end --`);
    return Key

}


/**
 * 
 * Calculate sha512 hash of given input data
 * @static
 * @async
 * @param input // String to hash
 */
export const getHash = async (input: string) => {
    Logger.info(`-- getHash: begin --`);
    const hash_sha512 = require('crypto').createHash('sha512').update(input).digest('base64');
    Logger.info(`-- getHash: end --`);
    return hash_sha512
}

/**
 * Generate MD5 hash
 * @async
 * @param input 
 */

export const getMD5 = async (input: any) => {
    Logger.info(`-- getMD5: begin --`);

    const { manufacturer, productionCountryCodeManufacturer, partNameManufacturer, partNumberManufacturer, partNumberCustomer, serialNumberType, serialNumberManufacturer, serialNumberCustomer, qualityStatus, status, productionDateGmt, qualityDocuments, manufacturerPlant, manufacturerLine, customFields } = input

    const payload = { manufacturer, productionCountryCodeManufacturer, partNameManufacturer, partNumberManufacturer, partNumberCustomer, serialNumberType, serialNumberManufacturer, serialNumberCustomer, qualityStatus, status, productionDateGmt, qualityDocuments, manufacturerPlant, manufacturerLine, customFields }

    Logger.info("Computing the hash");
    const payloadHash = hash.MD5(payload)
    Logger.info(`-- getMD5: end --`);
    return payloadHash

}