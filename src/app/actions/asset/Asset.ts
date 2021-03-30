
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

import Transaction from '../../modules/transaction/Transaction';
import { AssetClassModel, RequestAssetClassModel } from "../../models/AssetClass"
import Logger from '../../modules/logger/Logger';
import { checkAccessPermission, validateAssetParameters, returnFunction } from '../../modules/helper/helperFunctions'
import { getHashOfHash, getHash, getMD5 } from "../../modules/hash/hash"
import { getCurrentTimestamp } from '../../modules/time/time'
import { RequestAssetModel } from '../../models/AssetModel'
import ExchangeClass from "../../models/ExchangeAssetModel"
import { ResponseStatus } from '../../enums/ResponseStatus';


/**
 * Store asset
 * @async
 * @param tx
 * @param action
 * @param changelog
*/

export const storeAsset = async (tx: Transaction, action: string) => {
    Logger.info(`Called storeAsset`);
    const payload = await tx.getTransientData();
    Logger.info(`storeAsset: Validating the input payload`);
    let validationResponse = await validateAssetParameters(payload);
    if (validationResponse.status === 200 && !payload.componentsSerialNumbers.includes(payload.serialNumberCustomer)) {
        let asset = new AssetClassModel();
        // Asset details for storing
        asset.manufacturer = payload.manufacturer;
        asset.productionCountryCodeManufacturer = payload.productionCountryCodeManufacturer;
        asset.partNameManufacturer = payload.partNameManufacturer;
        asset.partNumberManufacturer = payload.partNumberManufacturer;
        asset.partNumberCustomer = payload.partNumberCustomer;
        asset.serialNumberManufacturer = payload.serialNumberManufacturer;
        asset.serialNumberCustomer = payload.serialNumberCustomer;
        asset.qualityStatus = payload.qualityStatus;
        asset.componentsSerialNumbers = payload.componentsSerialNumbers;
        asset.status = payload.status;
        asset.productionDateGmt = payload.productionDateGmt;
        // Use the TAASMSP if the invoke identity belongs to TAAS org
        // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
        asset.mspID = (tx.msp == "Taas") ? payload.taasmsp : tx.msp;
        asset.qualityDocuments = payload.qualityDocuments;
        asset.manufacturerPlant = payload.manufacturerPlant;
        asset.manufacturerLine = payload.manufacturerLine;
        asset.serialNumberType = payload.serialNumberType;
        asset.customFields = payload.customFields;
        Logger.info(`storeAsset: asset details = ${JSON.stringify(asset)}`);
        asset.serialNumberCustomerHash = await getHash(payload.serialNumberCustomer);
        // ComponentKey = serialNumberCustomer + MSPID
        asset.componentKey = await getHashOfHash(payload.serialNumberCustomer + asset.mspID);
        let collectionName = await tx.getOrgPrivateCollection(tx.msp);
        Logger.info(`storeAsset: Organisation collection name =  ${collectionName}`);
        await tx.putPrivateState(
            collectionName,
            asset.componentKey,
            Buffer.from(
                JSON.stringify(asset)
            )
        );
        const componentFullHash = await getHash(JSON.stringify(asset));
        Logger.info(`storeAsset: Calculated component full hash = ${componentFullHash}`);
        Logger.info(`storeAsset: Transaction ID "${tx.id}" `);
        const componentSharedHash = await getMD5(asset);
        Logger.info(`storeAsset: componentSharedHash =  "${componentSharedHash}" `);
        const transactionRecord = JSON.stringify({
            action: action,
            timestamp: await getCurrentTimestamp(),
            componentFullHash: componentFullHash,
            componentSharedHash: componentSharedHash,
            serialNumberCustomerHash: asset.serialNumberCustomerHash,
            transactionID: tx.id,
            // Use the TAASMSP if the invoke identity belongs to TAAS org
            // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
            mspID: tx.msp == "Taas" ? payload.taasmsp : tx.msp
        });
        await tx.putPublicState(asset.serialNumberCustomerHash, Buffer.from(transactionRecord));
        return await returnFunction(JSON.stringify(asset), ResponseStatus.SUCCESS);
    } else {
        Logger.error(` Error in validation of storeAsset = ${validationResponse} or  serialNumberCustomer found in componentsSerialNumbers list`);
        return await returnFunction(JSON.stringify(validationResponse.data), ResponseStatus.VALIDATION_ERROR)
    }

}


/**
 * Request Asset.
 * @async
 * @param tx Transaction
 * @param payload
 */

