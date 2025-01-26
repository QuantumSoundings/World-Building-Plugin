import { WBNote } from "src/world/notes/wbNote";

export class Logger {
  // Always enabled, when something broke and recovery is not possible
  public static error(classObject: any, message: any) {
    const className = this.classNameResolver(classObject);
    console.error(`${className}: `, message);
  }
  // Always enabled, when something didn't break but might be a user mistake or an unexpected situation
  public static warn(classObject: any, message: any) {
    const className = this.classNameResolver(classObject);
    console.warn(`${className}: `, message);
  }
  // Always enabled, should only be for important messages
  public static info(classObject: any, message: any) {
    const className = this.classNameResolver(classObject);
    console.info(`${className}: `, message);
  }
  // Only enabled during development, verbose mode
  public static debug(classObject: any, message: any) {
    const className = this.classNameResolver(classObject);
    console.debug(`${className}: `, message);
  }

  private static classNameResolver(classObject: any): string {
    if (classObject instanceof WBNote) {
      return classObject.name;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return classObject.constructor.name as string;
  }
}
