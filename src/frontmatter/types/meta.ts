export enum WBMetaDataEnum {
  sovereignEntity = "sovereignentity",
  settlementEntity = "settlemententity",
}

// A frontmatter object that is a verified to work with the world engine
export interface WBFrontMatter {
  wbEntityType: WBMetaDataEnum;
}
