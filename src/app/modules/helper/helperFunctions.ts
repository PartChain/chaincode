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

import { getOrgDetails } from "../../actions/governance/Organisation";
import Transaction from "../transaction/Transaction";
import Logger from "../logger/Logger";
import AssetValidator, { InvestigationClass, AddOrgToInvestigationClass } from "../../models/ValidationClasses";
import Validator from "../validator/validator";
import { AssetHashVerificationModel } from "../../models/AssetModel";
import { getMD5 } from "../hash/hash";
import { createCipheriv, createDecipheriv } from "crypto";
import { ResponseStatus } from "../../enums/ResponseStatus";
const algorithm = "aes-256-cbc";

/**
 * This file contains list of helper functions
 */

/**
 * Get Request ID
 * @async
 * @param org1 MSPID of first org
 * @param org2 MSPID of first org
 */

export const getRequestID = async (org1: string, org2: string) => {
	Logger.info(`Called getRequestID`);
	let entities = [];
	entities.push(org1);
	entities.push(org2);
	const RequestID = entities.sort().join("");
	Logger.info(`getRequestID: RequestID = ${RequestID}`);
	return RequestID;
};

/**
 * Check access permission
 * @async
 * @param tx
 * @param targetOrgMSP
 * @param creatorOrgMSP
 *
 */
export const checkAccessPermission = async (tx: Transaction, targetOrgMSP: string, creatorOrgMSP: string) => {
	Logger.info(`Called checkAccessPermission`);
	Logger.info(`checkAccessPermission: MSP ID for targetOrg = "${targetOrgMSP}" and creatorOrg = ${creatorOrgMSP} `);
	let targetOrgData = await getOrgDetails(tx, targetOrgMSP);
	if (targetOrgData.status == ResponseStatus.NOT_FOUND) {
		throw Error(`Org ${targetOrgMSP} is not registerd in Partchain system`);
	}
	Logger.info(`checkAccessPermission: targetOrgData = "${targetOrgData.data}"`);
	const targetOrgDataDetails = JSON.parse(targetOrgData.data);
	// Fetching the requestID
	const RequestID = await getRequestID(targetOrgMSP, creatorOrgMSP);
	// check if the requestID is present
	if (!targetOrgDataDetails["ACL"].hasOwnProperty(RequestID)) {
		Logger.error(`checkAccessPermission: RequestID ${RequestID} doesnot exist with ${targetOrgMSP}`);
		return await returnFunction(`RequestID ${RequestID} doesnot exist with ${targetOrgMSP}`, ResponseStatus.PERMISSION_DENIED);
	}
	// check if the status of the request is active
	if (targetOrgDataDetails["ACL"][RequestID]["status"] != "ACTIVE") {
		Logger.error(`RequestID ${RequestID} is not in ACTIVE status`);
		return await returnFunction(`RequestID ${RequestID} is not in ACTIVE status`, ResponseStatus.PERMISSION_DENIED);
	}
	return await returnFunction(`success`, ResponseStatus.SUCCESS);
};

/**
 * Function for validating the input parameters for asset
 * @async
 * @param payload
 */
export const validateAssetParameters = async (payload: any) => {
	Logger.info(`Called validateAssetParameters`);
	let assetPayload = new AssetValidator();
	// Asset details for validation
	assetPayload.manufacturer = payload.manufacturer;
	assetPayload.productionCountryCodeManufacturer = payload.productionCountryCodeManufacturer;
	assetPayload.partNameManufacturer = payload.partNameManufacturer;
	assetPayload.partNumberManufacturer = payload.partNumberManufacturer;
	assetPayload.partNumberCustomer = payload.partNumberCustomer;
	assetPayload.serialNumberManufacturer = payload.serialNumberManufacturer;
	assetPayload.serialNumberCustomer = payload.serialNumberCustomer;
	assetPayload.qualityStatus = payload.qualityStatus;
	assetPayload.serialNumberType = payload.serialNumberType;
	assetPayload.status = payload.status;
	assetPayload.productionDateGmt = payload.productionDateGmt;
	Logger.info(`validateAssetParameters: Validating the input payload ${JSON.stringify(assetPayload)}`);
	// Validating the input parameter
	let validationResponse = await Validator(assetPayload);
	if (validationResponse == true) {
		Logger.info(`validateAssetParameters: ValidationResponse = ${JSON.stringify(validationResponse)}`);
		return await returnFunction(validationResponse.toString(), ResponseStatus.SUCCESS);
	} else {
		Logger.info(`validateAssetParameters: ValidationResponse = ${JSON.stringify(validationResponse)}`);
		return await returnFunction(validationResponse.toString(), ResponseStatus.VALIDATION_ERROR);
	}
};

/**
 * Function for validating the create investigation parameters
 * @async
 * @param tx
 */
export const validateCreateInvestigation = async (payload: any) => {
	Logger.info(`Called validateCreateInvestigation`);
	let investigationPayload = new InvestigationClass();
	// Asset details for validation

	investigationPayload.description = payload.description;
	investigationPayload.title = payload.title;
	investigationPayload.secret1 = payload.secret1;
	investigationPayload.secret2 = payload.secret2;
	investigationPayload.iv = payload.iv;
	investigationPayload.investigationID = payload.investigationID;
	investigationPayload.type = payload.type;
	Logger.info(`validateCreateInvestigation: validating the input payload ${JSON.stringify(investigationPayload)}`);
	// Validating the input parameter
	let validationResponse = await Validator(investigationPayload);
	Logger.info(`validateCreateInvestigation: validationResponse = ${validationResponse}`);
	return validationResponse;
};

