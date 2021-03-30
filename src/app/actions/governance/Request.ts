
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
import Logger from "../../modules/logger/Logger";
import RequestClass from '../../models/RequestClass'
import { getCurrentTimestamp } from '../../modules/time/time'
import { getOrgDetails } from './Organisation'
import { ResponseStatus } from '../../enums/ResponseStatus';
import { returnFunction } from '../../modules/helper/helperFunctions';


/**
 * create Request
 * @async
 * @param tx
 */

export const createRequest = async (tx: Transaction) => {
    Logger.info(`Called: createRequest`);
    const payload = JSON.parse(tx.payload);
    // validate if the targetOrg field is present with the payload
    if (!payload.hasOwnProperty("targetOrg")) {
        return await returnFunction(`Request is missing targetOrg`, ResponseStatus.VALIDATION_ERROR);
    }
    const { targetOrg, comment } = payload;
    // Fetching the TaasMSP is the requester is an identity of TAAS
    // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
    const creatorMSP = (tx.msp == "Taas") ? payload.taasmsp : tx.msp;
    const timestamp = await getCurrentTimestamp();
    Logger.info(`createRequest: targetOrg = ${targetOrg} & creatorOrg = ${creatorMSP}`);
    if (targetOrg === creatorMSP) {
        return await returnFunction(`Request creating for the same organisation`, ResponseStatus.VALIDATION_ERROR);
    }
    // Fetch the details of creator org
    Logger.info(`createRequest: Fetch the details of creator org = ${creatorMSP}`);
    const creatorOrgDetails = await getOrgDetails(tx, creatorMSP);
    if (creatorOrgDetails.status == ResponseStatus.NOT_FOUND) {
        return await returnFunction(`Creator Org ${creatorMSP} must enroll first`, ResponseStatus.NOT_FOUND);
    }
    const creatorOrgData = JSON.parse(creatorOrgDetails.data);
    Logger.info(`createRequest: creatorOrgData = ${JSON.stringify(creatorOrgData)}`);
    // Fetch the details of target org
    Logger.info(`createRequest: Fetching details of target org = ${targetOrg}`);
    const targetOrgDataDetails = await getOrgDetails(tx, targetOrg);
    if (targetOrgDataDetails.status == ResponseStatus.NOT_FOUND) {
        return await returnFunction(`target Org ${targetOrg} must enroll first`, ResponseStatus.NOT_FOUND);
    }
    const targetOrgData = JSON.parse(targetOrgDataDetails.data);
    Logger.info(`createRequest: targetOrgData = ${JSON.stringify(targetOrgData)}`);
    // Add the request to both creator Org and target Org
    let entities = [];
    entities.push(targetOrg);
    entities.push(creatorMSP);
    const RequestID = entities.sort().join("");
    Logger.info(`createRequest: RequestID = ${RequestID}`);
    // Check if the relationship already exist in either of the orgs
    if (targetOrgData["ACL"][RequestID] != undefined || creatorOrgData["ACL"][RequestID] != undefined) {
        return await returnFunction(`Relationship with RequestID ${RequestID} already exist with Org ${targetOrg} and ${creatorMSP}`, ResponseStatus.PERMISSION_DENIED);
    }
    const request = new RequestClass();
    request.entities = entities;
    request.comment = comment;
    request.status = "PENDING";
    request.timestamp = timestamp;
    request.changedBy = creatorMSP;
    Logger.info(`createRequest: request = ${JSON.stringify(request)}`);
    // Update the target Org Info
    creatorOrgData["ACL"][RequestID] = request;
    Logger.info(`createRequest: updated creatorOrgData = ${JSON.stringify(creatorOrgData)}`);
    await tx.putPublicState(creatorMSP, Buffer.from(JSON.stringify(creatorOrgData)));
    // Update the creator Org Info
    targetOrgData["ACL"][RequestID] = request;
    Logger.info(`createRequest: updated targetOrgData = ${JSON.stringify(targetOrgData)}`);
    await tx.putPublicState(targetOrg, Buffer.from(JSON.stringify(targetOrgData)));
    // Send updated creator org information 
    return await returnFunction(JSON.stringify(creatorOrgData), ResponseStatus.SUCCESS);
}

/**
 * Update Request
 * @async
 * @param tx
 */

