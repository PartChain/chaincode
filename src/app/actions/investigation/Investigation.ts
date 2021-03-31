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

import Transaction from "../../modules/transaction/Transaction";
import Logger from "../../modules/logger/Logger";
import { getCurrentTimestamp } from "../../modules/time/time";
import {
    InvestigationPublicClass,
    InvestigationPrivateClass,
    ParticipatingOrgsClass
} from "../../models/InvestigationClass";
import {
    decryptData,
    encryptData,
    decryptArray,
    encryptArray,
    decryptParticipatingOrgs,
    returnFunction,
    validateAssetParameters
} from "../../modules/helper/helperFunctions";
import { InvestigationStatus } from "../../enums/Investigation";
import { ResponseStatus } from "../../enums/ResponseStatus";
import { validateCreateInvestigation, validateAddOrgToInvestigation } from '../../modules/helper/helperFunctions'
import { getHashOfHash } from "../../modules/hash/hash";

import { AssetClassModel } from "../../models/AssetClass";

/**
 * create Investigation
 * This function is used to create a new investigation
 * @async
 * @param tx
 * 
 */

export const createInvestigation = async (tx: Transaction) => {
    Logger.info(`Called createInvestigation`);
    const privateData = await tx.getTransientData();
    Logger.info(`createInvestigation: Transient data recieved = ${JSON.stringify(privateData)}`);
    try {
        let validationResponse = await validateCreateInvestigation(privateData);
        if (validationResponse === true) {
            // required parameters are investigationID, message, secret1, secret2, iv and type
            const { investigationID, message, secret1, secret2, iv, type } = privateData;
            const creator = tx.msp;
            const timestamp = await getCurrentTimestamp();
            Logger.info(`createInvestigation: creator = ${creator}`);
            let creatorCollectionName = await tx.getOrgPrivateCollection(creator);
            let investigationPrivate = new InvestigationPrivateClass();
            investigationPrivate.investigationID = investigationID;
            investigationPrivate.secret1 = secret1;
            investigationPrivate.secret2 = secret2;
            investigationPrivate.iv = iv;
            investigationPrivate.type = type;
            investigationPrivate.docType = "investigation";
            // write the data to private data to creator´s private data collection
            await tx.putPrivateState(
                creatorCollectionName,
                investigationID,
                Buffer.from(JSON.stringify(investigationPrivate))
            );
            // encrypt the data of investigation
            let investigationPublic = new InvestigationPublicClass();
            investigationPublic.investigationID = investigationID;
            investigationPublic.creator = (await encryptData(
                secret1,
                iv,
                creator
            )) as string;
            investigationPublic.entities.push(investigationPublic.creator);
            investigationPublic.participatingOrgs = {};

            const participatingOrg = new ParticipatingOrgsClass();
            participatingOrg.status = InvestigationStatus.ACTIVE;
            participatingOrg.timestamp = timestamp;
            participatingOrg.mspID = investigationPublic.creator;

            Logger.info(`createInvestigation:  participatingOrg = ${JSON.stringify(participatingOrg)}`);
            investigationPublic.participatingOrgs[`${participatingOrg.mspID}`] = participatingOrg;
            investigationPublic.status = InvestigationStatus.ACTIVE;
            investigationPublic.message = message;
            investigationPublic.type = type;
            Logger.info(`createInvestigationPublic: private data ${JSON.stringify(investigationPublic)}`);
            // write the data to public ledger
            await tx.putPublicState(
                investigationID,
                Buffer.from(JSON.stringify(investigationPublic))
            );
            const result = JSON.stringify(investigationPublic);
            // return response back
            return result;

        } else {
            Logger.error(`createInvestigationPublic:  Error in validation of createInvestigation = ${validationResponse} `);
            throw new Error(` Error occured in createInvestigation because of ${validationResponse} `);
        }
    } catch (error) {
        Logger.error(`createInvestigation: Error in createInvestigation = ${error}`);
        throw new Error(error);
    }
};

/**
 * getPublicInvestigation
 * Get Public Investigation Details
 * @async
 * @param tx
 */

