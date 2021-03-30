

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

import {QualityDocuments} from './AssetModel'
/**
 * Exchange Class
 * @class ExchangeClass
 * @export ExchangeClass
 */

export default class ExchangeClass {

    encrypted: string; 
    manufacturer: string;
    productionCountryCodeManufacturer: string;
    partNameManufacturer: string;
    partNumberManufacturer: string;
    partNumberCustomer?: string;
    serialNumberManufacturer: string;
    serialNumberCustomerHash: string;
    componentKey: string;
    serialNumberCustomer?: string;
    qualityStatus: string;
    serialNumberType: string;
    componentsSerialNumbers?: string[];
    status: string;
    productionDateGmt: string;
    mspID: string;
    childSerialNumberCustomer:string[]
    manufacturerPlant :string;
    manufacturerLine :string;
    qualityDocuments :QualityDocuments[];
    customFields :JSON;
 
}