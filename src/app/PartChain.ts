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

import Transaction from "./modules/transaction/Transaction";
import Logger from "./modules/logger/Logger";
import Comparator from "./modules/comparator/Comparator";
import Response from "./modules/response/Response";
import { getHashOfHash, getHash } from "./modules/hash/hash";
import { enrollOrg, getOrgDetails } from "./actions/governance/Organisation";
import { createRequest, updateRequest } from "./actions/governance/Request";
import {
  validateAssetParameters,
  validateAsset,
  returnFunction
} from "./modules/helper/helperFunctions";
import {
  storeAsset,
  processRequestAsset,
  processExchangeAsset
} from "./actions/asset/Asset";
import {
  createInvestigation,
  getPublicInvestigation,
  getPrivateInvestigation,
  addOrganisationToInvestigation,
  updateOrgInvestigationStatus,
  addSerialNumberCustomer,
  shareInvestigationKey,
  requestAssetForInvestigation,
  exchangeAssetForInvestigation,
  decryptDataForInvestigation,
  encryptDataForInvestigation,
  closeInvestigation
} from "./actions/investigation/Investigation";
import { ResponseStatus } from "./enums/ResponseStatus";
import { ResponseModel } from "./models/ValidationModel";

/**
 * Part Chain class
 * @class PartChain
 * @export PartChain
 */
export default class PartChain {

  /**
   *
   *
   * Enroll Organisation
   * This function is used for enrolling a new organisation in the Partchain
   * @async
   * @param tx
   */

