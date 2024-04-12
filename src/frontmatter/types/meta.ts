export enum WBMetaDataEnum {
  sovereignEntity = "sovereignEntity",
  settlementEntity = "settlementEntity",
}

export interface WBMetaData {
  type: WBMetaDataEnum;
  version: string;
  id: string;
}
