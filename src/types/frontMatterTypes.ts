import { WBNoteTypeEnum, WBTalentEnum } from "src/constants";
import { z } from "zod";

const LinkTextSchema = z.string().startsWith("[[").endsWith("]]");
const DateRegex = /(-)?\d+-\d{1,2}-\d{1,2}/;
export const LivingDatesSchema = z.object({
  birth: z.string().regex(DateRegex).nullable(),
  death: z.string().regex(DateRegex).nullable(),
  livingAge: z.string().regex(DateRegex).optional(),
  timeSinceBirth: z.string().regex(DateRegex).optional(),
  timeSinceDeath: z.string().regex(DateRegex).optional(),
});
export type LivingDates = z.infer<typeof LivingDatesSchema>;
export const NonLivingDatesSchema = z.object({
  founded: z.string().regex(DateRegex).nullable(),
  dissolved: z.string().regex(DateRegex).nullable(),
  nonLivingAge: z.string().regex(DateRegex).optional(),
  timeSinceFounded: z.string().regex(DateRegex).optional(),
  timeSinceDissolved: z.string().regex(DateRegex).optional(),
});
export type NonLivingDates = z.infer<typeof NonLivingDatesSchema>;
export const StoryDatesSchema = z.object({
  story: z.string().regex(DateRegex).nullable(),
  timeSinceStory: z.string().regex(DateRegex).optional(),
});
export type StoryDates = z.infer<typeof StoryDatesSchema>;

export const CharacterSchema = z.object({
  wbNoteType: z.literal(WBNoteTypeEnum.CHARACTER),
  species: LinkTextSchema.nullable(),
  citizenship: LinkTextSchema.nullable(),
  portrait: LinkTextSchema.nullable(),
  dates: LivingDatesSchema,
  mana: z.object({
    cultivation: z.string().nullable(),
    attributes: z.array(z.string()).nullable(),
    blessing: z.string().nullable(),
  }),
  talent: z.object({
    physical: z.nativeEnum(WBTalentEnum).nullable(),
    mana: z.nativeEnum(WBTalentEnum).nullable(),
    blessing: z.nativeEnum(WBTalentEnum).nullable(),
  }),
});
export type CharacterFM = z.infer<typeof CharacterSchema>;

const TerritorySchema = z.object({
  type: z.string(),
  value: z.number(),
  parentTerritory: z.string(),
});

const DistributionSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const NationSchema = z.object({
  wbNoteType: z.literal(WBNoteTypeEnum.NATION),
  dates: NonLivingDatesSchema,
  geography: z.object({
    size: z.union([z.string(), z.number()]).default(0),
    landFertility: z.number().default(100),
    cultivatedLandPercentage: z.number().default(0),
    territories: z.array(TerritorySchema),
    settlements: z.array(DistributionSchema),
  }),
});
export type NationFM = z.infer<typeof NationSchema>;

export const OrganizationSchema = z.object({
  wbNoteType: z.literal(WBNoteTypeEnum.ORGANIZATION),
  dates: NonLivingDatesSchema,
  relations: z.object({
    rulingParty: LinkTextSchema.nullable(),
  }),
});
export type OrganizationFM = z.infer<typeof OrganizationSchema>;

export const ProseSchema = z.object({
  wbNoteType: z.literal(WBNoteTypeEnum.PROSE),
  dates: StoryDatesSchema,
  sceneLocations: z.array(LinkTextSchema),
  characters: z.array(LinkTextSchema),
});
export type ProseFM = z.infer<typeof ProseSchema>;

export const SettlementSchema = z.object({
  wbNoteType: z.literal(WBNoteTypeEnum.SETTLEMENT),
  dates: NonLivingDatesSchema,
  demographics: z.object({
    settlementType: z.string(),
    populationScale: z.number(),
  }),
  relations: z.object({
    parentNote: LinkTextSchema.nullable(),
    rulingParty: LinkTextSchema.nullable(),
  }),
  location: z.array(z.number()).min(2).max(2).optional(),
  mapmarker: z.string().optional(),
  tag: z.array(z.string()).optional(),
});
export type SettlementFM = z.infer<typeof SettlementSchema>;

export interface Distribution {
  name: string;
  value: number;
}

export const BLANK_DATE = "yyyy-mm-dd";
