import { type HoverParent, HoverPopover, ItemView, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { generateNationView } from "./generators/nationView";
import { generateSettlementView } from "./generators/settlementView";
import { WORLD_ENGINE_HOVER_SOURCE, WORLD_ENGINE_VIEW } from "src/constants";
import { WBNote } from "src/world/notes/wbNote";
import { NationNote } from "src/world/notes/nationNote";
import { SettlementNote } from "src/world/notes/settlementNote";

const STATUS = "Status: ";
const RUNNING = STATUS + "Running";
const PAUSED = STATUS + "Paused";
const NO_WB_NOTE = "No WBNote Selected";

export class WorldEngineView extends ItemView implements HoverParent {
  plugin: WorldBuildingPlugin;
  hoverPopover: HoverPopover | null;

  viewContainerElement: HTMLElement;

  headerContainerEl: HTMLElement;
  titleEl: HTMLElement;
  statusEl: HTMLElement;
  wbNoteTitleEl: HTMLElement;
  wbNoteTitleLink: HTMLElement;

  contentContainerEl: HTMLElement;

  paused: boolean;

  // Currently Displayed WBNote.
  displayedWBNote: WBNote | undefined;

  constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = true;
    this.paused = false;

    const container = this.containerEl.children[1];
    container.empty();
    // Overall container for the view.
    this.viewContainerElement = container.createEl("div");
    this.viewContainerElement.setCssProps({ "webkit-user-select": "text", "user-select": "text" });
    // Header container.
    this.headerContainerEl = this.viewContainerElement.createEl("div");
    this.titleEl = this.headerContainerEl.createEl("h1", { text: "World Engine" });
    this.statusEl = this.headerContainerEl.createEl("h2", { text: RUNNING });
    this.wbNoteTitleEl = this.headerContainerEl.createEl("h2");
    this.wbNoteTitleLink = this.wbNoteTitleEl.createEl("a", { text: NO_WB_NOTE });
    this.wbNoteTitleLink.addEventListener("mouseover", (event: MouseEvent) => {
      if (this.displayedWBNote === undefined) return;
      this.plugin.app.workspace.trigger("hover-link", {
        event: event,
        source: WORLD_ENGINE_HOVER_SOURCE,
        hoverParent: this,
        targetEl: this.wbNoteTitleLink,
        linktext: this.displayedWBNote.file.path,
      });
    });
    this.wbNoteTitleLink.addEventListener("click", async () => {
      if (this.displayedWBNote === undefined) return;
      await this.plugin.app.workspace.openLinkText(this.displayedWBNote.file.path, "", true);
    });

    this.hoverPopover = new HoverPopover(this, this.wbNoteTitleLink);

    // Content container.
    this.contentContainerEl = this.viewContainerElement.createEl("div");
  }

  public override getViewType() {
    return WORLD_ENGINE_VIEW;
  }

  public override getDisplayText() {
    return "World Engine";
  }

  public override async onOpen() {}
  public override async onClose() {}

  public override getIcon(): string {
    return "globe";
  }

  public async displayWBNote(note: WBNote) {
    if (this.paused) {
      // View is paused.
      return;
    }
    this.contentContainerEl.empty();
    this.wbNoteTitleLink.setText(note.name);

    if (note instanceof NationNote) {
      generateNationView(note, this.contentContainerEl);
    } else if (note instanceof SettlementNote) {
      generateSettlementView(note, this.contentContainerEl);
    }

    this.displayedWBNote = note;

    // Add a spacer to the bottom of the view.
    const spacerEl = this.contentContainerEl.createEl("div");
    spacerEl.setCssStyles({ marginBottom: "25px" });
  }

  public reloadWBNote() {
    if (this.displayedWBNote !== undefined) {
      this.displayWBNote(this.displayedWBNote);
    }
  }

  public getCurrentWBNote() {
    return this.displayedWBNote;
  }

  public setPaused() {
    this.statusEl.setText(PAUSED);
    this.paused = true;
  }
  public setRunning() {
    this.statusEl.setText(RUNNING);
    this.paused = false;
  }
}
