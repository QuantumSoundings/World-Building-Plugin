export function scaleRange(
  value: number,
  oldRangeMin: number,
  oldRangeMax: number,
  newRangeMin: number,
  newRangeMax: number
) {
  return ((value - oldRangeMin) / (oldRangeMax - oldRangeMin)) * (newRangeMax - newRangeMin) + newRangeMin;
}

export function generateInt(min: number, max: number) {
  return Math.floor(scaleRange(Math.random(), 0, 1, min, max));
}

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
