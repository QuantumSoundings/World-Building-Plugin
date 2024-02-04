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

  constructor(message: string, options: { error?: Error; context?: Jsonable } = {}) {
    const { error, context } = options;

    super(message);
    this.name = this.constructor.name;

    this.context = context;
  }
}
