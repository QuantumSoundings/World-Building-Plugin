import { WB_NOTE_PROP_NAME } from "src/world/notes/wbNote";

export class FMUtils {
  static validateWBNoteType(fm: any): boolean {
    if (fm === null) return false;
    if (!fm.hasOwnProperty(WB_NOTE_PROP_NAME)) return false;
    if (fm[WB_NOTE_PROP_NAME] === undefined) return false;
    return true;
  }
}
