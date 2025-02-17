import { type HoverParent, HoverPopover, ItemView, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { WORLD_ENGINE_VIEW } from "src/constants";
import { WBNote } from "src/world/notes/wbNote";
import { createRoot, type Root } from "react-dom/client";

import { StrictMode } from "react";

import { WorldEngineRC } from "./rc/viewRC";
import { WorldEngineViewContext, type RContext } from "./rc/util";

export class WorldEngineView extends ItemView implements HoverParent {
  plugin: WorldBuildingPlugin;
  root: Root | null = null;
  hoverPopover: HoverPopover | null;

  paused: boolean;

  // Currently Displayed WBNote.
  note: WBNote | undefined;

  constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.navigation = true;
    this.paused = false;
  }

  public override getViewType() {
    return WORLD_ENGINE_VIEW;
  }

  public override getDisplayText() {
    return "World Engine";
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
    this.render();
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  public override async onClose() {
    this.root?.unmount();
  }

  public override getIcon(): string {
    return "globe";
  }

  public displayWBNote(note: WBNote) {
    if (this.paused) {
      return;
    }

    this.note = note;
    this.note.update();
    this.render();
  }

  public reloadWBNote() {
    if (this.note !== undefined) {
      this.displayWBNote(this.note);
    }
  }

  public getCurrentWBNote() {
    return this.note;
  }

  public setPaused() {
    this.paused = true;
    this.render();
  }

  public setRunning() {
    this.paused = false;
    this.render();
  }

  private render() {
    if (this.root === null) return;
    const context: RContext = {
      note: this.note,
      file: this.note?.file,
      plugin: this.plugin,
      popoverParent: this,
    };
    this.root.render(
      <StrictMode>
        <WorldEngineViewContext.Provider value={context}>
          <WorldEngineRC note={this.note} paused={this.paused} />
        </WorldEngineViewContext.Provider>
      </StrictMode>
    );
  }
}
