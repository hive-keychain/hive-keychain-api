/* istanbul ignore file */

import moment from 'moment';
import winston from 'winston';

const timestampFormat = winston.format.timestamp({
  format: `[${moment().format('L') + ' ' + moment().format('HH:mm:ss')}]`,
});

const logFormat = winston.format.printf((info) => {
  return `[${info.timestamp}][${info.level}] ${info.message}`;
});

const colorFormat = winston.format.colorize({
  level: true,
  colors: {
    INFO: 'blue',
    ERROR: 'red',
    OPERATION: 'green',
    TECHNICAL: 'cyan',
    DEBUG: 'magenta',
    WARN: 'yellow',
  },
});

export const LoggerFormats = {
  timestampFormat,
  logFormat,
  colorFormat,
};