/**
 * Function for validate AddOrg To Investigation
 * @async
 * @param tx
 */
export const validateAddOrgToInvestigation = async (payload: any) => {
	Logger.info(`Called validateAddOrgToInvestigation`);
	let investigationPayload = new AddOrgToInvestigationClass();
	// Asset details for validation
	investigationPayload.investigationID = payload.investigationID;
	investigationPayload.secret1 = payload.secret1;
	investigationPayload.targetOrg = payload.targetOrg;
	investigationPayload.iv = payload.iv;
	Logger.info(`validateAddOrgToInvestigation: validating the input payload ${JSON.stringify(investigationPayload)}`);
	// Validating the input parameter
	let validationResponse = await Validator(investigationPayload);
	Logger.info(`validateAddOrgToInvestigation: validationResponse = ${validationResponse}`);
	return validationResponse;
};

/**
 * Validate Asset
 * @async
 * @param tx
 */
export const validateAsset = async (componentSharedHash: string, asset: AssetHashVerificationModel) => {
	Logger.info("Called validateAsset");
	const payloadHash = await getMD5(asset);
	Logger.info(`validateAsset: The computed component shared hash = ${payloadHash} & current componentSharedHash = ${componentSharedHash} `);
	if (componentSharedHash.toString() === payloadHash.toString()) {
		return true;
	} else {
		return false;
	}
};

/**
 * Encrypt data
 * @async
 * @param keyString  //String value of the key
 * @param ivString   //String value of the iv
 * @param input      // Data to be encrypted
 */

export const encryptData = async (keyString: string, ivString: string, input: string) => {
	Logger.info("Called encryptData");
	const key = Buffer.from(keyString, "hex");
	// Defining iv
	const iv = Buffer.from(ivString, "hex");
	// Creating Cipheriv with its parameter
	let cipher = createCipheriv(algorithm, Buffer.from(key), iv);
	// Updating text
	let encrypted = cipher.update(input);
	// Using concatenation
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	// Returning iv and encrypted data
	return encrypted.toString("hex");
};

/**
 * Decrypt data
 * @async
 * @param keyString  //String value of the key
 * @param ivString   //String value of the iv
 * @param input      // Data to be decrypted
 */

export const decryptData = async (keyString: string, ivString: string, input: string) => {
	Logger.info("Called decryptData");
	Logger.info(`decryptData: keyString = ${keyString}  ivString = ${ivString} input = ${input}`);
	let iv = Buffer.from(ivString, "hex");
	let encryptedText = Buffer.from(input, "hex");
	const key = Buffer.from(keyString, "hex");
	// Creating Decipher
	let decipher = createDecipheriv(algorithm, Buffer.from(key), iv);
	// Updating encrypted text
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	Logger.info(`decryptData: Decrypted data = ${decrypted.toString()}`);
	// returns data after decryption
	return decrypted.toString();
};

/**
 * Decrypt Array
 * @async
 * @param keyString  //String value of the key
 * @param ivString   //String value of the iv
 * @param inputArray  // Array to be decrypted
 */

export const decryptArray = async (keyString: string, ivString: string, inputArray: string[]) => {
	Logger.info("Called decryptArray");
	const decryptedArray = await Promise.all(
		inputArray.map(async (item: string) => {
			item = await decryptData(keyString, ivString, item);
			return item;
		})
	);
	return decryptedArray;
};

/**
 * Encrypt Array
 * @async
 * @param keyString  //String value of the key
 * @param ivString   //String value of the iv
 * @param inputArray  // Array to be Encrypted
 */

export const encryptArray = async (keyString: string, ivString: string, inputArray: string[]) => {
	Logger.info("Called encryptArray");
	const encryptedArray = await Promise.all(
		inputArray.map(async (item: string) => {
			item = await encryptData(keyString, ivString, item);
			return item;
		})
	);
	return encryptedArray;
};

/**
 *
 * @async
 * @param keyString
 * @param ivString
 * @param input
 */
export const decryptParticipatingOrgs = async (keyString: string, key2String: string, ivString: string, input: any) => {
	Logger.info("Called decryptParticipatingOrgs");
	let agreedOrgs = {} as { [key: string]: Object };
	let encryptedkey: string;
	let decryptedkey: string;

	for (encryptedkey in input) {
		if (input.hasOwnProperty(encryptedkey)) {
			decryptedkey = await decryptData(keyString, ivString, encryptedkey);
			input[encryptedkey]["mspID"] = await decryptData(keyString, ivString, input[encryptedkey]["mspID"]);
			if (input[encryptedkey]["componentsSerialNumbers"].length > 0) {
				input[encryptedkey]["componentsSerialNumbers"] = await decryptArray(key2String, ivString, input[encryptedkey]["componentsSerialNumbers"]);
			}
			agreedOrgs[decryptedkey] = input[encryptedkey];
		}
	}
	Logger.info(`decryptParticipatingOrgs: Decrypted agreed Org details = ${JSON.stringify(agreedOrgs)}`);
	return agreedOrgs;
};

/**
 * Return function
 * @async
 * @param string
 * @param status
 */
export const returnFunction = async (payload: string, status: number) => {
	Logger.info(`Payload in the return function response =${payload}, status = ${status}`);
	return {
		data: payload,
		status: status
	};
};
