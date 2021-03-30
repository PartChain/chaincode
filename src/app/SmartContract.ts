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

import { Contract } from "fabric-contract-api";
import PartChain from "./PartChain";
import Logger from "./modules/logger/Logger";
import Transaction from "./modules/transaction/Transaction";

/**
 * Implementation of Part Chain Smart Contract class
 * @class PartChainSmartContract
 * @extends Contract
 * @export PartChainSMartContract
 */
export default class PartChainSmartContract extends Contract {
  /**
   * Chain code instance
   *
   * @type {PartChain}
   * @memberof PartChainSmartContract
   */
  ccInstance: PartChain;

  /**
   * @constructor PartChainSmartContract
   */
  constructor() {
    super("PartChainSmartContract");
    this.ccInstance = new PartChain();
  }

  /**
   * Unknown transaction handling
   * @async
   * @param ctx
   */
  async unknownTransaction(ctx: any) {
    throw new Error("An unknown transaction has been called");
  }

  /**
   * Before transaction Smart Contract lifecycle hook
   * @async
   * @param ctx
   */
  async beforeTransaction(ctx: any) {
    const tx = this.tx(ctx);
    Logger.info(`Transaction with ID "${tx.id}" has started.`);
  }

  /**
   * After transaction Smart Contract lifecycle hook
   * @async
   * @param ctx
   * @param result
   */
  async afterTransaction(ctx: any, result: any) {
    const tx = this.tx(ctx);
    Logger.info(`Transaction with ID "${tx.id}" finished.`);
    Logger.info(`With result: ${result}`);
  }

  /**
   * Init TX callback
   * @async
   * @param ctx
   */
  async init(ctx: any) {
    Logger.info("Initialization of Smart contract was executed!");
    Logger.info(`ChannelID: "${ctx.stub.getChannelID()}"`);
  }

  /**
   * Enroll an org
   * @async
   * @param ctx
   */
  async enrollOrg(ctx: any) {
    return await this.ccInstance.enrollOrganisation(this.tx(ctx));
  }

  /**
   * Get org details
   * @async
   * @param ctx
   */
  async getOrgDetails(ctx: any) {
    return await this.ccInstance.getOrganisationDetails(this.tx(ctx));
  }

  /**
   * Create Request
   * @async
   * @param ctx
   */
  async createRequest(ctx: any) {
    return await this.ccInstance.createAccessRequest(this.tx(ctx));
  }
  /**
   * Update Request
   * @async
   * @param ctx
   */
  async updateRequest(ctx: any) {
    return await this.ccInstance.updateAccessRequest(this.tx(ctx));
  }

  /**
   * Create an asset
   * @async
   * @param ctx
   */
  async createAsset(ctx: any) {
    return await this.ccInstance.createAsset(this.tx(ctx));
  }

  /**
   * Is asset current
   * @async
   * @param ctx
   */
  async isAssetCurrent(ctx: any) {
    return await this.ccInstance.isAssetCurrent(this.tx(ctx));
  }

  /**
   * Update asset
   * @async
   * @param ctx
   */
  async updateAsset(ctx: any) {
    return await this.ccInstance.updateAsset(this.tx(ctx));
  }

  /**
   * Request  asset details
   * @async
   * @param ctx
   */
  async requestAsset(ctx: any) {
    return await this.ccInstance.requestAsset(this.tx(ctx));
  }

  /**
   * Exchange asset information
   * @async
   * @param ctx
   */
  async exchangeAssetInfo(ctx: any) {
    return await this.ccInstance.exchangeAssetInfo(this.tx(ctx));
  }
  /**
   * Get asset detail
   * @async
   * @param ctx
   */
  async getAssetDetail(ctx: any) {
    return await this.ccInstance.getAssetDetail(this.tx(ctx));
  }
  /**
   * Get asset detail for events
   * @async
   * @param ctx
   */
  async getAssetEventDetail(ctx: any) {
    return await this.ccInstance.getAssetEventDetail(this.tx(ctx));
  }
  /**
   * Get asset detail
   * @async
   * @param ctx
   */
  async getPublicAssetDetail(ctx: any) {
    return await this.ccInstance.getPublicAssetDetail(this.tx(ctx));
  }

