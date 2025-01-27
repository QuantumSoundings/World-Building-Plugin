import { TFile } from "obsidian";
import WorldBuildingPlugin from "src/main";
import type { WBNoteTypeEnum } from "src/constants";
import { FileUtils } from "src/util/fileUtils";
import { calculateTimeDifference, crt } from "src/util/time";
import { type LivingDates, type NonLivingDates, type StoryDates } from "src/types/frontMatterTypes";

export const WB_NOTE_PROP_NAME = "wbNoteType";

export class WBNote {
  plugin: WorldBuildingPlugin;
  file: TFile;
  fm: unknown;

  name: string;
  wbNoteType: WBNoteTypeEnum;
  error: string | undefined;

  constructor(plugin: WorldBuildingPlugin, file: TFile, fm: unknown) {
    this.plugin = plugin;
    this.file = file;
    this.name = file.name.replace(".md", "");
    this.fm = fm;
    this.error = undefined;
  }

  public setFile(newFile: TFile) {
    this.file = newFile;
    this.name = newFile.name.replace(".md", "");
  }

  public async reloadFM() {
    this.fm = await this.plugin.frontMatterManager.getFrontMatterReadOnly(this.file.path);
  }

  public update() {
    this.error = undefined;
  }

  protected parseDates<T extends LivingDates | NonLivingDates | StoryDates>(dates: T): T {
    // Calculate the time since
    if ("birth" in dates) {
      if (dates.birth !== null) {
        const relativeSign = crt(this.plugin.settings.currentDate, dates.birth);
        const timeDifference = calculateTimeDifference(dates.birth, this.plugin.settings.currentDate);
        dates.timeSinceBirth = `(${relativeSign}) ${timeDifference}`;
      }
      if (dates.death !== null) {
        const relativeSign = crt(this.plugin.settings.currentDate, dates.death);
        const timeDifference = calculateTimeDifference(dates.death, this.plugin.settings.currentDate);
        dates.timeSinceDeath = `(${relativeSign}) ${timeDifference}`;
      }
      if (dates.birth !== null && dates.death !== null) {
        dates.livingAge = calculateTimeDifference(dates.birth, dates.death);
      } else if (dates.birth !== null && dates.death === null) {
        dates.livingAge = calculateTimeDifference(dates.birth, this.plugin.settings.currentDate);
      }
    } else if ("founded" in dates) {
      if (dates.founded !== null) {
        const relativeSign = crt(this.plugin.settings.currentDate, dates.founded);
        const timeDifference = calculateTimeDifference(dates.founded, this.plugin.settings.currentDate);
        dates.timeSinceFounded = `(${relativeSign}) ${timeDifference}`;
      }
      if (dates.dissolved !== null) {
        const relativeSign = crt(this.plugin.settings.currentDate, dates.dissolved);
        const timeDifference = calculateTimeDifference(dates.dissolved, this.plugin.settings.currentDate);
        dates.timeSinceDissolved = `(${relativeSign}) ${timeDifference}`;
      }
      if (dates.founded !== null && dates.dissolved !== null) {
        dates.nonLivingAge = calculateTimeDifference(dates.founded, dates.dissolved);
      } else if (dates.founded !== null && dates.dissolved === null) {
        dates.nonLivingAge = calculateTimeDifference(dates.founded, this.plugin.settings.currentDate);
      }
    } else if ("story" in dates) {
      if (dates.story !== null) {
        const relativeSign = crt(this.plugin.settings.currentDate, dates.story);
        const timeDifference = calculateTimeDifference(dates.story, this.plugin.settings.currentDate);
        dates.timeSinceStory = `(${relativeSign}) ${timeDifference}`;
      }
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
