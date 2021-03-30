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

import AssetClassValidation from "./ValidationClasses";
import { ChildSerialNumberCustomer, QualityDocuments } from "./AssetModel";

/**
 * Asset class
 * @class AssetClassModel
 * @export AssetClassModel
 */

export class AssetClassModel extends AssetClassValidation {
  serialNumberCustomerHash: string;
  componentKey: string;
  componentsSerialNumbers?: string[];
  mspID: string;
  qualityDocuments?: QualityDocuments[];
  manufacturerPlant?: string;
  manufacturerLine?: string;
  customFields?: JSON;
}

/**
 * RequestAsset Class Model
 *
 * @export
 * @class RequestAssetClassModel
 * @extends {AssetClassValidation}
 */
export class RequestAssetClassModel extends AssetClassValidation {
  serialNumberCustomerHash: string;
  componentKey: string;
  mspID: string;
  childSerialNumberCustomer: ChildSerialNumberCustomer[];
  manufacturerPlant: string;
  manufacturerLine: string;
  serialNumberType: string;
  qualityDocuments: QualityDocuments[];
  customFields: JSON;
  constructor() {
    super();
    this.childSerialNumberCustomer = [];
  }
}
