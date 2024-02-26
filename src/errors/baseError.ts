import { Logger } from "src/util/Logger";

type Jsonable =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly Jsonable[]
  | { readonly [key: string]: Jsonable }
  | { toJSON(): Jsonable };

export class BaseError extends Error {
  public readonly context?: Jsonable;

  constructor(message: string, options: { cause?: Error; context?: Jsonable } = {}) {
    const { cause, context } = options;

    super(message, { cause });
    this.name = this.constructor.name;

    this.context = context;

    Logger.error(this, message);
  }
}
