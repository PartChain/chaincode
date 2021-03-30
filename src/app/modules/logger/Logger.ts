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

import * as log4js from 'log4js';

/**
 * @class Logger
 * @export Logger
 */
class Logger {

    /**
     * LOG4JS instance
     */
    log: any;

    /**
     * @constructor Logger
     */
    constructor() {
        this.log = Logger.getLogger();
        this.level = 'debug';
    }

    /**
     * Set log level
     * @param level
     */
    set level(level: string) {
        this.log.level = level;
    }

    /**
     * Get logger instance with given name
     * @param name
     */
    static getLogger(name: string = null) {
        return log4js.getLogger(name);
    }

    /**
     * Apply configuration
     * @static
     * @param config
     */
    static applyConfig(config: any) {
        return log4js.configure(config);
    }

    /**
     * Trace
     * @param message
     */
    trace(message: string) {
        this.log.trace(message);
    }

    /**
     * Debug level message
     * @param message
     */
    debug(message: string) {
        this.log.debug(message);
    }

    /**
     * Info level message
     * @param message
     */
    info(message: string) {
        this.log.info(message);
    }

    /**
     * Warning level message
     * @param message
     */
    warn(message: string) {
        this.log.warn(message);
    }

    /**
     * Error level message
     * @param message
     */
    error(message: string) {
        this.log.error(message);
    }

    /**
     * Fatal error level message
     * @param message
     */
    fatal(message: string) {
        this.log.fatal(message);
    }

}

/**
 * @export Logger
 */
export default new Logger;
