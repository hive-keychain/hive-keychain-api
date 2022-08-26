/* eslint-disable */
/* istanbul ignore file */

import * as winston from 'winston';
import { Config } from '../config';
import { LoggerTransports } from './transports';

const winstonLogger = winston.createLogger({
  levels: Config.logger.levels,
  level: 'DEBUG',
  transports: [
    LoggerTransports.fileRotationTransport,
    LoggerTransports.consoleTransport,
  ],
}) as winston.Logger &
  Record<keyof typeof Config.logger['levels'], winston.LeveledLogMethod>;

const info = (message: string) => {
  if (process.env.NODE_ENV === 'TEST') return;
  winstonLogger.log('INFO', message);
};

const debug = (message: string) => {
  if (process.env.NODE_ENV === 'TEST') return;
  if (process.env.DEBUG) {
    winstonLogger.log('DEBUG', message);
  }
};

const operation = (message: string) => {
  if (process.env.NODE_ENV === 'TEST') return;
  winstonLogger.log('OPERATION', message);
};

const warn = (message: string) => {
  if (process.env.NODE_ENV === 'TEST') return;
  winstonLogger.log('WARN', message);
};

const technical = (message: string) => {
  if (process.env.NODE_ENV === 'TEST') return;
  winstonLogger.log('TECHNICAL', message);
};

const error = (message: any, stacktrace?: Error) => {
  if (process.env.NODE_ENV === 'TEST') return;
  winstonLogger.log('ERROR', `${message}`);
  if (stacktrace)
    winstonLogger.log('ERROR', stacktrace.message + '\r\n' + stacktrace.stack);
};

const Logger = { info, warn, error, technical, operation, debug };

export default Logger;