export const getPublicInvestigation = async (tx: Transaction, investigationID: string, mspID: string) => {
    Logger.info(`Called getPublicInvestigation`);
    let result = await tx.getPublicState(investigationID);
    Logger.info(`getPublicInvestigation: result = ${result} , result length = ${result.length}`);
    if (result.length == 0) {
        Logger.info(`getPublicInvestigation: Investigation with key "${investigationID}" not found.`);
        // Return response
        const response = await returnFunction(`Investigation with key ${investigationID} not found.`, ResponseStatus.NOT_FOUND);
        Logger.info(`getPublicInvestigation: response =  ${JSON.stringify(response)}`);
        return response;
    }
    // Check if the requesting org has secret1 in the private data collection
    let collectionName = await tx.getOrgPrivateCollection(mspID);
    let storedInvestigation = await tx.getPrivateState(
        collectionName,
        investigationID
    );
    Logger.info(`getPublicInvestigation:  storedInvestigation = ${storedInvestigation} , storedInvestigation length = ${storedInvestigation.length}`);
    if (storedInvestigation.length == 0) {
        Logger.info(`getPublicInvestigation: Investigation with key ${investigationID}" not found in collection: ${collectionName}.`);
        // return the encrypted data if the secret1 is not found
        return await returnFunction(result.toString("utf8"), ResponseStatus.SUCCESS);
    }
    Logger.info(`getPublicInvestigation: storedInvestigation = ${storedInvestigation.toString("utf8")} `);
    storedInvestigation = JSON.parse(storedInvestigation.toString("utf8"));
    Logger.info(`getPublicInvestigation: Investigation with key "${investigationID}" found in collection: ${collectionName}`);
    const secret1 = storedInvestigation.secret1;
    const secret2 = storedInvestigation.secret2;
    const iv = storedInvestigation.iv;
    // decrypt the public data with secret1
    result = JSON.parse(result.toString("utf8"));
    Logger.info("getPublicInvestigation: Decrypting the entities");
    if (result.entities.length > 0) {
        result.entities = await decryptArray(secret1, iv, result.entities);
    }
    Logger.info("getPublicInvestigation: Decrypting the participatingOrgs");
    result.participatingOrgs = await decryptParticipatingOrgs(
        secret1,
        secret2,
        iv,
        result.participatingOrgs
    );
    result.creator = await decryptData(secret1, iv, result.creator);
    // return the decrypted data
    return await returnFunction(JSON.stringify(result), ResponseStatus.SUCCESS)
};



/**
 * 
 * Close Investigation 
 * @async
 * @param tx
 */

export const closeInvestigation = async (tx: Transaction, investigationID: string) => {
    Logger.info(`Called closeInvestigation`);
    // get investigation details
    const mspID = tx.msp;
    // get the investigation public details
    const assetPublicDetails = await getPublicInvestigation(tx, investigationID, mspID);
    // check if the investigation is present 
    if (assetPublicDetails.status === ResponseStatus.NOT_FOUND) {
        return assetPublicDetails;
    }
    const assetDetails = JSON.parse(assetPublicDetails.data);
    Logger.info(`closeInvestigation: public asset details = ${JSON.stringify(assetDetails)}`);
    if (mspID != assetDetails.creator && assetDetails.status != InvestigationStatus.ACTIVE) {
        return await returnFunction(`Investigation with key ${investigationID} is not ACTIVE or Org ${mspID} is not the creator.`, ResponseStatus.PERMISSION_DENIED);
    }
    // complete investigation
    assetDetails.status = InvestigationStatus.COMPLETE;
    // write the data to public ledger
    await tx.putPublicState(
        investigationID,
        Buffer.from(JSON.stringify(assetDetails))
    );
    return await returnFunction(JSON.stringify(assetDetails), ResponseStatus.SUCCESS);

}


/**
 * Get Private Investigation Details
 * @async
 * @param tx
 */

export const getPrivateInvestigation = async (tx: Transaction) => {
    Logger.info(`Called: getPrivateInvestigation`);
    const payload = JSON.parse(tx.payload);
    const { investigationID } = payload;
    const mspID = tx.msp;
    let collectionName = await tx.getOrgPrivateCollection(mspID);
    Logger.info(`getPrivateInvestigation: Organisation collection name =  ${collectionName}`);
    let storedInvestigation = await tx.getPrivateState(
        collectionName,
        investigationID
    );
    if (storedInvestigation.length > 0) {
        Logger.info(`getPrivateInvestigation: Investigation with key "${investigationID}" found in collection: ${collectionName}`);
        return await returnFunction(storedInvestigation.toString("utf8"), ResponseStatus.SUCCESS);
    }
    Logger.info(`getPrivateInvestigation: Investigation with key "${investigationID}" not found in collection: ${collectionName}.`);
    return await returnFunction(`Investigation with key "${investigationID}" not found in collection: ${collectionName}.`, ResponseStatus.NOT_FOUND);
};

/**
 * Add organisation to investigation
 * @async
 * @param tx
 */

