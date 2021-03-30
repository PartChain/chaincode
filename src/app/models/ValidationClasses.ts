
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
 * Asset class validation model
 * @class AssetClass validation model
 * @export AssetClassValidation
 */

import {Length} from "class-validator";

export default class AssetClassValidation {

    @Length(0, 100)
    manufacturer: string;
    @Length(0, 100)
    productionCountryCodeManufacturer: string;
    @Length(0, 100)
    partNameManufacturer: string;
    @Length(0, 100)
    partNumberManufacturer: string;
    @Length(0, 100)
    partNumberCustomer?: string;
    @Length(0, 500)
    serialNumberManufacturer:string
    @Length(0, 500)
    serialNumberCustomer: string;
    @Length(0, 100)
    qualityStatus: string;
    @Length(0, 100)
    status: string;
    @Length(0, 100)
    productionDateGmt: string;
    @Length(0, 100)
    serialNumberType: string;
 
}



/**
 * Exchange Class
 * @class ExchangeClass
 * @export ExchangeClass
 */

export class ExchangeClass {

    @Length(0, 100)
    manufacturer: string;
    @Length(0, 100)
    productionCountryCodeManufacturer: string;
    @Length(0, 100)
    partNameManufacturer: string;
    @Length(0, 100)
    partNumberManufacturer: string;
    @Length(0, 100)
    partNumberCustomer?: string;
    @Length(0, 500)
    serialNumberManufacturer: string;
    @Length(0, 500)
    serialNumberCustomer?: string;
    @Length(0, 100)
    qualityStatus: string;
    @Length(0, 100)
    serialNumberType: string;
    @Length(0, 100)
    status: string;
    @Length(0, 100)
    productionDateGmt: string;
}


/**
 * 
 * @class InvestigationClass
 * @export InvestigationClass
 */

export class InvestigationClass {
    @Length(0, 100)
    message: string;
    @Length(0, 100)
    secret1: string;
    @Length(0, 100)
    secret2: string;
    @Length(0, 100)
    type: string;
    @Length(0, 100)
    iv: string;
    @Length(0, 100)
    investigationID:string
}

/**
 * 
 * @class AddOrgToInvestigationClass
 * @export AddOrgToInvestigationClass
 */

export class AddOrgToInvestigationClass {
    @Length(0, 100)
    investigationID: string;
    @Length(0, 100)
    secret1: string;
    @Length(0, 100)
    targetOrg: string;
    @Length(0, 100)
    iv: string;
}


