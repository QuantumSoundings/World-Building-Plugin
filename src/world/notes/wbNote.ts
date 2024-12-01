import { TFile } from "obsidian";
import WorldBuildingPlugin from "src/main";
import type { WBNoteTypeEnum } from "src/constants";
import { FileUtils } from "src/util/fileUtils";
import { Logger } from "src/util/Logger";
import { calculateTimeDifference, crt } from "src/util/time";

export const WB_NOTE_PROP_NAME = "wbNoteType";

export const BLANK_DATE = "yyyy-mm-dd";
export interface Dates {
  // Dates for living things
  birth: string;
  death: string;
  livingAge: string;
  // Dates for non living things
  founded: string;
  dissolved: string;
  nonLivingAge: string;
  story: string;
  // Calculated Values
  timeSinceBirth: string;
  timeSinceDeath: string;
  timeSinceFounded: string;
  timeSinceDissolved: string;
  timeSinceStory: string;
}

export enum DateType {
  living,
  nonLiving,
  story,
}

export class WBNote {
  plugin: WorldBuildingPlugin;
  file: TFile;

  name: string;
  wbNoteType: WBNoteTypeEnum;

  constructor(plugin: WorldBuildingPlugin, file: TFile) {
    this.plugin = plugin;
    this.file = file;
    this.name = file.name.replace(".md", "");
  }

  public setFile(newFile: TFile) {
    this.file = newFile;
    this.name = newFile.name.replace(".md", "");
  }

  public async update() {}

  protected checkForProperty(fm: any, property: string): boolean {
    if (fm === null) return false;
    if (!fm.hasOwnProperty(property)) {
      Logger.error(this, "Front matter missing property: " + property);
      return false;
    }
    return true;
  }

  protected checkForOptionalProperty(fm: any, property: string): boolean {
    if (fm === null) return false;
    if (!fm.hasOwnProperty(property)) {
      Logger.error(this, "Front matter missing property: " + property);
      return false;
    }
    return true;
  }

  protected parseDates(fm: any, type: DateType): Dates {
    const dates: Dates = {
      birth: BLANK_DATE,
      death: BLANK_DATE,
      livingAge: BLANK_DATE,
      founded: BLANK_DATE,
      dissolved: BLANK_DATE,
      nonLivingAge: BLANK_DATE,
      story: BLANK_DATE,
      timeSinceBirth: BLANK_DATE,
      timeSinceDeath: BLANK_DATE,
      timeSinceFounded: BLANK_DATE,
      timeSinceDissolved: BLANK_DATE,
      timeSinceStory: BLANK_DATE,
    };
    if (!this.checkForProperty(fm, "dates")) {
      Logger.warn(this, "No dates found in front matter.");
      return dates;
    }

    const fmDates = fm.dates;
    // Parse in the inputs from the front matter
    if (type === DateType.living && this.checkForProperty(fmDates, "birth")) {
      dates.birth = fmDates.birth;
    }
    if (type === DateType.living && this.checkForProperty(fmDates, "death")) {
      dates.death = fmDates.death;
    }
    if (type === DateType.nonLiving && this.checkForProperty(fmDates, "founded")) {
      dates.founded = fmDates.founded;
    }
    if (type === DateType.nonLiving && this.checkForProperty(fmDates, "dissolved")) {
      dates.dissolved = fmDates.dissolved;
    }
    if (type === DateType.story && this.checkForProperty(fmDates, "story")) {
      dates.story = fmDates.story;
    }
    // Calculate the time since
    if (dates.birth !== BLANK_DATE) {
      const relativeSign = crt(this.plugin.settings.currentDate, dates.birth);
      const timeDifference = calculateTimeDifference(dates.birth, this.plugin.settings.currentDate);
      dates.timeSinceBirth = `(${relativeSign}) ${timeDifference}`;
    }
    if (dates.death !== BLANK_DATE) {
      const relativeSign = crt(this.plugin.settings.currentDate, dates.death);
      const timeDifference = calculateTimeDifference(dates.death, this.plugin.settings.currentDate);
      dates.timeSinceDeath = `(${relativeSign}) ${timeDifference}`;
    }
    if (dates.founded !== BLANK_DATE) {
      const relativeSign = crt(this.plugin.settings.currentDate, dates.founded);
      const timeDifference = calculateTimeDifference(dates.founded, this.plugin.settings.currentDate);
      dates.timeSinceFounded = `(${relativeSign}) ${timeDifference}`;
    }
    if (dates.dissolved !== BLANK_DATE) {
      const relativeSign = crt(this.plugin.settings.currentDate, dates.dissolved);
      const timeDifference = calculateTimeDifference(dates.dissolved, this.plugin.settings.currentDate);
      dates.timeSinceDissolved = `(${relativeSign}) ${timeDifference}`;
    }
    if (dates.story !== BLANK_DATE) {
      const relativeSign = crt(this.plugin.settings.currentDate, dates.story);
      const timeDifference = calculateTimeDifference(dates.story, this.plugin.settings.currentDate);
      dates.timeSinceStory = `(${relativeSign}) ${timeDifference}`;
    }
    // Calculate Ages
    if (dates.birth !== BLANK_DATE && dates.death !== BLANK_DATE) {
      dates.livingAge = calculateTimeDifference(dates.birth, dates.death);
    } else if (dates.birth !== BLANK_DATE && dates.death === BLANK_DATE) {
      dates.livingAge = calculateTimeDifference(dates.birth, this.plugin.settings.currentDate);
    }

    if (dates.founded !== BLANK_DATE && dates.dissolved !== BLANK_DATE) {
      dates.nonLivingAge = calculateTimeDifference(dates.founded, dates.dissolved);
    } else if (dates.founded !== BLANK_DATE && dates.dissolved === BLANK_DATE) {
      dates.nonLivingAge = calculateTimeDifference(dates.founded, this.plugin.settings.currentDate);
    }

    return dates;
  }
}

export class LinkText {
  linkText: string;
  resolvedFile: TFile | undefined;
  resolvedNote: WBNote | undefined;

  constructor(linkText: string, plugin: WorldBuildingPlugin) {
    this.linkText = linkText;
    this.resolvedFile = FileUtils.attemptParseLinkToFile(linkText, plugin);
    if (this.resolvedFile !== undefined) {
      this.resolvedNote = plugin.worldEngine.getWBNoteByFile(this.resolvedFile);
    }
  }
}