export const addOrganisationToInvestigation = async (tx: Transaction) => {
    Logger.info(`Called addOrganisationToInvestigation`);
    // write key1 to the targetOrg PDC
    const privateData = await tx.getTransientData();
    Logger.info(`addOrganisationToInvestigation: Transient data recieved = ${JSON.stringify(privateData)}`);

    try {
        let validationResponse = await validateAddOrgToInvestigation(privateData);
        if (validationResponse === true) {
            const { investigationID, secret1, iv, targetOrg } = privateData;
            const timestamp = await getCurrentTimestamp();
            let result = await tx.getPublicState(investigationID);
            if (result.length < 0) {
                Logger.info(`addOrganisationToInvestigation: Investigation with key "${investigationID}" not found `);
                return { data: `Investigation with key "${investigationID}" not found `, status: 404 };
            }
            // check if the org already exist in the investigation
            const encryptedTargetOrg = await encryptData(secret1, iv, targetOrg);
            result = JSON.parse(result.toString("utf8"));
            Logger.info(`addOrganisationToInvestigation:  result = ${result} , result length = ${result.length}`);
            if (result.entities.includes(encryptedTargetOrg)) {
                Logger.info(`addOrganisationToInvestigation: The ${targetOrg} is already present in the investigation`);
                return { data: `The ${targetOrg} is already present in the investigation`, status: ResponseStatus.PERMISSION_DENIED };
            }

            let targetOrgCollectionName = await tx.getOrgPrivateCollection(targetOrg);
            let investigationPrivate = new InvestigationPrivateClass();
            investigationPrivate.investigationID = investigationID;
            investigationPrivate.secret1 = secret1;
            investigationPrivate.secret2 = "";
            investigationPrivate.iv = iv;
            investigationPrivate.docType = "investigation";
            // get secret from transient store
            await tx.putPrivateState(
                targetOrgCollectionName,
                investigationID,
                Buffer.from(JSON.stringify(investigationPrivate))
            );
            // get the public details of the investigation
            const participatingOrg = new ParticipatingOrgsClass();
            participatingOrg.status = InvestigationStatus.PENDING;
            participatingOrg.timestamp = timestamp;
            participatingOrg.mspID = encryptedTargetOrg;
            //  request.history.push(history)
            Logger.info(`addOrganisationToInvestigation:participatingOrg = ${JSON.stringify(participatingOrg)}`);
            // Update the target Org Info
            result.participatingOrgs[`${participatingOrg.mspID}`] = participatingOrg;
            result.entities.push(participatingOrg.mspID);
            // update the investigation with encrypted the orgMSPID
            Logger.info(`addOrganisationToInvestigation: public data ${JSON.stringify(result)}`);
            // write the data to public ledger
            await tx.putPublicState(investigationID, Buffer.from(JSON.stringify(result)));
            // return response back
            return { data: JSON.stringify(result), status: 200 }
        } else {
            Logger.error(`addOrganisationToInvestigation:  Error in validation of createInvestigation = ${validationResponse} `)
            throw new Error(` Error occured in addOrganisationToInvestigation because of ${validationResponse} `);
        }
    } catch (error) {
        Logger.error(` Error in addOrganisationToInvestigation = ${error}`)
        throw new Error(error);
    }
};

/**
 * updateOrgInvestigationStatus
 * accept for
 * @async
 * @param tx
 */

