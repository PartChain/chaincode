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
 * Quality documents
 *
 * @export
 * @interface QualityDocuments
 */
export interface QualityDocuments {
  documentHash: string;
  documentUri: string;
}

/**
 * Asset interface
 * @interface AssetModel
 * @export AssetModel
 */
export interface AssetModel {
  docType?: string;
  manufacturer: string;
  productionCountryCodeManufacturer: string;
  partNameManufacturer: string;
  partNumberManufacturer: string;
  partNumberCustomer?: string;
  serialNumberManufacturer: string;
  serialNumberCustomer?: string;
  qualityStatus: string;
  qualityHash?: string;
  componentsSerialNumbers?: string[];
  status: string;
  productionDateGmt: string;
}

/**
 * ChildSerialNumberCustomer
 *
 * @export
 * @interface ChildSerialNumberCustomer
 */
export interface ChildSerialNumberCustomer {
  serialNumberCustomer: string;
  flagged: boolean;
}

/**
 * Request Asset Model
 *
 * @export
 * @interface RequestAssetModel
 * @extends {ChildSerialNumberCustomer}
 */
export interface RequestAssetModel extends ChildSerialNumberCustomer {
  manufacturerMSPID: string;
  manufacturer: string;
  productionCountryCodeManufacturer: string;
  partNameManufacturer: string;
  partNumberManufacturer: string;
  partNumberCustomer: string;
  serialNumberManufacturer: string;
  serialNumberCustomer: string;
  qualityStatus: string;
  qualityHash: string;
  childSerialNumberCustomer: ChildSerialNumberCustomer[];
  status: string;
  productionDateGmt: string;
  manufacturerPlant: string;
  manufacturerLine: string;
  serialNumberType: string;
  qualityDocuments: QualityDocuments[];
  customFields: JSON;
  taasmsp?: string;
}

/**
 * Exchange Asset Model
 *
 * @export
 * @interface ExchangeAssetModel
 */
export interface ExchangeAssetModel {
  parentMSP: string;
  manufacturer: string;
  productionCountryCodeManufacturer: string;
  partNameManufacturer: string;
  partNumberManufacturer: string;
  partNumberCustomer: string;
  serialNumberManufacturer: string;
  serialNumberCustomer: string;
  qualityStatus: string;
  qualityHash: string;
  childSerialNumberCustomer: ChildSerialNumberCustomer[];
  status: string;
  productionDateGmt: string;
  manufacturerPlant: string;
  manufacturerLine: string;
  serialNumberType: string;
  qualityDocuments: QualityDocuments[];
  customFields: JSON;
}

/**
 * Asset hash Verification Model
 *
 * @export
 * @interface AssetHashVerificationModel
 */
export interface AssetHashVerificationModel {
  manufacturer: string;
  productionCountryCodeManufacturer: string;
  partNameManufacturer: string;
  partNumberManufacturer: string;
  partNumberCustomer: string;
  serialNumberType: string;
  serialNumberManufacturer: string;
  serialNumberCustomer: string;
  qualityStatus: string;
  status: string;
  productionDateGmt: string;
  qualityDocuments: QualityDocuments[];
  manufacturerPlant: string;
  manufacturerLine: string;
  customFields: JSON;
}