export const processRequestAsset = async (tx: Transaction, payload: RequestAssetModel) => {
    Logger.info(`Called processRequestAsset`);
    let asset = new RequestAssetClassModel();
    let mspID = payload.manufacturerMSPID;
    asset.manufacturer = payload.manufacturer;
    asset.productionCountryCodeManufacturer = payload.productionCountryCodeManufacturer;
    asset.partNameManufacturer = payload.partNameManufacturer;
    asset.partNumberManufacturer = payload.partNumberManufacturer;
    asset.partNumberCustomer = payload.partNumberCustomer;
    asset.serialNumberManufacturer = payload.serialNumberManufacturer;
    asset.serialNumberCustomer = payload.serialNumberCustomer;
    asset.qualityStatus = payload.qualityStatus;
    asset.status = payload.status;
    asset.productionDateGmt = payload.productionDateGmt;
    asset.manufacturerPlant = payload.manufacturerPlant;
    asset.manufacturerLine = payload.manufacturerLine;
    asset.serialNumberType = payload.serialNumberType;
    asset.qualityDocuments = payload.qualityDocuments;
    asset.customFields = payload.customFields;
    // Use the TAASMSP if the invoke identity belongs to TAAS org
    // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
    asset.mspID = (tx.msp == "Taas") ? payload.taasmsp : tx.msp;
    const childSerialNumberCustomer = [...asset.childSerialNumberCustomer, ...payload.childSerialNumberCustomer];
    Logger.info(`processRequestAsset: childSerialNumberCustomer = ${childSerialNumberCustomer}`);
    asset.childSerialNumberCustomer = childSerialNumberCustomer;
    let parentComponentKey = await getHashOfHash(payload.serialNumberCustomer + mspID);
    let requestEvent = {
        key: parentComponentKey,
        mspID: mspID
    }
    if (mspID == asset.mspID) {
        Logger.info(`Requesting Asset for same org  so skipping the ACL validation ${mspID}`);
        Logger.info(`processRequestAsset: Emitting RequestEvent event with data ${JSON.stringify(requestEvent)}`);
        // Emitting RequestEvent
        await tx.emitEvent("RequestEvent", Buffer.from(JSON.stringify(requestEvent)));
        return await returnFunction(JSON.stringify(payload), ResponseStatus.SUCCESS)
    }
    Logger.info(`processRequestAsset: Requesting asset from a different org ${mspID}`)
    // check if the org has permission to write to supplier´s private data collection
    const result = await checkAccessPermission(tx, mspID, asset.mspID);
    Logger.info(`processRequestAsset: Access permission result = ${JSON.stringify(result)}`);
    if (result.status === ResponseStatus.PERMISSION_DENIED) {
        return result
    }
    Logger.info(`processRequestAsset: access permission = ${result}`);
    let supplierCollectionName = await tx.getOrgPrivateCollection(mspID);
    Logger.info(`processRequestAsset: requestAsset:Storing partent information on the supplier collection = "${supplierCollectionName}"`);
    // Storing parent information on the supplier PDC
    await tx.putPrivateState(
        supplierCollectionName,
        parentComponentKey,
        Buffer.from(
            JSON.stringify(asset)
        )
    );

    Logger.info(`processRequestAsset: Emitting RequestEvent event with data ${JSON.stringify(requestEvent)}`);
    // Emitting event
    await tx.emitEvent("RequestEvent", Buffer.from(JSON.stringify(requestEvent)));
    return await returnFunction(JSON.stringify(payload), ResponseStatus.SUCCESS)

}



/**
 * Process Exchange Asset
 * @async
 * @param tx Transaction
 * @param payload
 * 
 */

export const processExchangeAsset = async (tx: Transaction, payload: any) => {
    Logger.info(`Called processExchangeAsset`);
    const mspID = payload.parentMSP;
    const assetInfo = payload.assetInfo;
    const componentKey = await getHashOfHash(payload.serialNumberCustomer + mspID);
    const collectionName = await tx.getOrgPrivateCollection(mspID);
    Logger.info(`exchangeAssetInfo: Storing child component  information  on the buyers´s  collection = "${collectionName}"`);
    Logger.info(`exchangeAssetInfo: assetInfo = ${assetInfo}`);
    const assetInfoObject = JSON.parse(assetInfo);
    let assetExchangeObject = new ExchangeClass();
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
    // Use the TAASMSP if the invoke identity belongs to TAAS org
    // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
    assetExchangeObject.mspID = (tx.msp == "Taas") ? payload.taasmsp : tx.msp;
    assetExchangeObject.manufacturerPlant = assetInfoObject.manufacturerPlant;
    assetExchangeObject.manufacturerLine = assetInfoObject.manufacturerLine;
    assetExchangeObject.serialNumberType = assetInfoObject.serialNumberType;
    assetExchangeObject.qualityDocuments = assetInfoObject.qualityDocuments;
    assetExchangeObject.customFields = assetInfoObject.customFields;
    Logger.info(`exchangeAssetInfo: assetExchangeObject = ${JSON.stringify(assetExchangeObject)}`);
    let exchangeEvent = {
        key: componentKey,
        mspID: mspID
    };
    if (mspID == assetExchangeObject.mspID) {
        Logger.info(`Exchanging the asset for same org ${mspID}`);
        Logger.info(`Emitting exchangeEvent event with data ${exchangeEvent}`);
        await tx.emitEvent(
            "ExchangeEvent",
            Buffer.from(JSON.stringify(exchangeEvent))
        );
        return await returnFunction(JSON.stringify(payload), ResponseStatus.SUCCESS);
    }
    const result = await checkAccessPermission(tx, mspID, assetExchangeObject.mspID);
    Logger.info(`exchangeAssetInfo:  access permission result = ${JSON.stringify(result)}`);
    if (result.status === ResponseStatus.PERMISSION_DENIED) {
        return result
    }
    await tx.putPrivateState(
        collectionName,
        componentKey,
        Buffer.from(JSON.stringify(assetExchangeObject))
    );
    Logger.info(`Emitting exchangeEvent event with data ${exchangeEvent}`);
    await tx.emitEvent(
        "ExchangeEvent",
        Buffer.from(JSON.stringify(exchangeEvent))
    );
    return await returnFunction(JSON.stringify(payload), ResponseStatus.SUCCESS)
}
