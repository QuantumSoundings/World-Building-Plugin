import { App, Notice, FuzzySuggestModal } from "obsidian";
import { TEMPLATES, TemplateType, getTemplateFromType } from "src/templates";

export class TemplatePickerModal extends FuzzySuggestModal<TemplateType> {
  constructor(app: App, public onChoose: (template: string) => void) {
    super(app);
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
  onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
    new Notice(`Selected ${item}`);
    const templateString = getTemplateFromType(item as TemplateType);
    this.onChoose(templateString);
  }
}
