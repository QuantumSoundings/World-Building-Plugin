import { Notice, FuzzySuggestModal, TFile } from "obsidian";
import { TEMPLATES, TemplateType, getTemplateFromType } from "src/constants";
import { TemplateFillerModal } from "./templateFillerModal";
import type WorldBuildingPlugin from "src/main";
import { Logger } from "src/util/Logger";

export class TemplatePickerModal extends FuzzySuggestModal<TemplateType> {
  plugin: WorldBuildingPlugin;
  activeFile: TFile;

  constructor(plugin: WorldBuildingPlugin, activeFile: TFile) {
    super(plugin.app);
    this.plugin = plugin;
    this.activeFile = activeFile;
  }

  onOpen() {
    super.onOpen();
  }

  onClose() {
    super.onClose();
  }

  getItems(): TemplateType[] {
    return TEMPLATES;
  }

  getItemText(item: TemplateType): string {
    return item.toString();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChooseItem(item: string, _: MouseEvent | KeyboardEvent): void {
    Logger.info(this, `Selected ${item}`);
    new Notice(`Selected ${item}`);
    const templateString = getTemplateFromType(item as TemplateType);
    new TemplateFillerModal(this.plugin, this.activeFile, templateString).open();
  }
}
