import { type HoverParent, HoverPopover, ItemView, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { WORLD_ENGINE_VIEW } from "src/constants";
import { WBNote } from "src/world/notes/wbNote";
import { createRoot, type Root } from "react-dom/client";

import { StrictMode } from "react";

import { WorldEngineRC } from "./rc/viewRC";
import { WorldEngineViewContext } from "./rc/util";

export class WorldEngineView extends ItemView implements HoverParent {
  plugin: WorldBuildingPlugin;
  root: Root | null = null;
  hoverPopover: HoverPopover | null;

  paused: boolean;

  // Currently Displayed WBNote.
  note: WBNote | undefined;
  force: number;
  forceUpdate: React.Dispatch<React.SetStateAction<number>> | undefined;

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

  public override async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
    this.render();
  }
  public override async onClose() {
    this.root?.unmount();
  }

  public override getIcon(): string {
    return "globe";
  }

  public async displayWBNote(note: WBNote) {
    if (this.paused) {
      return;
    }

    this.note = note;
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
    this.root.render(
      <StrictMode>
        <WorldEngineViewContext.Provider value={this}>
          <WorldEngineRC />
        </WorldEngineViewContext.Provider>
      </StrictMode>
    );
  }
}