export const updateOrgInvestigationStatus = async (tx: Transaction) => {
    Logger.info(`Called updateOrgInvestigationStatus`);
    // Get the public details of the investigation  
    const privateData = await tx.getTransientData();
    const { investigationID, status } = privateData;
    const mspID = tx.msp;
    const timestamp = await getCurrentTimestamp();
    let result = await tx.getPublicState(investigationID);
    Logger.info(`updateOrgInvestigationStatus: result = ${result} , result length = ${result.length}`);
    if (result.length < 0) {
        Logger.info(`updateOrgInvestigationStatus: Investigation with key "${investigationID}" not found.`);
        return await returnFunction(`Investigation with key "${investigationID}" not found.`, ResponseStatus.NOT_FOUND);
    }
    // Getting the keys from PDC
    result = JSON.parse(result.toString("utf8"));
    let collectionName = await tx.getOrgPrivateCollection(mspID);
    let storedInvestigation = await tx.getPrivateState(
        collectionName,
        investigationID
    );
    Logger.info(`updateOrgInvestigationStatus:  storedInvestigation = ${storedInvestigation} , storedInvestigation length = ${storedInvestigation.length}`);
    if (storedInvestigation.length == 0) {
        Logger.info(`Investigation with key ${investigationID}" not found in collection: ${collectionName}.`);
        // return the encrypted data if the secret1 is not found
        return await returnFunction(` Key1 not found in the private data collection of ${mspID}`, ResponseStatus.NOT_FOUND);
    }
    Logger.info(`updateOrgInvestigationStatus: storedInvestigation = ${storedInvestigation.toString("utf8")} `);
    storedInvestigation = JSON.parse(storedInvestigation.toString("utf8"));
    Logger.info(`updateOrgInvestigationStatus: Investigation with key "${investigationID}" found in collection: ${collectionName}`);
    const secret1 = storedInvestigation.secret1;
    const iv = storedInvestigation.iv;
    //Update the status
    const encryptedMspID = (await encryptData(secret1, iv, mspID)) as string;
    const decryptedCreator = (await decryptData(
        secret1,
        iv,
        result.creator
    )) as string;
    switch (status) {
        case InvestigationStatus.APPROVED: {
            result.participatingOrgs[`${encryptedMspID}`]["status"] = InvestigationStatus.APPROVED;
            result.participatingOrgs[`${encryptedMspID}`]["timestamp"] = timestamp;
            Logger.info(`updateOrgInvestigationStatus: Emitting event requesting for key`);
            let requestEvent = {
                key: investigationID,
                mspID: decryptedCreator
            };
            Logger.info(`updateOrgInvestigationStatus:Emitting RequestEvent event with data ${JSON.stringify(
                requestEvent
            )}`
            );
            await tx.putPublicState(
                investigationID,
                Buffer.from(JSON.stringify(result))
            );
            // Emitting event
            await tx.emitEvent(
                "RequestEvent",
                Buffer.from(JSON.stringify(requestEvent))
            );
            break;
        }
        case InvestigationStatus.REJECTED: {
            result.participatingOrgs[`${encryptedMspID}`]["status"] = InvestigationStatus.REJECTED;
            result.participatingOrgs[`${encryptedMspID}`]["timestamp"] = timestamp;
            await tx.putPublicState(
                investigationID,
                Buffer.from(JSON.stringify(result))
            );
            break;
        }
        default: {
            return await returnFunction("Invalid status", ResponseStatus.PERMISSION_DENIED);
        }
    }
    return await returnFunction(JSON.stringify(result), ResponseStatus.SUCCESS);
};

/**
 * addSerialNumberCustomer
 * Add serial Number customer to investigation
 * @async
 * @param tx
 */

export const addSerialNumberCustomer = async (tx: Transaction) => {
    Logger.info(`Called addSerialNumberCustomer`);
    const privateData = await tx.getTransientData();
    const { investigationID, componentsSerialNumbers } = privateData;
    const mspID = tx.msp;
    const timestamp = await getCurrentTimestamp();
    let result = await tx.getPublicState(investigationID);
    Logger.info(`addSerialNumberCustomer: result = ${result} , result length = ${result.length}`);
    if (result.length < 0) {
        Logger.info(`addSerialNumberCustomer: Investigation with key "${investigationID}" not found.`);
        return await returnFunction(`Investigation with key "${investigationID}" not found.`, ResponseStatus.NOT_FOUND);
    }
    result = JSON.parse(result.toString("utf8"));
    // Getting the keys from PDC
    let collectionName = await tx.getOrgPrivateCollection(mspID);
    let storedInvestigation = await tx.getPrivateState(
        collectionName,
        investigationID
    );
    Logger.info(`addSerialNumberCustomer:  storedInvestigation = ${storedInvestigation} , storedInvestigation length = ${storedInvestigation.length}`);
    storedInvestigation = JSON.parse(storedInvestigation.toString("utf8"));
    if (storedInvestigation.secret2.length == 0) {
        Logger.info(`addSerialNumberCustomer: Investigation ${investigationID}  key2 not found in collection: ${collectionName}.`);
        // return the encrypted data if the secret1 is not found
        return await returnFunction(` Investigation details not found in the private data collection of ${mspID}`, ResponseStatus.NOT_FOUND)
    }
    Logger.info(`addSerialNumberCustomer: storedInvestigation = ${storedInvestigation.toString("utf8")} `);
    Logger.info(`addSerialNumberCustomer: Investigation with key "${investigationID}" found in collection: ${collectionName}`);
    const secret1 = storedInvestigation.secret1;
    const secret2 = storedInvestigation.secret2;
    const iv = storedInvestigation.iv;
    // encrypt the mspid
    const encryptedMspID = (await encryptData(secret1, iv, mspID)) as string;
    // Find the status of the org in the participatingOrg details
    const currentOrgStatus = result.participatingOrgs[`${encryptedMspID}`]["status"];
    //  If status is active allow adding the serialNumbercustomers
    if (
        currentOrgStatus == InvestigationStatus.ACTIVE &&
        componentsSerialNumbers.length > 0 &&
        result.status == InvestigationStatus.ACTIVE
    ) {
        // encrypt the serialNumberCustomer with Key2
        const encryptedcomponentsSerialNumbers = await encryptArray(
            secret2,
            iv,
            componentsSerialNumbers
        );
        // update the serialnumberCustomer List encrypted details
        result.participatingOrgs[`${encryptedMspID}`]["componentsSerialNumbers"] = [
            ...result.participatingOrgs[`${encryptedMspID}`][
            "componentsSerialNumbers"
            ],
            ...encryptedcomponentsSerialNumbers
        ];
        result.participatingOrgs[`${encryptedMspID}`]["timestamp"] = timestamp;

        await tx.putPublicState(
            investigationID,
            Buffer.from(JSON.stringify(result))
        );
    } else {
        // else reject the function call
        return await returnFunction(" Either Investigation org is not active or passed an empty array as componentsSerialNumbers ", ResponseStatus.PERMISSION_DENIED);
    }
    return await returnFunction(JSON.stringify(result), ResponseStatus.SUCCESS);

};

