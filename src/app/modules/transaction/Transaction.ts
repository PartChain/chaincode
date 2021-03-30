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

import Config from './../config/Config';
import Identity from './../identity/Identity';
import Logger from './../logger/Logger';


/**
 * @class Transaction
 * @export Transaction
 */
export default class Transaction {

    /**
     * Identity
     * @type any
     */
    public identity: any;

    /**
     * Configuration
     * @type Config
     */
    protected config: Config;

    /**
     * Stub object
     * @type any
     */
    protected stub: any;

    /**
     * TX Arguments
     * @type Array<string>
     */
    protected args: Array<string>;

    /**
     * @constructor Transaction
     * @param ctx
     */
    constructor(ctx: any) {
        //this.config = new Config('./resources/config.json', './resources/keyfiles');
        this.stub = ctx.stub ? ctx.stub : undefined;
        this.args = ctx.stub.getArgs();
        
        this.identity = new Identity(ctx.clientIdentity);
        Logger.info(`ARGS: ${JSON.stringify(this.args)}`);
    }

    /** 
     * Get configuration map object
     */
    get configMap() {
        Logger.info(`Get configMap for MSP ${this.identity.msp}`);
        return this.config.getConfig(this.identity.msp);
    }

   

    /**
     * Get get  private data collection name
     */
    /*get getPrivateCollection() {
        return this.configMap.hasOwnProperty("collection_name")
            ? this.configMap.collection_name
            : "";
    }*/

   
    

    /**
     * Get TX ID
     */
    get id() {
        return this.stub.getTxID();
    }

    /**
     * Get TX Timestamp
     */
    get timestamp() {
        return this.stub.getTxTimestamp();
    }

    /**
     * Get TX channel
     */
    get channel() {
        return this.stub.getChannelID();
    }

    /**
     * Get TX Chaincode ID
     */
    get chaincodeID() {
        return `partchaincc${this.channel.substr(0, 1).toLowerCase()}`;
    }

    /**
     * Get stubs TX creator
     */
    get creator() {
        return this.stub.getCreator();
    }

    /**
     * Get creator MSP ID
     */
    get msp() {
       // return this.creator.mspid ? this.creator.mspid : undefined;
       Logger.info(`Caller MSPID = ${this.identity.msp}`)
       return this.identity.msp;
    }

    /**
     * Get TX Proposal
     */
    get proposal() {
        return this.stub.getProposal();
    }

    /**
     * Get TX payload
     */
    get payload() {
        return this.args[2] ? this.args[2] : undefined;
    }

    /**
     * Get called function
     */
    get fcn() {
        return this.fcnAndParams && this.fcnAndParams.fcn
            ? this.fcnAndParams.fcn
            : undefined;
    }

    /**
     * Get called function parameters
     */
    get params() {
        return this.fcnAndParams && this.fcnAndParams.params
            ? this.fcnAndParams.params
            : undefined;
    }

    /**
     * Get called function and parameters
     */
    get fcnAndParams() {
        return this.stub.getFunctionAndParameters();
    }

    /**
     * Get private data collection name of the org
     * @async
     * @param msp 
     */
    async getOrgConfig(msp:string) {
        Logger.info(`Get configMap for MSP ${msp}`);
        return this.config.getConfig(msp);
    }
    
    /**
     * Get get  private data collection name
     * 
     * @async
     * @param msp 
     */
    async getOrgPrivateCollection(msp:string) {
        const mspID = msp.includes("Taas") ? "Taas" : msp;
        const collection_name = "_implicit_org_"+mspID
        return collection_name
    }

    /**
     * Set public state based on given key
     * @async
     * @param key
     * @param state
     */
    async putPublicState(key: string, state: any) {
        return await this.stub.putState(key, state);
    }

    /**
     * Set private state based on given key and collection
     * @async
     * @param collection
     * @param key
     * @param state 
     */
    async putPrivateState(collection: string, key: string, state: any) {
        return await this.stub.putPrivateData(collection, key, state);

    }

    /**
     * Set emit event
     * @async
     * @param event_name // Event name 
     * @param state // data to emit
     */
    async emitEvent(event_name: string, state: any) {
        return await this.stub.setEvent(event_name,state);
        
    }

    /**
     * Get public state based on given key
     * @async
     * @param key
     */
    async getPublicState(key: string) {
        return await this.stub.getState(key);
    }

    /**
     * Get private state based on given key and collection
     * @async
     * @param collection
     * @param key
     */
    async getPrivateState(collection: string, key: string) {
        return await this.stub.getPrivateData(collection, key);
    }

    /**
     * Get private state hash based on given key and collection
     * @async
     * @param collection
     * @param key
     */
    async getPrivateStateHash(collection: string, key: string) {
        return await this.stub.getPrivateDataHash(collection, key);
    }

    /**
     * Query public data
     * @async
     * @param query
     * @param pageSize
     * @param bookmark
     */
    async queryPublicData(query: string, pageSize: number = 0, bookmark: string = '') {
        return pageSize === 0
            ? await this.stub.getQueryResult(query)
            : await this.stub.getQueryResultWithPagination(query, pageSize, bookmark);
    }

    /**
     * Query private data based on given collection
     * @async
     * @param collection
     * @param query
     * @param pageSize
     * @param bookmark
     */
    async queryPrivateData(collection: string, query: string, pageSize: number = 0, bookmark: string = '') {
        return await this.stub.getPrivateDataQueryResult(collection, query)
    }

    /**
     * Invoke chaincode
     * @async
     * @param chaincodeID
     * @param channelID
     * @param functionName
     * @param functionArgs
     */
    async invokeChaincode(chaincodeID: string, channelID: string, functionName: string, functionArgs: string[]) {
        const args = functionArgs;
        args.unshift(functionName);
        Logger.info(`Execute stub.invokeChaincode with ccID "${chaincodeID}", args "${args.toString()}" and channelID "${channelID}"`)

        return await this.stub.invokeChaincode(chaincodeID, args, channelID);
    }

    /**
     * Get history of transaction by given key
     * @async
     * @param key
     */
    async getTransactionHistory(key: string) {
        return await this.stub.getHistoryForKey(key);
    }


    /**
     * Get transient data
     * @async
     */
    async getTransientData() {
        // get the transient map
        var MAP = this.stub.getTransient();
        var result = JSON.parse(MAP.get("privatePayload").toString('utf8'))
        Logger.info(`Transient data = ${result}`);
        return result
    }
}
