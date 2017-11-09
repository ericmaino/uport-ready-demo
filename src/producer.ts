import winston = require('winston');

import { LoggingConfiguration } from './modules/LoggingConfiguration';

class Program {
    public static async Run() {
        LoggingConfiguration.initialize(null);
    }
}

Program.Run()
    .catch(err => winston.error(err));
