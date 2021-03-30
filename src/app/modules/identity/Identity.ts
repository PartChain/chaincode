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
 * Identity wrapper class
 * @class Identity
 * @export Identity
 */
export default class Identity {

    /**
     * Identity
     * @protected
     * @type any
     */
    protected identity: any;

    /**
     * @constructor Identity
     * @param identity
     */
    constructor(identity: any) {
        this.identity = identity;
    }

    /**
     * Get Identity ID
     */
    get id() {
        return this.identity.getID();
    }

    /**
     * Get Identity Membership Service Provider
     */
    get msp() {
        return this.identity.getMSPID()
    }

    /**
     * Get Identity X509 certificate
     */
    get x509() {
        return this.identity.getX509Certificate();
    }

}
