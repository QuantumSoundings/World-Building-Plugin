import { clickLinkHook, hoverPopoverHook, useWorldEngineViewContext } from "./util";

const NO_WB_NOTE = "No WBNote Selected";
const STATUS = "Status: ";
const RUNNING = STATUS + "Running";
const PAUSED = STATUS + "Paused";

export const HeaderRC = () => {
  const worldEngineView = useWorldEngineViewContext();
  const { note, paused, plugin } = worldEngineView;
  const name = note === undefined ? NO_WB_NOTE : note.name;

  let status;
  if (paused) {
    status = <h2>{PAUSED}</h2>;
  } else {
    status = <h2>{RUNNING}</h2>;
  }

  const onMouseOver = (e) => {
    return hoverPopoverHook(e, worldEngineView);
  };
  const onClick = (e) => {
    return clickLinkHook(note, plugin.app);
  };

  return (
    <div>
      <h1>World Engine</h1>
      {status}
      <h2>
        <a onMouseOver={onMouseOver} onClick={onClick}>
          {name}
        </a>
      </h2>
    </div>
  );
};
