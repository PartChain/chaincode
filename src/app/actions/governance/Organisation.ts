

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

import OrgClass from '../../models/OrganisationClass'
import Transaction from '../../modules/transaction/Transaction';
import Logger from "../../modules/logger/Logger";
import {
    returnFunction
} from "../../modules/helper/helperFunctions";
import { ResponseStatus } from "../../enums/ResponseStatus";

/**
 * Enroll new Organisation into the Ledger action
 * @async
 * @param tx
 */

export const enrollOrg = async (tx: Transaction) => {
    Logger.info(`Called enrollOrg`);
    // Use the TAASMSP if the invoke identity belongs to TAAS org
    // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
    const mspID = (tx.msp == "Taas") ? JSON.parse(tx.payload).taasmsp : tx.msp;
    const orgData = new OrgClass(mspID)
    Logger.info(`enrollOrg: orgData = ${JSON.stringify(orgData)}`);
    await tx.putPublicState(mspID, Buffer.from(JSON.stringify(orgData)));
    return await returnFunction(JSON.stringify(orgData), ResponseStatus.SUCCESS);
}

/**
 * Get organisation details
 * @async
 * @param tx 
 * @param mspID
 */

export const getOrgDetails = async (tx: Transaction, mspID: string) => {
    Logger.info(`Called getOrgDetails`);
    const result = await tx.getPublicState(mspID);
    if (result.length > 0) {
        Logger.info(`getOrgDetails: Org with key "${mspID}" found with deails: ${result.toString()}`);
        return await returnFunction(result.toString('utf8'), ResponseStatus.SUCCESS);
    } else {
        Logger.info(`getOrgDetails: Org with key "${mspID}" not found`);
        return await returnFunction(`Org with key "${mspID}" not found`, ResponseStatus.NOT_FOUND)
    }

}