/**
 * shareInvestigationKey
 * creator org shares key2 to the all the org's with APPROVED investigation status and mark as ACTIVE
 * @async
 * @param tx
 */

export const shareInvestigationKey = async (tx: Transaction) => {
    Logger.info(`Called shareInvestigationKey`);
    const privateData = await tx.getTransientData();
    const { investigationID, secret1, secret2, iv, targetOrg } = privateData;
    const mspID = tx.msp;
    const timestamp = await getCurrentTimestamp();
    const encryptedCreatorOrg = await encryptData(secret1, iv, mspID);
    // get the public details of the investigation
    let result = await tx.getPublicState(investigationID);
    Logger.info(`shareInvestigationKey: result = ${result} , result length = ${result.length}`);
    if (result.length < 0) {
        Logger.info(`shareInvestigationKey: Investigation with key "${investigationID}" not found.`);
        return await returnFunction(`Investigation with key "${investigationID}" not found.`, ResponseStatus.NOT_FOUND);
    }
    result = JSON.parse(result.toString("utf8"));
    // Check if the invoking org is the creator of the investigation
    if (result.creator != encryptedCreatorOrg) {
        return await returnFunction(` ${mspID} is not the creator of the investigation ${investigationID} hence not authorized to perform key sharing`, ResponseStatus.PERMISSION_DENIED);
    }
    let targetOrgCollectionName = await tx.getOrgPrivateCollection(targetOrg);
    //share Key2 with org with Approved status in the investigation
    let investigationPrivate = new InvestigationPrivateClass();
    investigationPrivate.investigationID = investigationID;
    investigationPrivate.secret1 = secret1;
    investigationPrivate.secret2 = secret2;
    investigationPrivate.iv = iv;
    investigationPrivate.docType = "investigation";
    // get secret from transient store
    await tx.putPrivateState(
        targetOrgCollectionName,
        investigationID,
        Buffer.from(JSON.stringify(investigationPrivate))
    );
    const encryptedMspID = await encryptData(secret1, iv, targetOrg);
    // update the status of the org in public as ACTIVE
    result.participatingOrgs[`${encryptedMspID}`]["status"] = InvestigationStatus.ACTIVE;
    result.participatingOrgs[`${encryptedMspID}`]["timestamp"] = timestamp;
    Logger.info(`shareInvestigationKey: public data ${JSON.stringify(result)}`);
    // write the data to public ledger
    await tx.putPublicState(investigationID, Buffer.from(JSON.stringify(result)));
    // return response back
    return await returnFunction(JSON.stringify(result), ResponseStatus.SUCCESS)

};



/**
 * requestAssetForInvestigation
 *  An org which is part of an active investigation can request for assets from another org assets which are part of investigation
 * @async
 * @param tx
 */

export const requestAssetForInvestigation = async (tx: Transaction) => {
    Logger.info(`Called requestAssetForInvestigation`);
    const privateData = await tx.getTransientData();
    const { investigationID, serialNumberCustomer, targetOrg } = privateData;
    const mspID = tx.msp;
    // check permission
    const validationResponse = await validateAssetSharingInInvestigation(tx, investigationID, serialNumberCustomer, targetOrg, mspID, 'REQUEST');
    if (validationResponse.status != ResponseStatus.SUCCESS) {
        return validationResponse;
    }
    // encrypt the serialNumberCustomer
    const encryptedKeyResponse = await encryptDataForInvestigation(tx, investigationID, serialNumberCustomer, 'ASSET', mspID);
    // check the request status
    if (encryptedKeyResponse.status != ResponseStatus.SUCCESS) {
        return encryptedKeyResponse
    }
    const encryptedKey = encryptedKeyResponse.data;
    // encrypt the MSP
    const encryptedMspIDResponse = await encryptDataForInvestigation(tx, investigationID, mspID, 'MSP', mspID);
    // check the request status
    if (encryptedMspIDResponse.status != ResponseStatus.SUCCESS) {
        return encryptedMspIDResponse
    }
    const encryptedMspID = encryptedMspIDResponse.data;

    // Emit the event {investigationID,encrypted serialNumberCustomer, encrypted requestingOrg MSP, targetOrg } 
    let requestInvestigationEvent = {
        investigationID,
        key: encryptedKey,
        encryptedMspID,
        mspID: targetOrg,
    }
    Logger.info(`requestAssetForInvestigation: Emitting requestInvestigationEvent event with data ${JSON.stringify(requestInvestigationEvent)}`);
    // Emitting event
    await tx.emitEvent("RequestInvestigationEvent", Buffer.from(JSON.stringify(requestInvestigationEvent)));
    return await returnFunction(JSON.stringify(privateData), ResponseStatus.SUCCESS)
}


