import { Type } from "class-transformer";

export class Distribution {
  name: string;

  @Type(() => Number)
  value: number;
}

export class WBMetaData {
  type: string;
  version: string;
  id: string;
}