  async enrollOrganisation(tx: Transaction) {
    Logger.info(`Called enrollOrganisation`);
    try {
      // Checking if the org is already enrolled. If the MSPID of the invoker is Taas, Then use the MSPID supplied in the payload
      // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
      const result: ResponseModel = await getOrgDetails(
        tx,
        tx.msp == "Taas" ? JSON.parse(tx.payload).taasmsp : tx.msp
      );
      Logger.info(`enrollOrganisation: Response of getOrgDetails = ${JSON.stringify(result)}`);
      // Requested Organisation is already enrolled with Partchain
      if (result.status == ResponseStatus.SUCCESS) {
        return Response.successObject(
          JSON.parse(
            JSON.stringify([`Org details found in PDC ${result.data} `])
          ),
          ResponseStatus.PERMISSION_DENIED
        );
      } else {
        // Enroll organisation
        const response: ResponseModel = await enrollOrg(tx);
        Logger.info(`enrollOrganisation: Organisation enrolled successfully: "${JSON.stringify(response)}"`);
        return Response.successObject(response, ResponseStatus.SUCCESS);
      }
    } catch (error) {
      Logger.error(`enrollOrganisation: Error occurred during Organisation enrollment "${JSON.stringify(error)}"`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during enroll Organisation ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Get Organisation details
   * This function is used to get the ACL details of the passed organisation
   * @async
   * @param tx
   */

  async getOrganisationDetails(tx: Transaction) {
    Logger.info(`Called getOrganisationDetails`);
    try {
      const payload = JSON.parse(tx.payload);
      // check if the orgMSP is part of the payload
      if (!payload.hasOwnProperty("orgMSP")) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([`orgMSP not found in the payload`])),
          ResponseStatus.VALIDATION_ERROR
        );
      }
      // Process request for request Org MSP
      const mspID = payload.orgMSP;
      //getOrganisationDetails: Checking if the mspID is  enrolled
      const result: ResponseModel = await getOrgDetails(tx, mspID);
      if (result.status == ResponseStatus.SUCCESS) {
        Logger.info(`getOrganisationDetails: organisation ${mspID}  found in the ledger"`);
        const data = JSON.parse(result.data);
        Logger.info(`getOrganisationDetails: getOrganisationDetails = ${result.data}`);
        return Response.successObject(data, ResponseStatus.SUCCESS);
      } else {
        Logger.info(`getOrganisationDetails: organisation ${mspID} not found in the ledger"`);
        return Response.successObject(
          JSON.parse(JSON.stringify([`Org with key "${mspID}" not found.`])),
          ResponseStatus.NOT_FOUND
        );
      }
    } catch (error) {
      Logger.error(`getOrganisationDetails: Error occurred in the getOrganisationDetails = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during getOrganisationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Create Access request
   * This functions creates a relationship in the ACL of both organisation.
   * The relationship is validated at the time of request and exchange of assets between the organisations.
   * The request and exchange works only if the status of the relationship between the organisations is ACTIVE.
   * @async
   * @param tx
   */

  async createAccessRequest(tx: Transaction) {
    Logger.info(`Called createAccessRequest`);
    try {
      // called the implementation of create request
      const result: ResponseModel = await createRequest(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.successObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      Logger.info(`createAccessRequest: success response =  ${JSON.stringify(result)}"`);
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      Logger.error(`createAccessRequest: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during createAccessRequest ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Update Request
   * This function is used to update status of an existing relationship in ACL
   * @async
   * @param tx
   */

  async updateAccessRequest(tx: Transaction) {
    Logger.info(`Called updateAccessRequest`);
    try {
      const result: ResponseModel = await updateRequest(tx);
      Logger.info(`updateAccessRequest: result =  ${result}"`);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      Logger.error(`updateAccessRequest: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occured during updateAccessRequest ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Create asset
   * This function is used to create a new asset in partchain system.
   * In this function we store all the details of the asset in the PDC of the invoked organisation.
   * We also store hashes and MSPID of the org in the public ledger, which is used in the case of asset validation.
   * @async
   * @param tx
   */
  async createAsset(tx: Transaction) {
    Logger.info(`Called createAsset`);
    try {
      let transientData = await tx.getTransientData();
      Logger.info(`createAsset: Transient data = ${JSON.stringify(transientData)}`);
      const { serialNumberCustomer } = transientData;
      if (await this.isAssetStored(tx, serialNumberCustomer)) {
        return Response.errorObject(
          JSON.parse(
            JSON.stringify([
              `Asset with key "${serialNumberCustomer}" is already stored.`
            ])
          ),
          ResponseStatus.PERMISSION_DENIED
        );
      }
      // Processing store asset in PDC
      const result: ResponseModel = await storeAsset(tx, "create");
      Logger.info(`createAsset: result: "${JSON.stringify(result)}"`);
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during store asset ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Is asset current
   * This function is used to check if there is any changes to the passed asset details and stored asset details
   * @async
   * @param tx
   */
  async isAssetCurrent(tx: Transaction) {
    Logger.info(`Called isAssetCurrent`);
    let transientData = await tx.getTransientData();
    Logger.info(`isAssetCurrent Transient data = ${JSON.stringify(transientData)}`);
    const { serialNumberCustomer } = transientData;
    const asset: ResponseModel = await this.findAssetAsBytes(tx, serialNumberCustomer);
    let result = false;
    if (asset.status !== ResponseStatus.NOT_FOUND) {
      Logger.info(`isAssetCurrent: asset: ${JSON.stringify(asset)}`);
      let newAsset = JSON.parse(asset.data);
      delete newAsset["componentKey"];
      delete newAsset["serialNumberCustomerHash"];
      const assetAsString = JSON.stringify(newAsset);
      Logger.info(`isAssetCurrent: assetAsString: ${assetAsString}`);
      Logger.info(`isAssetCurrent: payloadAsString: ${tx.payload}`);
      result = Comparator.compareStringifiedObjects(assetAsString, tx.payload);
    } else {
      return Response.errorObject(
        JSON.parse(JSON.stringify([asset.data])),
        asset.status
      );
    }
    Logger.info(`isAssetCurrent: Is asset current?: "${result}"`);
    return Response.successObject(
      JSON.parse(JSON.stringify({ isCurrent: result })),
      ResponseStatus.SUCCESS
    );
  }

  /**
   * Update asset
   * This function is used to update an existing asset
   * @async
   * @param tx
   */
  async updateAsset(tx: Transaction) {
    Logger.info(`Called updateAsset`);
    try {
      let transientData = await tx.getTransientData();
      Logger.info(`updateAsset: Transient data = ${JSON.stringify(transientData)}`);
      const { serialNumberCustomer } = transientData;
      const asset: ResponseModel = await this.findAssetAsBytes(tx, serialNumberCustomer);
      if (asset.status === ResponseStatus.NOT_FOUND) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([asset.data])),
          asset.status
        );
      }
      const result = await storeAsset(tx, "update");
      Logger.info(`updateAsset: Storing result: "${result}"`);
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during store asset ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Request asset
   * This function is used to request an asset from the another organisation.
   * We shared the details of the parent asset to the requesting organisation PDC first.
   * Emit RequestEvent addressed to the corresponding Target Organisation.
   * @async
   * @param tx
   */

  async requestAsset(tx: Transaction) {
    Logger.info(`Called requestAsset`);
    const payload = await tx.getTransientData();
    Logger.info(`requestAsset:TransientData = ${JSON.stringify(payload)}`);
    try {
      let validationResponse: ResponseModel = await validateAssetParameters(payload);
      if (validationResponse.status === ResponseStatus.SUCCESS) {
        // call to process request asset
        const result: ResponseModel = await processRequestAsset(tx, payload);
        if (result.status != ResponseStatus.SUCCESS) {
          return Response.errorObject(
            JSON.parse(JSON.stringify([result.data])),
            result.status
          );
        }
        return Response.successObject(JSON.parse(result.data), result.status);
      } else {
        Logger.error(`requestAsset: Error in validation of requestAsset = ${validationResponse}`);
        return Response.errorObject(
          JSON.parse(JSON.stringify([validationResponse.data])),
          validationResponse.status
        );
      }
    } catch (error) {
      Logger.error(`requestAsset: Error occurred in requestAsset "${error}"`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during request Asset ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Exchange Asset information
   * This function is used by the supplier org to exchange the data with the request organisation
   * The requesting asset information is shared and ExchangeEvent is emitted
   * @async
   * @param tx
   */

  async exchangeAssetInfo(tx: Transaction) {
    Logger.info(`Called exchangeAssetInfo`);
    try {
      const payload = await tx.getTransientData();
      Logger.info(`exchangeAssetInfo:TransientData = ${JSON.stringify(payload)}`);
      const assetInfo = payload.assetInfo;
      const assetInfoObject = JSON.parse(assetInfo);
      let validationResponse: ResponseModel = await validateAssetParameters(assetInfoObject);
      if (validationResponse.status === ResponseStatus.SUCCESS) {
        const result = await processExchangeAsset(tx, payload);
        if (result.status != ResponseStatus.SUCCESS) {
          return Response.errorObject(
            JSON.parse(JSON.stringify([result.data])),
            result.status
          );
        }
        return Response.successObject(
          JSON.parse(JSON.stringify(result.data)),
          result.status
        );
      } else {
        Logger.error(` exchangeAssetInfo: Error in validation of exchangeAssetInfo = ${validationResponse}`);
        return Response.successObject(
          validationResponse.data,
          validationResponse.status
        );
      }
    } catch (error) {
      Logger.error(`exchangeAssetInfo: Error occurred in exchangeAssetInfo "${error}"`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during exchangeAssetInfo  ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Get asset detail
   * This function is used to get the details of a specific asset
   * @async
   * @param tx
   */
  async getAssetDetail(tx: Transaction) {
    Logger.info(`Called getAssetDetail`);
    try {
      const payload = JSON.parse(tx.payload);
      const asset: ResponseModel = await this.findAssetAsBytes(
        tx,
        payload.serialNumberCustomer
      );
      Logger.info(`getAssetDetail: asset = ${JSON.stringify(asset)}`);
      if (asset.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([asset.data])),
          asset.status
        );
      }
      return Response.successObject(JSON.parse(asset.data), asset.status);
    } catch (error) {
      Logger.error(`getAssetDetail: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during getAssetDetail ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Get asset event detail
   * This function is used to get the asset details with component key
   * @async
   * @param tx
   */
  async getAssetEventDetail(tx: Transaction) {
    Logger.info(`Called getAssetEventDetail`);
    try {
      const payload = JSON.parse(tx.payload);
      const asset: ResponseModel = await this.findAssetEventAsBytes(
        tx,
        payload.serialNumberCustomer
      );
      Logger.info(`getAssetEventDetail result = ${JSON.stringify(asset)}`);
      if (asset.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(
            JSON.stringify([
              `Asset with key "${payload.serialNumberCustomer}" not found.`
            ])
          ),
          asset.status
        );
      }
      return Response.successObject(JSON.parse(asset.data), asset.status);
    } catch (error) {
      Logger.error(` getPublicAssetDetail: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during getAssetEventDetail ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Get asset detail
   * This function is used to get the public information of an asset
   * @async
   * @param tx
   */
  async getPublicAssetDetail(tx: Transaction) {
    Logger.info(`Called: getPublicAssetDetail`);
    try {
      const payload = JSON.parse(tx.payload);
      const asset: ResponseModel = await this.findPublicAssetAsBytes(
        tx,
        payload.serialNumberCustomer
      );
      Logger.info(`getPublicAssetDetail asset: ${JSON.stringify(asset)}`);
      if (asset.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(
            JSON.stringify([
              `Asset with key "${payload.serialNumberCustomer}" not found.`
            ])
          ),
          asset.status
        );
      }
      return Response.successObject(JSON.parse(asset.data), 200);
    } catch (error) {
      Logger.error(`getPublicAssetDetail: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([`Error occurred during getPublicAssetDetail ${error}`])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   *
   *
   * Create Investigation
   * This function is used to create the investigation
   * @async
   * @param tx
   */
  async createInvestigationDetails(tx: Transaction) {
    Logger.info(`Called createInvestigationDetails`);
    try {
      const result = await createInvestigation(tx);
      Logger.info(`createInvestigation =  ${result}"`);
      return Response.successObject(JSON.parse(result), ResponseStatus.SUCCESS);
    } catch (error) {
      Logger.error(`createInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during createInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * getInvestigationPublicDetails
   * This function is used to get the public information of the investigation
   * @async
   * @param tx
   */

  async getPublicInvestigationDetails(tx: Transaction) {
    Logger.info(`Called getPublicInvestigationDetails`);
    try {
      const payload = JSON.parse(tx.payload);
      const { investigationID } = payload;
      const mspID = tx.msp;
      const result: ResponseModel = await getPublicInvestigation(
        tx,
        investigationID,
        mspID
      );
      Logger.info(`getPublicInvestigationDetails: result = ${JSON.stringify(result)}`);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      Logger.error(`getPublicInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during getPublicInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * encrypt data for investigation
   * This function is used to encrypt the details of an investigation
   * @async
   * @param tx
   */

  async encryptDataForInvestigationDetails(tx: Transaction) {
    Logger.info(`Called encryptDataForInvestigationDetails`);
    try {
      const payload = JSON.parse(tx.payload);
      const { investigationID, data, type } = payload;
      const mspID = tx.msp;
      const result: ResponseModel = await encryptDataForInvestigation(
        tx,
        investigationID,
        data,
        type,
        mspID
      );
      Logger.info(`encryptDataForInvestigationDetails result = ${JSON.stringify(result)}`);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      return Response.successObject(
        JSON.parse(JSON.stringify([result.data])),
        result.status
      );
    } catch (error) {
      Logger.error(`encryptDataForInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during encryptDataForInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * decrypt data for investigation
   * This function is used to decrypt any data of an investigation
   * @async
   * @param tx
   */

  async decryptDataForInvestigationDetails(tx: Transaction) {
    Logger.info(`Called decryptDataForInvestigationDetails`);
    try {
      const payload = JSON.parse(tx.payload);
      const { investigationID, data, type } = payload;
      const mspID = tx.msp;
      const result: ResponseModel = await decryptDataForInvestigation(
        tx,
        investigationID,
        data,
        type,
        mspID
      );
      Logger.info(`decryptDataForInvestigationDetails: result = ${JSON.stringify(result)}`);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      return Response.successObject(
        JSON.parse(JSON.stringify([result.data])),
        result.status
      );
    } catch (error) {
      Logger.error(`decryptDataForInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during decryptDataForInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * getInvestigationPrivateDetails
   * This function is used to get the private investigation details such as secret1,secret2
   * @async
   * @param tx
   */

  async getPrivateInvestigationDetails(tx: Transaction) {
    Logger.info(`Called getPrivateInvestigationDetails`);
    try {
      const payload = JSON.parse(tx.payload);
      const result: ResponseModel = await getPrivateInvestigation(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(
            JSON.stringify([
              `Investigation with key "${payload.investigationID}" not found.`
            ])
          ),
          result.status
        );
      }
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      Logger.error(`getPrivateInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during getPrivateInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * get All Investigation Details
   * This function is used to get all the investigation details of the org
   * @async
   * @param tx
   */

  async getAllInvestigationDetails(tx: Transaction) {
    Logger.info(`Called getAllInvestigationDetails`);
    try {
      const payload = JSON.parse(tx.payload);
      Logger.info(`getAllInvestigationDetails: investigation query : ${JSON.stringify(payload.query)}`);
      const investigation = await this.queryInvestigation(
        tx,
        JSON.stringify(payload.query)
      );
      const investigationAsString = JSON.stringify(investigation);
      Logger.info(`getAllInvestigationDetails: investigationAsString: ${investigationAsString}`);
      return Response.successObject(JSON.parse(investigationAsString), ResponseStatus.SUCCESS);
    } catch (error) {
      Logger.error(`getAllInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during getAllInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * add Organisation To Investigation Details
   * This function is used to add a new organisation to the investigation
   * @async
   * @param tx
   */

  async addOrganisationToInvestigationDetails(tx: Transaction) {
    Logger.info(`Called addOrganisationToInvestigationDetails`);
    try {
      const result = await addOrganisationToInvestigation(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      return Response.successObject(JSON.parse(result.data), ResponseStatus.SUCCESS);
    } catch (error) {
      Logger.error(`addOrganisationToInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during addOrganisationToInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * update Org Investigation Status Details
   * This function is used to update org status of an investigation
   * @async
   * @param tx
   */
  async updateOrgInvestigationStatusDetails(tx: Transaction) {
    Logger.info(`Called updateOrgInvestigationStatusDetails`);
    try {
      const result = await updateOrgInvestigationStatus(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      const { status, data } = result;
      return Response.successObject(JSON.parse(data), status);
    } catch (error) {
      Logger.error(`updateOrgInvestigationStatusDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during updateOrgInvestigationStatusDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * add SerialNumberCustomer
   * This function is used to add a serialNumberCustomer to the investigation
   * @async
   * @param tx
   */
  async addSerialNumberCustomerDetails(tx: Transaction) {
    Logger.info(`Called addSerialNumberCustomerDetails`);
    try {
      const result = await addSerialNumberCustomer(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      Logger.error(`addSerialNumberCustomerDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during addSerialNumberCustomerDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * share Investigation Key
   * This function is used to share the key2 with the participating org
   * @async
   * @param tx
   */
  async shareInvestigationKeyDetails(tx: Transaction) {
    Logger.info(`Called shareInvestigationKeyDetails`);
    try {
      const result = await shareInvestigationKey(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      return Response.successObject(JSON.parse(result.data), result.status);
    } catch (error) {
      Logger.error(`shareInvestigationKeyDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during shareInvestigationKeyDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * request Asset For Investigation
   * This function is used to share an asset details for an investigation
   * @async
   * @param tx
   */
  async requestAssetForInvestigationDetails(tx: Transaction) {
    Logger.info(`Called requestAssetForInvestigationDetails`);
    try {
      const result: ResponseModel = await requestAssetForInvestigation(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      const { status, data } = result;
      return Response.successObject(JSON.parse(data), status);
    } catch (error) {
      Logger.error(`requestAssetForInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during requestAssetForInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * exchange Asset For Investigation
   * @async
   * @param tx
   */
  async exchangeAssetForInvestigationDetails(tx: Transaction) {
    Logger.info(`Called exchangeAssetForInvestigationDetails`);
    try {
      const result: ResponseModel = await exchangeAssetForInvestigation(tx);
      if (result.status != ResponseStatus.SUCCESS) {
        return Response.errorObject(
          JSON.parse(JSON.stringify([result.data])),
          result.status
        );
      }
      const { status, data } = result;
      return Response.successObject(JSON.parse(JSON.stringify([data])), status);
    } catch (error) {
      Logger.error(`exchangeAssetForInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during exchangeAssetForInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * close Investigation
   * @async
   * @param tx
   */
  async closeInvestigationDetails(tx: Transaction) {
    Logger.info(`Called closeInvestigationDetails`);
    try {
      const payload = JSON.parse(tx.payload);
      const { investigationID } = payload;
      const result: ResponseModel = await closeInvestigation(
        tx,
        investigationID
      );
      const { status, data } = result;
      return Response.successObject(JSON.parse(JSON.stringify([data])), status);
    } catch (error) {
      Logger.error(`closeInvestigationDetails: error = ${JSON.stringify(error)}`);
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Error occurred during closeInvestigationDetails ${error}`
          ])
        ),
        ResponseStatus.ERROR
      );
    }
  }

  /**
   * Validate the asset details
   * @async
   * @param tx
   * @param isFunctionCall
   */
  async validateAssetDetails(tx: Transaction, isFunctionCall: boolean = false) {
    Logger.info(`Called validateAssetDetails`);
    const payload = JSON.parse(tx.payload);
    const asset = await this.findPublicAssetAsBytes(
      tx,
      payload.serialNumberCustomer
    );
    if (asset.status != ResponseStatus.SUCCESS) {
      return Response.errorObject(
        JSON.parse(JSON.stringify([asset.data])),
        asset.status
      );
    }
    Logger.info(`validateAssetDetails : assetAsString: "${asset.data}"`);
    const assetDetails = JSON.parse(asset.data);
    const validationResult = await validateAsset(
      assetDetails.componentSharedHash,
      payload
    );
    if (validationResult) {
      Logger.info(`Validation of parent component was successfull`);
      if (isFunctionCall === true) {
        Logger.info(`Returning true for validateAssetDetails `);
        return true;
      } else {
        return Response.successObject(
          JSON.parse(JSON.stringify({ result: true })),
          ResponseStatus.SUCCESS
        );
      }
    } else {
      Logger.info(`Validation of parent component failed`);
      if (isFunctionCall === true) {
        Logger.info(`Returning false for validateAssetDetails `);
        return false;
      } else {
        return Response.successObject(
          JSON.parse(JSON.stringify({ result: false })),
          ResponseStatus.SUCCESS
        );
      }
    }
  }

  /**
   * Get asset list
   * @async
   * @param tx
   */
  async getAssetList(tx: Transaction) {
    Logger.info(`Called getAssetList`);
    const payload = JSON.parse(tx.payload);
    const assets = await this.queryAssets(tx, payload.query);
    const assetsAsString = JSON.stringify(assets);
    Logger.info(`getAssetList: assetsAsString: ${assetsAsString}`);
    return Response.successObject(JSON.parse(assetsAsString), ResponseStatus.SUCCESS);
  }

  /**
   * Get asset history
   * @async
   * @param tx
   */
  async getAssetHistory(tx: Transaction) {
    Logger.info(`Called getAssetHistory`);
    const payload = JSON.parse(tx.payload);
    if (!(await this.isAssetStored(tx, payload.serialNumberCustomer))) {
      return Response.errorObject(
        JSON.parse(
          JSON.stringify([
            `Asset with key "${payload.serialNumberCustomer}" not found.`
          ])
        ),
        ResponseStatus.NOT_FOUND
      );
    }
    const results: string[] = [];
    const historyData = await tx.getTransactionHistory(
      payload.serialNumberCustomer
    );
    if (
      historyData.hasOwnProperty("response") &&
      historyData.response.hasOwnProperty("results")
    ) {
      for (let key in historyData.response.results) {
        const historyRecord = historyData.response.results[key].resultBytes
          .toString("utf8")
          .match(/{(.*)}/gm);
        if (historyRecord !== null) {
          results.push(JSON.parse(historyRecord));
        }
      }
    }
    const resultsAsString = JSON.stringify(results);
    Logger.info(`getAssetHistory : History data query results: ${resultsAsString}`);
    return Response.successObject(JSON.parse(resultsAsString), ResponseStatus.SUCCESS);
  }

  /**
   * Query assets
   * @async
   * @protected
   * @param tx
   * @param query
   */
  protected async queryAssets(tx: Transaction, query: string): Promise<Array<any>> {
    Logger.info(`Called queryAssets`);
    const results: string[] = [];
    // -- Test purpose only --
    const pageSize = 7;
    const bookmark = "";
    // --
    let collectionName = JSON.parse(tx.payload).collectionName;
    Logger.info(`queryAssets: Query data from collection "${collectionName}": begin -`);
    const queryData = await tx.queryPrivateData(
      collectionName,
      query,
      pageSize,
      bookmark
    );
    let proceed = true;
    while (proceed) {
      const record = await queryData.iterator.next();
      if (record.value && record.value.value) {
        const assetAsString = record.value.value.toString("utf8");
        results.push(JSON.parse(assetAsString));
      }
      if (record.done) {
        await queryData.iterator.close();
        proceed = false;
      }
    }
    Logger.info(`queryAssets: Query data from collection "${collectionName}": end -`);
    Logger.info(`queryAssets: Results: ${JSON.stringify(results)}`);
    return JSON.parse(JSON.stringify(results));
  }

  /**
   * Query Investigation
   * @async
   * @protected
   * @param tx
   * @param query
   */
  protected async queryInvestigation(tx: Transaction, query: string): Promise<Array<any>> {
    Logger.info(`Called queryInvestigation`);
    const results: string[] = [];
    // -- Test purpose only --
    const pageSize = 7;
    const bookmark = "";
    // --
    let collectionName = await tx.getOrgPrivateCollection(tx.msp);
    Logger.info(`queryInvestigation: Query data from collection "${collectionName}"`);
    const queryData = await tx.queryPrivateData(
      collectionName,
      query,
      pageSize,
      bookmark
    );
    let proceed = true;
    while (proceed) {
      const record = await queryData.iterator.next();
      console.warn(record);
      if (record.value && record.value.value) {
        const investigationAsString = record.value.value.toString("utf8");
        Logger.info(`queryInvestigation : investigationAsString: ${investigationAsString}`);
        results.push(JSON.parse(investigationAsString));
      }
      if (record.done) {
        await queryData.iterator.close();
        proceed = false;
      }
    }
    Logger.info(`queryInvestigation:  Query data from collection "${collectionName}": end -`);
    Logger.info(`queryInvestigation: Results: ${JSON.stringify(results)}`);
    return JSON.parse(JSON.stringify(results));
  }

  /**
   * Find asset as bytes
   * @async
   * @protected
   * @param tx
   * @param key
   */
  protected async findAssetAsBytes(tx: Transaction, key: string) {
    Logger.info(`Called findAssetAsBytes`);
    // Use the TAASMSP if the invoke identity belongs to TAAS org
    // TODO: implement support to handle multiple TAAS organisation, Thereby remove hardcoded TAAS Msp
    const mspID = tx.msp == "Taas" ? JSON.parse(tx.payload).taasmsp : tx.msp;
    const componentKey = await getHashOfHash(key + mspID);
    // Get the PDC collection name
    let collectionName = await tx.getOrgPrivateCollection(tx.msp);
    Logger.info(`findAssetAsBytes: Organisation collection name =  ${collectionName}`);
    // Get details of the asset from PDC
    let storedAsset = await tx.getPrivateState(collectionName, componentKey);
    // Asset details found in the PDC
    if (storedAsset.length > 0) {
      Logger.info(`findAssetAsBytes: Asset with key "${key}" found in collection: ${collectionName}`);
      return await returnFunction(
        storedAsset.toString("utf8"),
        ResponseStatus.SUCCESS
      );
    }
    // Asset details not found in the PDC
    Logger.info(`findAssetAsBytes: Asset with key "${key}" not found in collection: ${collectionName}.`);
    return await returnFunction(
      `Asset with key "${key}" not found in collection: ${collectionName}.`,
      ResponseStatus.NOT_FOUND
    );
  }

  /**
   * Find asset as bytes
   * @async
   * @protected
   * @param tx
   * @param key
   */
  protected async findAssetEventAsBytes(tx: Transaction, key: string) {
    Logger.info(`Called findAssetEventAsBytes`);
    let collectionName = await tx.getOrgPrivateCollection(tx.msp);
    Logger.info(`findAssetEventAsBytes: Organisation collection name = ${collectionName}`);
    let storedAsset = await tx.getPrivateState(collectionName, key);
    if (storedAsset.length > 0) {
      Logger.info(`findAssetEventAsBytes: Asset with key "${key}" found in collection: ${collectionName}`);
      return await returnFunction(
        storedAsset.toString("utf8"),
        ResponseStatus.SUCCESS
      );
    }
    Logger.info(`findAssetEventAsBytes: Asset with key "${key}" not found in collection: ${collectionName}.`);
    return await returnFunction(
      `Asset with key "${key}" not found in collection: ${collectionName}.`,
      ResponseStatus.NOT_FOUND
    );
  }

  /**
   * Find Public asset as bytes
   * @async
   * @protected
   * @param tx
   * @param key
   */
  protected async findPublicAssetAsBytes(tx: Transaction, key: string) {
    Logger.info(`Called  findPublicAssetAsBytes`);
    const componentKey = await getHash(key);
    let storedAsset = await tx.getPublicState(componentKey);
    if (storedAsset.length > 0) {
      Logger.info(`findPublicAssetAsBytes: Asset with key "${key}" found with details: ${storedAsset.toString()}`);
      return await returnFunction(
        storedAsset.toString("utf8"),
        ResponseStatus.SUCCESS
      );
    }
    Logger.info(`findPublicAssetAsBytes: Asset with key "${key}" not found.`);
    return await returnFunction(
      `Asset with key "${key}" not found.`,
      ResponseStatus.NOT_FOUND
    );
  }

  /**
   * Is asset stored
   * @async
   * @protected
   * @param tx
   * @param key
   */
  protected async isAssetStored(tx: Transaction, key: string) {
    Logger.info(`Called isAssetStored`);
    Logger.info(`isAssetStored: key = ${key}`);
    const storedAsset = await this.findAssetAsBytes(tx, key);
    if (storedAsset.status == ResponseStatus.NOT_FOUND) {
      return false;
    }
    return true;
  }

  /**
   * Prepare changelog object
   * @protected
   * @param currentAsset
   * @param updatedAsset
   */
  protected prepareChangelog(currentAsset: any, updatedAsset: any) {
    let propertyName;
    let propertyOldValue;
    let propertyNewValue;

    // Change of quality status
    if (currentAsset.qualityStatus !== updatedAsset.qualityStatus) {
      propertyName = "QualityStatus";
      propertyOldValue = currentAsset.qualityStatus;
      propertyNewValue = updatedAsset.qualityStatus;
    }
    // Change of children components
    else if (
      !Comparator.compareObjects(
        currentAsset.componentsSerialNumbers,
        updatedAsset.componentsSerialNumbers
      )
    ) {
      propertyName = "ComponentsSerialNumbers";
      propertyOldValue = currentAsset.componentsSerialNumbers.join(", ");
      propertyNewValue = updatedAsset.componentsSerialNumbers.join(", ");
    }

    if (propertyName) {
      return {
        propertyName: propertyName,
        propertyOldValue: propertyOldValue,
        propertyNewValue: propertyNewValue
      };
    } else {
      return null;
    }
  }

  /**
   * Get current timestamp
   * @protected
   */
  protected getCurrentTimestamp() {
    const date = new Date();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const secs = date.getUTCSeconds();

    const timestampString =
      date.getUTCFullYear() +
      "-" +
      (month < 10 ? "0" : "") +
      month +
      "-" +
      (day < 10 ? "0" : "") +
      day +
      " " +
      (hours < 10 ? "0" : "") +
      hours +
      ":" +
      (minutes < 10 ? "0" : "") +
      minutes +
      ":" +
      (secs < 10 ? "0" : "") +
      secs;

    return timestampString;
  }
}
