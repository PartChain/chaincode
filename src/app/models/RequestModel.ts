
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
 * @export
 * @interface RequestHistoryModel
 */

export interface RequestHistoryModel {
    status: string;
    timestamp: string;
    changedBy: string;
    comment: string;
}


/**
 * @export
 * @interface RequestModel
 */
export interface RequestModel extends RequestHistoryModel {
    entities: string[];
    status: string;
    timestamp: string;
    changedBy: string;
    comment: string;
    history?: RequestHistoryModel[]
}


/**
 * @export
 * @interface OrgModel
 */

export interface OrgModel  extends RequestModel {
    owner: string
    ACL: Object

}

