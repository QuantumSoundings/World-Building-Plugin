export function generateGaussianValue(min: number, max: number, skew: number) {
  let u = 0;
  let v = 0;
  while (u === 0) {
    //Converting [0,1) to (0,1)
    u = Math.random();
  }
  while (v === 0) {
    v = Math.random();
  }
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) {
    num = generateGaussianValue(min, max, skew); // resample between 0 and 1 if out of range
  } else {
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
  }
  return num;
}

export enum LogLevel {
  Debug = "Debug",
  Info = "Info",
  Warning = "Warning",
  Error = "Error",
}

export function logger(location: any, level: LogLevel, message: string) {
  switch (level) {
    case LogLevel.Debug:
      console.debug(location.constructor.name + ": " + message);
      break;
    case LogLevel.Info:
      console.info(location.constructor.name + ": " + message);
      break;
    case LogLevel.Warning:
      console.warn(location.constructor.name + ": " + message);
      break;
    case LogLevel.Error:
      console.error(location.constructor.name + ": " + message);
      break;
  }
}
