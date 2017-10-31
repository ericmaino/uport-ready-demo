
import winston = require('winston');
import appInsights = require('applicationinsights');
import winstonAiLogger = require('winston-azure-application-insights');

export class LoggingConfiguration {
    public static initialize(APPLICATION_INSIGHTS_KEY) {
        
          winston.setLevels({
            trace: 9,
            input: 8,
            verbose: 7,
            prompt: 6,
            debug: 5,
            info: 4,
            data: 3,
            help: 2,
            warn: 1,
            error: 0
          });
        
          winston.addColors({
            trace: 'magenta',
            input: 'grey',
            verbose: 'cyan',
            prompt: 'grey',
            debug: 'blue',
            info: 'green',
            data: 'grey',
            help: 'cyan',
            warn: 'yellow',
            error: 'red'
          });
          winston.remove(winston.transports.Console);
          winston.add(winston.transports.Console, {
            level: 'trace',
            prettyPrint: true,
            colorize: true,
            silent: false,
            timestamp: false
          });
        
          if (APPLICATION_INSIGHTS_KEY) {
            appInsights.setup(APPLICATION_INSIGHTS_KEY)
              .setAutoDependencyCorrelation(false)
              .setAutoCollectRequests(false)
              .setAutoCollectPerformance(true)
              .setAutoCollectExceptions(true)
              .setAutoCollectDependencies(true)
              .setAutoCollectConsole(true)
              .start();
        
            var client = appInsights.defaultClient;
            client.config.maxBatchIntervalMs = 2500;
        
            var aiConfig = {
              client: client,
              insights: appInsights,
              level: process.env.APPLICATION_INSIGHTS_LOG_LEVEL || 'debug',
              treatErrorsAsExceptions: true
            };
        
            winston.info(`Sending data to Application Insights`);
            winston.add(winstonAiLogger.AzureApplicationInsightsLogger, aiConfig);
          }
        
          winston.warn('log level set to %s', winston.level);
        }
}