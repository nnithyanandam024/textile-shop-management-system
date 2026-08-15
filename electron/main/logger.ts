import log from 'electron-log';
import path from 'path';
import { app } from 'electron';

export function setupLogger() {
  log.transports.file.resolvePathFn = () => {
    return path.join(app.getPath('userData'), 'logs', 'app.log');
  };
  
  log.transports.file.level = 'info';
  log.transports.console.level = 'debug';

  log.info('====================================================');
  log.info(`Textile Shop Management System v${app.getVersion() || '0.1.0'} Starting`);
  log.info(`UserData Path: ${app.getPath('userData')}`);
  log.info(`Platform: ${process.platform} (${process.arch})`);
  log.info('====================================================');

  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception in Main Process:', error);
  });

  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled Rejection in Main Process:', reason);
  });

  return log;
}

export default log;
