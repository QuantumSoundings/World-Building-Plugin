import { buildNoteLink, useWorldEngineViewContext } from "./util";
import { useState } from "react";

const NO_NOTE = "None Selected";
const STATUS = "Status: ";
const RUNNING_TEXT = STATUS + "Running";
const PAUSED_TEXT = STATUS + "Paused";

export const HeaderRC = () => {
  const context = useWorldEngineViewContext();
  if (context === undefined) return <div>Context is undefined</div>;
  const view = context.plugin.getWorldEngineView();
  if (view === undefined) return <div>View is undefined</div>;
  const { paused, force, forceUpdate } = view;
  if (forceUpdate === undefined) return <div>forceUpdate is undefined</div>;

  const selectedNoteText = context.note === undefined ? NO_NOTE : context.note.name;
  const statusText = <h2>{paused ? PAUSED_TEXT : RUNNING_TEXT}</h2>;

  const [currentDate, setCurrentDate] = useState(context.plugin.settings.currentDate);

  const handleDateChange = (e: any) => {
    const newDate = e.target.value;
    setCurrentDate(newDate);
    context.plugin.settings.currentDate = newDate;
    // Assuming plugin has a method to save settings
    context.plugin.saveSettings();
    forceUpdate(force + 1);
  };

  return (
    <div>
      <h1>World Engine</h1>
      <h3>
        Current Date:
        <input type="text" value={currentDate} onChange={handleDateChange} />
      </h3>
      {statusText}
      <h3>Note: {buildNoteLink(context, selectedNoteText)}</h3>
    </div>
  );
};
