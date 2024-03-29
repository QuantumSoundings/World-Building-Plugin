import { BaseError } from "./baseError";

export type Result<T, E extends BaseError = BaseError> = { success: true; result: T } | { success: false; error: E };

export function validateError(value: Error) {
  if (value instanceof Error) return value;

  let stringified = "[Unable to stringify the thrown value]";
  try {
    stringified = JSON.stringify(value);
  } catch {
    /* empty */
  }

  const error = new Error(`This value was thrown as is, not through an Error: ${stringified}`);
  return error;
}
