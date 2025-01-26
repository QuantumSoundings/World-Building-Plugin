import { useWorldEngineViewContext } from "./util";
import { useState } from "react";

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

  const statusText = <h2>{paused ? PAUSED_TEXT : RUNNING_TEXT}</h2>;

  const [currentDate, setCurrentDate] = useState(context.plugin.settings.currentDate);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e === undefined) return;
    const newDate = e.target.value;
    setCurrentDate(newDate);
    context.plugin.settings.currentDate = newDate;
    void context.plugin.saveSettings();
    forceUpdate(force + 1);
  };

  return (
    <div>
      <h1>World Engine</h1>
      <h3>
        Current Date:
        <input type="text" style={{ width: "100px" }} value={currentDate} onChange={handleDateChange} />
      </h3>
      {statusText}
    </div>
  );
};
