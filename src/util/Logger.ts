export class Logger {
  // Always enabled, when something broke and recovery is not possible
  public static error(classObject: any, message: any) {
    console.error(`${classObject.constructor.name}: `, message);
  }
  // Always enabled, when something didn't break but might be a user mistake or an unexpected situation
  public static warn(classObject: any, message: any) {
    console.warn(`${classObject.constructor.name}: `, message);
  }
  // Always enabled, should only be for important messages
  public static info(classObject: any, message: any) {
    console.info(`${classObject.constructor.name}: `, message);
  }
  // Only enabled during development, verbose mode
  public static debug(classObject: any, message: any) {
    console.debug(`${classObject.constructor.name}: `, message);
  }
}