  /**
   * Get asset list
   * @async
   * @param ctx
   */
  async getAssetList(ctx: any) {
    return await this.ccInstance.getAssetList(this.tx(ctx));
  }

  /**
   * Validate asset
   * @async
   * @param ctx
   */
  async validateAsset(ctx: any) {
    return await this.ccInstance.validateAssetDetails(this.tx(ctx));
  }

  /**
   * Get asset history
   * @async
   * @param ctx
   */
  async getAssetHistory(ctx: any) {
    return await this.ccInstance.getAssetHistory(this.tx(ctx));
  }

  /**
   * Create Investigation
   * @async
   * @param ctx
   */
  async createInvestigation(ctx: any) {
    return await this.ccInstance.createInvestigationDetails(this.tx(ctx));
  }

  /**
   * Close Investigation
   * @async
   * @param ctx
   */
  async closeInvestigation(ctx: any) {
    return await this.ccInstance.closeInvestigationDetails(this.tx(ctx));
  }

  /**
   * Get Public Investigation
   * @async
   * @param ctx
   */
  async getPublicInvestigation(ctx: any) {
    return await this.ccInstance.getPublicInvestigationDetails(this.tx(ctx));
  }

  /**
   * Get Private Investigation
   * @async
   * @param ctx
   */
  async getPrivateInvestigation(ctx: any) {
    return await this.ccInstance.getPrivateInvestigationDetails(this.tx(ctx));
  }


  /**
   * 
   * @param ctx 
   */
  async getAllInvestigation(ctx: any) {
    return await this.ccInstance.getAllInvestigationDetails(this.tx(ctx));
  }

  /**
   * add Organisation To Investigation
   * @async
   * @param ctx
   */
  async addOrganisationToInvestigation(ctx: any) {
    return await this.ccInstance.addOrganisationToInvestigationDetails(
      this.tx(ctx)
    );
  }


  /**
   * update Org Investigation Status
   * @async
   * @param ctx
   */
  async updateOrgInvestigationStatus(ctx: any) {
    return await this.ccInstance.updateOrgInvestigationStatusDetails(
      this.tx(ctx)
    );
  }


  /**
   * add SerialNumberCustomer
   * @async
   * @param ctx
   */
  async addSerialNumberCustomer(ctx: any) {
    return await this.ccInstance.addSerialNumberCustomerDetails(
      this.tx(ctx)
    );
  }


  /**
   * share Investigation Key
   * @async
   * @param ctx
   */
  async shareInvestigationKey(ctx: any) {
    return await this.ccInstance.shareInvestigationKeyDetails(
      this.tx(ctx)
    );
  }

  /**
   * request asset for investigation
   * @async
   * @param ctx
   */
  async requestAssetForInvestigation(ctx: any) {
    return await this.ccInstance.requestAssetForInvestigationDetails(
      this.tx(ctx)
    );
  }


  /**
   * exchange asset for investigation
   * @async
   * @param ctx
   */
  async exchangeAssetForInvestigation(ctx: any) {
    return await this.ccInstance.exchangeAssetForInvestigationDetails(
      this.tx(ctx)
    );
  }


  /**
   * decrypt data for investigation
   * @async
   * @param ctx
   */
  async decryptDataForInvestigation(ctx: any) {
    return await this.ccInstance.decryptDataForInvestigationDetails(
      this.tx(ctx)
    );
  }



  /**
   * encrypt data for investigation
   * @async
   * @param ctx
   */
  async encryptDataForInvestigation(ctx: any) {
    return await this.ccInstance.encryptDataForInvestigationDetails(
      this.tx(ctx)
    );
  }
  /**
   * Create transaction instance
   * @async
   * @param ctx
   */
  protected tx(ctx: any) {
    return new Transaction(ctx);
  }
}