/**
 * exchangeAssetForInvestigation
 * exchange Asset information as part of investigation
 * @async
 * @param tx
 */

export const exchangeAssetForInvestigation = async (tx: Transaction) => {
    Logger.info(`Called exchangeAssetForInvestigation`);
    const privateData = await tx.getTransientData();
    const { investigationID, assetInfo, targetOrg } = privateData;
    const mspID = tx.msp;
    const assetInfoObject = JSON.parse(assetInfo);
    let assetValidationResponse = await validateAssetParameters(assetInfoObject);

    if (assetValidationResponse.status === ResponseStatus.SUCCESS) {
        const serialNumberCustomer = assetInfoObject.serialNumberCustomer;
        // validate the investigation and asset
        const validationResponse = await validateAssetSharingInInvestigation(tx, investigationID, serialNumberCustomer, targetOrg, mspID, 'EXCHANGE');
        if (validationResponse.status != ResponseStatus.SUCCESS) {
            return validationResponse
        }
        const componentKey = await getHashOfHash(serialNumberCustomer);
        const collectionName = await tx.getOrgPrivateCollection(targetOrg);
        Logger.info(`exchangeAssetForInvestigation: Storing child component  information = "${collectionName}"`);
        let assetExchangeObject = new AssetClassModel();
        assetExchangeObject.manufacturer = assetInfoObject.manufacturer;
        assetExchangeObject.productionCountryCodeManufacturer = assetInfoObject.productionCountryCodeManufacturer;
        assetExchangeObject.partNameManufacturer = assetInfoObject.partNameManufacturer;
        assetExchangeObject.partNumberManufacturer = assetInfoObject.partNumberManufacturer;
        assetExchangeObject.partNumberCustomer = assetInfoObject.partNumberCustomer;
        assetExchangeObject.serialNumberManufacturer = assetInfoObject.serialNumberManufacturer;
        assetExchangeObject.serialNumberCustomer = assetInfoObject.serialNumberCustomer;
        assetExchangeObject.qualityStatus = assetInfoObject.qualityStatus;
        assetExchangeObject.serialNumberType = assetInfoObject.serialNumberType;
        assetExchangeObject.componentsSerialNumbers = assetInfoObject.componentsSerialNumbers;
        assetExchangeObject.status = assetInfoObject.status;
        assetExchangeObject.productionDateGmt = assetInfoObject.productionDateGmt;
        assetExchangeObject.mspID = tx.msp;
        assetExchangeObject.manufacturerPlant = assetInfoObject.manufacturerPlant;
        assetExchangeObject.manufacturerLine = assetInfoObject.manufacturerLine;
        assetExchangeObject.serialNumberType = assetInfoObject.serialNumberType;
        assetExchangeObject.qualityDocuments = assetInfoObject.qualityDocuments;
        assetExchangeObject.customFields = assetInfoObject.customFields;

        Logger.info(`exchangeAssetForInvestigation: assetExchangeObject = ${JSON.stringify(assetExchangeObject)}`);
        // write data to target org´s PDC

        await tx.putPrivateState(
            collectionName,
            componentKey,
            Buffer.from(JSON.stringify(assetExchangeObject))
        );

        // encrypt the serialNumberCustomer
        const encryptedKeyResponse = await encryptDataForInvestigation(tx, investigationID, componentKey, 'ASSET', targetOrg);
        // check the request status
        if (encryptedKeyResponse.status != ResponseStatus.SUCCESS) {
            return encryptedKeyResponse
        }
        const encryptedKey = encryptedKeyResponse.data;
        // encrypt the MSP
        const encryptedMspIDResponse = await encryptDataForInvestigation(tx, investigationID, mspID, 'MSP', targetOrg);
        // check the request status
        if (encryptedMspIDResponse.status != ResponseStatus.SUCCESS) {
            return encryptedMspIDResponse
        }
        const encryptedMspID = encryptedMspIDResponse.data
        let exchangeInvestigationEvent = {
            investigationID,
            key: encryptedKey,
            encryptedMspID,
            mspID: targetOrg,
        }
        Logger.info(`exchangeAssetForInvestigation: Emitting exchangeInvestigationEvent event with data ${exchangeInvestigationEvent}`);
        // emit event
        await tx.emitEvent(
            "ExchangeInvestigationEvent",
            Buffer.from(JSON.stringify(exchangeInvestigationEvent))
        );
        return await returnFunction(JSON.stringify(assetExchangeObject), ResponseStatus.SUCCESS);

    } else {
        Logger.error(
            ` exchangeAssetForInvestigation: Error in validation of exchangeAssetForInvestigation = ${assetValidationResponse}`
        );
        return assetValidationResponse
    }

}



