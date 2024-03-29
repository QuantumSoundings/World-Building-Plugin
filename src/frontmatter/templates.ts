// Yaml Imports
import sovereignEntityTemplateBase64 from "resources/Frontmatter Templates/Sovereign Entity.yaml";
import settlementEntityTemplateBase64 from "resources/Frontmatter Templates/Settlement Entity.yaml";
import worldConfigTemplateBase64 from "resources/Frontmatter Templates/World Entity.yaml";

// Types
export enum TemplateType {
  SovereignEntity = "Sovereign Entity Template",
  SettlementEntity = "Settlement Entity Template",
  WorldConfig = "World Entity Template",
}

// Constants
export const TEMPLATE_TYPE_LATEST_VERSION = {
  [TemplateType.SovereignEntity]: "0.0.1",
  [TemplateType.SettlementEntity]: "0.0.1",
  [TemplateType.WorldConfig]: "0.0.1",
};

export const TEMPLATES = [TemplateType.SovereignEntity, TemplateType.SettlementEntity, TemplateType.WorldConfig];

// Base64 Decoded Strings
export const sovereignEntityTemplateString = atob(sovereignEntityTemplateBase64);
export const settlementEntityTemplateString = atob(settlementEntityTemplateBase64);
export const worldConfigTemplateString = atob(worldConfigTemplateBase64);

export function getTemplateFromType(templateType: TemplateType): string {
  switch (templateType) {
    case TemplateType.SovereignEntity:
      return sovereignEntityTemplateString;
    case TemplateType.SettlementEntity:
      return settlementEntityTemplateString;
    case TemplateType.WorldConfig:
      return worldConfigTemplateString;
    default:
      return "";
  }
}
