import WorldBuildingPlugin from "src/main";
import { TAbstractFile, TFile } from "obsidian";
import { Logger } from "src/util/Logger";
import { FMUtils } from "src/util/frontMatterUtils";
import { WB_NOTE_PROP_NAME, WBNote } from "./notes/wbNote";
import { WBNoteTypeEnum } from "src/constants";
import { NationNote } from "./notes/nationNote";
import { SettlementNote } from "./notes/settlementNote";
import { CharacterNote } from "./notes/characterNote";
import { ProseNote } from "./notes/proseNote";
import { OrganizationNote } from "./notes/organizationNote";

export class WorldEngine {
  plugin: WorldBuildingPlugin;

  private notes: Map<string, WBNote>;

  constructor(plugin: WorldBuildingPlugin) {
    this.plugin = plugin;
    this.notes = new Map<string, WBNote>();
  }

  public async initialize() {
    const files = this.plugin.app.vault.getMarkdownFiles();
    for (const file of files) {
      await this.createWBNote(file);
    }
    for (const note of this.notes.values()) {
      await note.update();
    }
  }

  public registerEventCallbacks() {
    const onFileDeletion = (file: TAbstractFile) => {
      if (this.notes.has(file.path)) {
        this.notes.delete(file.path);
      }
    };
    const onFileRename = async (file: TAbstractFile, oldPath: string) => {
      if (this.notes.has(oldPath)) {
        const note = this.notes.get(oldPath);
        if (note !== undefined) {
          note.setFile(file as TFile);
          this.notes.set(file.path, note);
          this.notes.delete(oldPath);
          await note.update();
        }
      }
    };
    const onFileModify = async (file: TAbstractFile) => {
      const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(file.path);
      if (!FMUtils.validateWBNoteType(frontMatter)) return;
      const fmNoteType = frontMatter[WB_NOTE_PROP_NAME];

      const note = this.notes.get(file.path);
      if (note !== undefined) {
        const worldEngineView = this.plugin.getWorldEngineView();
        const noteIsCurrentlyDisplayed = worldEngineView !== undefined && worldEngineView.getCurrentWBNote() === note;

        if (fmNoteType === note.wbNoteType) {
          note.setFile(file as TFile);
          await note.update();
          if (noteIsCurrentlyDisplayed) {
            worldEngineView.displayWBNote(note);
          }
        } else {
          // Note type has changed, delete old and create new note
          this.notes.delete(file.path);
          await this.createWBNote(file);
          const newNote = this.notes.get(file.path);
          if (newNote !== undefined) {
            if (noteIsCurrentlyDisplayed) {
              worldEngineView.displayWBNote(newNote);
            }
          }
        }
      } else {
        await this.createWBNote(file);
      }
    };
    this.plugin.registerEvent(this.plugin.app.vault.on("delete", onFileDeletion));
    this.plugin.registerEvent(this.plugin.app.vault.on("rename", onFileRename));
    this.plugin.registerEvent(this.plugin.app.vault.on("modify", onFileModify));
  }

  public async triggerUpdate() {
    const worldEngineView = this.plugin.getWorldEngineView();
    if (worldEngineView === undefined) return;
    const note = worldEngineView.getCurrentWBNote();
    if (note !== undefined) {
      await note.update();
      worldEngineView.reloadWBNote();
    }
  }

  public getWBNoteByPath(fullPath: string): WBNote | undefined {
    const note = this.notes.get(fullPath);
    if (note !== undefined) {
      return note;
    }
    return undefined;
  }

  public getWBNoteByName(name: string): WBNote | undefined {
    for (const note of this.notes.values()) {
      if (note.name === name) {
        return note;
      }
    }
    return undefined;
  }

  public getWBNoteByFile(file: TFile): WBNote | undefined {
    for (const note of this.notes.values()) {
      if (note.file === file) {
        return note;
      }
    }
    return undefined;
  }

  private async createWBNote(file: TAbstractFile) {
    const frontMatter = await this.plugin.frontMatterManager.getFrontMatterReadOnly(file.path);

    if (!FMUtils.validateWBNoteType(frontMatter)) return;
    const noteType = frontMatter[WB_NOTE_PROP_NAME] as WBNoteTypeEnum;

    let note: WBNote;
    switch (noteType) {
      case WBNoteTypeEnum.NATION:
        note = new NationNote(this.plugin, file as TFile);
        break;
      case WBNoteTypeEnum.SETTLEMENT:
        note = new SettlementNote(this.plugin, file as TFile);
        break;
      case WBNoteTypeEnum.CHARACTER:
        note = new CharacterNote(this.plugin, file as TFile);
        break;
      case WBNoteTypeEnum.PROSE:
        note = new ProseNote(this.plugin, file as TFile);
        break;
      case WBNoteTypeEnum.ORGANIZATION:
        note = new OrganizationNote(this.plugin, file as TFile);
        break;
      default:
        Logger.error(this, "Unknown note type: " + noteType);
        return;
    }

    this.notes.set(file.path, note);
  }
}