/**
 * Validate asset Sharing In Investigation
 * @async
 * @param investigationID 
 * @param serialNumberCustomer 
 * @param targetOrg 
 */

export const validateAssetSharingInInvestigation = async (tx: Transaction, investigationID: string, serialNumberCustomer: string, targetOrg: string, mspID: string, type: string) => {
    Logger.info(`Called validateAssetSharingInInvestigation`)
    if (targetOrg == tx.msp) {
        return await returnFunction(` Request/Exchange assets for same organisation ${targetOrg}`, ResponseStatus.PERMISSION_DENIED);
    }
    if (type == 'REQUEST') {
        // get the investigation public details
        const assetPublicDetails = await getPublicInvestigation(tx, investigationID, mspID);
        // check if the investigation is present 
        if (assetPublicDetails.status === ResponseStatus.NOT_FOUND) {
            return assetPublicDetails
        }
        const assetDetails = JSON.parse(assetPublicDetails.data);
        Logger.info(`validateAssetSharingInInvestigation: public asset details = ${JSON.stringify(assetDetails)}`)
        // check if the status of the investigation is ACTIVE
        if (assetDetails.status != InvestigationStatus.ACTIVE) {
            return await returnFunction(`Investigation status is not ${InvestigationStatus.ACTIVE}`, ResponseStatus.PERMISSION_DENIED);
        }
        // check if the target org is part of the investigation
        const checkTargetOrg = Object.keys(assetDetails.participatingOrgs).filter((mspID) => { return mspID === targetOrg; });
        if (checkTargetOrg.length == 0) {
            return await returnFunction(` ${targetOrg} is not part of investigation ${investigationID}`, ResponseStatus.PERMISSION_DENIED);
        }
        // check if the requested serialNumberCustomer is part of the component List of the target org in the investigation
        const checkSerialNumberCustomer = assetDetails["participatingOrgs"][targetOrg]["componentsSerialNumbers"].filter((requestingSerialNumberCustomer: string) => {
            return requestingSerialNumberCustomer === serialNumberCustomer;
        })
        if (checkSerialNumberCustomer.length == 0) {
            return await returnFunction(` ${serialNumberCustomer} is not part of investigation ${investigationID}`, ResponseStatus.PERMISSION_DENIED);
        }
    }
    else if (type == 'EXCHANGE') {
        // get the investigation public details
        const assetPublicDetails = await getPublicInvestigation(tx, investigationID, targetOrg);
        // check if the investigation is present 
        if (assetPublicDetails.status === ResponseStatus.NOT_FOUND) {
            return assetPublicDetails
        }
        const assetDetails = JSON.parse(assetPublicDetails.data);
        Logger.info(`validateAssetSharingInInvestigation: public asset details = ${JSON.stringify(assetDetails)}`);
        // check if the status of the investigation is ACTIVE
        if (assetDetails.status != InvestigationStatus.ACTIVE) {
            return await returnFunction(`Investigation status is not ${InvestigationStatus.ACTIVE}`, ResponseStatus.PERMISSION_DENIED);
        }
        // check if the target org is part of the investigation
        const checkTargetOrg = Object.keys(assetDetails.participatingOrgs).filter((mspID) => { return mspID === targetOrg; });
        if (checkTargetOrg.length == 0) {
            return await returnFunction(` ${targetOrg} is not part of investigation ${investigationID}`, ResponseStatus.PERMISSION_DENIED);
        }
        // check if the requested serialNumberCustomer is part of the component List of the  org in the investigation
        const checkSerialNumberCustomer = assetDetails["participatingOrgs"][mspID]["componentsSerialNumbers"].filter((requestingSerialNumberCustomer: string) => {
            return requestingSerialNumberCustomer === serialNumberCustomer;
        })
        if (checkSerialNumberCustomer.length == 0) {
            return await returnFunction(` ${serialNumberCustomer} is not part of investigation ${investigationID}`, ResponseStatus.PERMISSION_DENIED);
        }
    }
    // return success
    return await returnFunction(`success `, ResponseStatus.SUCCESS)

}