export const updateRequest = async (tx: Transaction) => {
    Logger.info(`Called updateRequest`);
    const payload = JSON.parse(tx.payload);
    // validate if the targetOrg field is present with the payload
    if (!payload.hasOwnProperty("targetOrg")) {
        return await returnFunction(`Request is missing targetOrg`, ResponseStatus.VALIDATION_ERROR);
    }
    // validate if the status field is present with the payload
    if (!payload.hasOwnProperty("status")) {
        return await returnFunction(`Request is missing status`, ResponseStatus.VALIDATION_ERROR);
    }
    const { targetOrg, comment, status } = payload;
    // Use the TAASMSP if the invoke identity belongs to TAAS org
    // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
    const creatorMSP = (tx.msp == "Taas") ? payload.taasmsp : tx.msp;
    const timestamp = await getCurrentTimestamp();
    Logger.info(`updateRequest: targetOrg = ${targetOrg}`);
    Logger.info(`updateRequest: creatorOrg = ${creatorMSP}`);
    if (targetOrg === creatorMSP) {
        return await returnFunction(`Request updating for the same organisation`, ResponseStatus.PERMISSION_DENIED);
    }
    //1. get the request for currentOrg
    Logger.info(`updateRequest: Fetching the details of creator org = ${creatorMSP}`);
    const creatorOrgDetails = await getOrgDetails(tx, creatorMSP);
    const creatorOrgData = JSON.parse(creatorOrgDetails.data);
    if (creatorOrgData.status == ResponseStatus.NOT_FOUND) {
        return await returnFunction(`Creator Org ${creatorMSP} must enroll first`, ResponseStatus.NOT_FOUND);
    }
    //2. get the details for targetOrg
    Logger.info(`updateRequest: Fetch the details of target org = ${targetOrg}`);
    const targetOrgDetails = await getOrgDetails(tx, targetOrg);
    if (targetOrgDetails.status == ResponseStatus.NOT_FOUND) {
        return await returnFunction(`target Org ${targetOrg} must enroll first`, ResponseStatus.NOT_FOUND);
    }
    const targetOrgData = JSON.parse(targetOrgDetails.data);
    Logger.info(`updateRequest: targetOrgData = ${JSON.stringify(targetOrgData)}`);
    //3. Get Request ID
    let entities = [];
    entities.push(targetOrg);
    entities.push(creatorMSP);
    const RequestID = entities.sort().join("");
    Logger.info(`updateRequest: RequestID = ${RequestID}`);
    //4. Check if the relationship already exist in either of the orgs
    if (targetOrgData["ACL"][RequestID] === undefined || creatorOrgData["ACL"][RequestID] === undefined) {
        return await returnFunction(`Relationship with RequestID ${RequestID} doesnot exist with Org ${targetOrg} and ${creatorMSP}`, ResponseStatus.PERMISSION_DENIED);
    }
    //5. Check the access control for updating the status
    if (targetOrgData["ACL"][RequestID]["status"] == status && creatorOrgData["ACL"][RequestID]["status"] == status) {
        return await returnFunction(`RequestID ${RequestID} is in same  status ${status}`, ResponseStatus.PERMISSION_DENIED);
    }
    else if (targetOrgData["ACL"][RequestID]["status"] == "PENDING" && creatorOrgData["ACL"][RequestID]["status"] == "PENDING") {
        if (targetOrgData["ACL"][RequestID].changedBy == creatorMSP) {
            return await returnFunction(`RequestID ${RequestID} is pending with ${targetOrg}`, ResponseStatus.PERMISSION_DENIED);
        }
    } else if (targetOrgData["ACL"][RequestID]["status"] == "INACTIVE" && creatorOrgData["ACL"][RequestID]["status"] == "INACTIVE") {
        if (status != "PENDING") {
            return await returnFunction(`RequestID ${RequestID}  is  INACTIVE the next status must be PENDING`, ResponseStatus.PERMISSION_DENIED);
        }
    } else if (targetOrgData["ACL"][RequestID]["status"] == "ACTIVE" && creatorOrgData["ACL"][RequestID]["status"] == "ACTIVE") {
        if (status != "INACTIVE") {
            return await returnFunction(`RequestID ${RequestID}  is in ACTIVE the next status must be INACTIVE`, ResponseStatus.PERMISSION_DENIED);
        }
    }

    //6. Update History
    const history = {
        comment: creatorOrgData["ACL"][RequestID]["comment"],
        status: creatorOrgData["ACL"][RequestID]["status"],
        changedBy: creatorOrgData["ACL"][RequestID]["changedBy"],
        timestamp: creatorOrgData["ACL"][RequestID]["timestamp"]
    }
    //7. Update latest value in CurrentOrg
    creatorOrgData["ACL"][RequestID]["comment"] = comment;
    creatorOrgData["ACL"][RequestID]["status"] = status;
    creatorOrgData["ACL"][RequestID]["changedBy"] = creatorMSP;
    creatorOrgData["ACL"][RequestID]["comment"] = comment;
    creatorOrgData["ACL"][RequestID]["timestamp"] = timestamp
    creatorOrgData["ACL"][RequestID]["history"].push(history);
    //8. Update latest value in targetOrg
    targetOrgData["ACL"][RequestID]["comment"] = comment;
    targetOrgData["ACL"][RequestID]["status"] = status;
    targetOrgData["ACL"][RequestID]["changedBy"] = creatorMSP;
    targetOrgData["ACL"][RequestID]["comment"] = comment;
    targetOrgData["ACL"][RequestID]["timestamp"] = timestamp;
    targetOrgData["ACL"][RequestID]["history"].push(history);
    //9. Update the target Org Info
    Logger.info(`updateRequest: updated creatorOrgData = ${JSON.stringify(creatorOrgData)}`);
    await tx.putPublicState(creatorMSP, Buffer.from(JSON.stringify(creatorOrgData)));
    //10. Update the creator Org Info
    Logger.info(`updateRequest: updated targetOrgData = ${JSON.stringify(targetOrgData)}`);
    await tx.putPublicState(targetOrg, Buffer.from(JSON.stringify(targetOrgData)));
    //11. Return updated currentOrg details
    return await returnFunction(JSON.stringify(creatorOrgData), ResponseStatus.SUCCESS);
}
