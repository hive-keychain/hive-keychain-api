/* istanbul ignore file */

import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Config } from '../config';
import { LoggerFormats } from './formats';

const fileRotationTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(Config.logger.folder, Config.logger.file),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7',
  format: winston.format.combine(
    LoggerFormats.timestampFormat,
    LoggerFormats.logFormat,
  ),
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    LoggerFormats.timestampFormat,
    LoggerFormats.colorFormat,
    LoggerFormats.logFormat,
  ),
});

export const LoggerTransports = {
  consoleTransport,
  fileRotationTransport,
};
