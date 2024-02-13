import sovereignEntityTemplateBase64 from "./frontmatter/templates/sovereignEntity.yaml";

export enum TemplateType {
  SovereignEntity = "Sovereign Entity Template",
}

export const TEMPLATES = [TemplateType.SovereignEntity];

export function getTemplateFromType(templateType: TemplateType): string {
  switch (templateType) {
    case TemplateType.SovereignEntity:
      return sovereignEntityTemplateString;
    default:
      return "";
  }
}

export const sovereignEntityTemplateString = atob(sovereignEntityTemplateBase64);
