import { buildNoteLink, useWorldEngineViewContext, type RCUtilContext } from "./util";
import { useState } from "react";

const NO_WB_NOTE = "No WBNote Selected";
const STATUS = "Status: ";
const RUNNING_TEXT = STATUS + "Running";
const PAUSED_TEXT = STATUS + "Paused";

export const HeaderRC = () => {
  const worldEngineView = useWorldEngineViewContext();
  const { note, paused, plugin, force, forceUpdate } = worldEngineView;
  const currentNote = note === undefined ? NO_WB_NOTE : note.name;

  const [currentDate, setCurrentDate] = useState(plugin.settings.currentDate);

  const status = <h2>{paused ? PAUSED_TEXT : RUNNING_TEXT}</h2>;

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setCurrentDate(newDate);
    plugin.settings.currentDate = newDate;
    // Assuming plugin has a method to save settings
    plugin.saveSettings();
    forceUpdate(force + 1);
  };

  const context: RCUtilContext = {
    plugin: plugin,
    note: note,
    file: note?.file,
    popoverParent: worldEngineView,
  };

  return (
    <div>
      <h1>World Engine</h1>
      <h3>
        Current Date:
        <input type="text" value={currentDate} onChange={handleDateChange} />
      </h3>
      {status}
      <h2>{buildNoteLink(context, currentNote)}</h2>
    </div>
  );
};
