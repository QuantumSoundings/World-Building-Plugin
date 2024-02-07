/* eslint-disable no-debugger */
import { TextFileView, WorkspaceLeaf } from "obsidian";
import WorldBuildingPlugin from "src/main";
import { TableComponent } from "./tableComponent";
import { Logger } from "src/util";

export class CSVView extends TextFileView {
  plugin: WorldBuildingPlugin;
  tableComponent: TableComponent | undefined;
  rootNode: HTMLElement;

  // constructor
  constructor(leaf: WorkspaceLeaf, plugin: WorldBuildingPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.rootNode = this.contentEl;
  }

  override clear(): void {}

  override getViewData(): string {
    return "";
  }
  override setViewData(data: string, clear: boolean): void {
    // We are loading a new file, save the old table if it exists and create a new one.
    if (clear) {
      if (this.file === null || this.file.path === null) {
        Logger.error(this, "File is null or has no path.");
        return;
      }

      if (this.tableComponent === undefined) {
        this.tableComponent = new TableComponent(this.rootNode, this.plugin);
      }

      this.tableComponent.loadDataFromSource(this.file.path);
    }
  }

  override async save(clear?: boolean): Promise<void> {
    if (this.tableComponent !== undefined) {
      this.tableComponent.requestSave();
    }
  }

  // Some random get methods
  public getDisplayText() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      return activeFile.basename;
    } else {
      return "csv (no file)";
    }
  }
  public canAcceptExtension(extension: string) {
    return extension == "csv";
  }
  public getViewType() {
    return "csv";
  }
  public getIcon() {
    return "document-csv";
  }
}