/**
 * decrypt Data For Investigation
 * @async
 * @param tx 
 */

export const decryptDataForInvestigation = async (tx: Transaction, investigationID: string, data: string, type: string, mspID: string) => {
    Logger.info(`Called decryptDataForInvestigation`);
    // fetch the private details
    let collectionName = await tx.getOrgPrivateCollection(mspID);
    let storedInvestigation = await tx.getPrivateState(
        collectionName,
        investigationID
    );
    Logger.info(`decryptDataForInvestigation: storedInvestigation = ${storedInvestigation} , storedInvestigation length = ${storedInvestigation.length}`);
    storedInvestigation = JSON.parse(storedInvestigation.toString("utf8"));
    const secret1 = storedInvestigation.secret1;
    const secret2 = storedInvestigation.secret2;
    const iv = storedInvestigation.iv;
    if (storedInvestigation.secret2.length == 0) {
        Logger.info(`decryptDataForInvestigation: Investigation ${investigationID}  key2 not found in collection: ${collectionName}.`);
        // return the encrypted data if the secret1 is not found
        return await returnFunction(` Investigation details not found in the private data collection of ${mspID}`, ResponseStatus.NOT_FOUND)
    }
    Logger.info(`decryptDataForInvestigation: storedInvestigation = ${storedInvestigation.toString("utf8")} `);
    Logger.info(`decryptDataForInvestigation: Investigation with key "${investigationID}" found in collection: ${collectionName}`);

    switch (type) {
        // decrypt MSPID
        case 'MSP': {
            const result = await decryptData(secret1, iv, data);
            return await returnFunction(result, ResponseStatus.SUCCESS)
        }
        // decrypt the serialNumberCustomer
        case 'ASSET': {
            const result = await decryptData(secret2, iv, data);
            return await returnFunction(result, ResponseStatus.SUCCESS)
        }
        default: {
            return await returnFunction('invalid type', ResponseStatus.NOT_FOUND)
        }
    }

}



/**
 * encrypt Data For Investigation
 * @async
 * @param tx 
 */

export const encryptDataForInvestigation = async (tx: Transaction, investigationID: string, data: string, type: string, mspID: string) => {
    Logger.info(`Called encryptDataForInvestigation`);

    // fetch the private details
    let collectionName = await tx.getOrgPrivateCollection(mspID);
    let storedInvestigation = await tx.getPrivateState(
        collectionName,
        investigationID
    );
    Logger.info(`encryptDataForInvestigation: storedInvestigation = ${storedInvestigation} , storedInvestigation length = ${storedInvestigation.length}`);

    storedInvestigation = JSON.parse(storedInvestigation.toString("utf8"));
    const secret1 = storedInvestigation.secret1;
    const secret2 = storedInvestigation.secret2;
    const iv = storedInvestigation.iv;
    if (storedInvestigation.secret1.length == 0) {
        Logger.info(`encryptDataForInvestigation: Investigation ${investigationID}  key1 not found in collection: ${collectionName}.`);
        // return the encrypted data if the secret1 is not found
        return await returnFunction(` Investigation details not found in the private data collection of ${mspID}`, ResponseStatus.NOT_FOUND)
    }
    if (storedInvestigation.secret2.length == 0) {
        Logger.info(`encryptDataForInvestigation: Investigation ${investigationID}  key2 not found in collection: ${collectionName}.`);
        // return the encrypted data if the secret1 is not found
        return await returnFunction(` Investigation details not found in the private data collection of ${mspID}`, ResponseStatus.NOT_FOUND)

    }
    Logger.info(`encryptDataForInvestigation: storedInvestigation = ${storedInvestigation.toString("utf8")} `);
    Logger.info(`encryptDataForInvestigation: Investigation with key "${investigationID}" found in collection: ${collectionName}`);

    switch (type) {
        // encrypt MSPID
        case 'MSP': {
            const result = await encryptData(secret1, iv, data);
            return await returnFunction(result, ResponseStatus.SUCCESS)
        }
        // encrypt the serialNumberCustomer
        case 'ASSET': {
            const result = await encryptData(secret2, iv, data);
            return await returnFunction(result, ResponseStatus.SUCCESS)
        }
        default: {
            return await returnFunction('invalid type', ResponseStatus.NOT_FOUND)
        }
    }

}
