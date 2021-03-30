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

import { validateOrReject } from "class-validator";
import Logger from "../logger/Logger";
/**
 * 
 * Validate input object
 * @static
 * @async
 * @param input // Object to validate
 */
export default async function validatePayload(input: any) {
    let inCorrectProperties = [] as string[]
    try {
        await validateOrReject(input);
        return true;
    } catch (errors) {
        Logger.error(`Caught promise rejection (validation failed). Errors: ${errors}`)
        let error:Object;
        errors.forEach((item:any) => {
        Logger.error(` Errors in properties: ${item.property}`)
            error = {property:item.property,constraints:item.constraints}
            inCorrectProperties.push(JSON.stringify(error))
          })
        return inCorrectProperties;
    }
}

