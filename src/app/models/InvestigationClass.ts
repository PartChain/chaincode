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

import { InvestigationModel, ParticipatingOrgsModel } from "./InvestigationModel";

/**
 * Investigation class
 * @class InvestigationPublicClass
 * @export InvestigationPublicClass
 */

export class InvestigationPublicClass implements InvestigationModel {
	investigationID: string;
	entities: string[];
	participatingOrgs: { [key: string]: Object };
	creator: string;
	status: string;
	description: string;
	title: string;
	assetsUnderInvestigation: Object;
	type: string;
	timestamp: string;
	timestampClose: string;
	constructor() {
		this.entities = [];
	}
}
/**
 * Investigation class
 * @class InvestigationPrivateClass
 * @export InvestigationPrivateClass
 */

export class InvestigationPrivateClass {
	investigationID: string;
	secret1: string;
	secret2: string;
	type: string;
	iv: string;
	docType: string;
}

/**
 *
 *
 * @export
 * @class participatingOrgsClass
 * @implements {ParticipatingOrgsModel}
 */
export class ParticipatingOrgsClass implements ParticipatingOrgsModel {
	mspID: string;
	status: string;
	timestamp: string;
	componentsSerialNumbers: string[];
	constructor() {
		this.componentsSerialNumbers = [];
	}
}
