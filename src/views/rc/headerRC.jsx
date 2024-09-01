import { clickLinkHook, hoverPopoverHook } from "./util";

const NO_WB_NOTE = "No WBNote Selected";
const STATUS = "Status: ";
const RUNNING = STATUS + "Running";
const PAUSED = STATUS + "Paused";

export const HeaderRC = (props) => {
  const note = props.note;
  const name = note === undefined ? NO_WB_NOTE : note.name;
  const paused = props.paused;
  let status;
  if (paused) {
    status = <h2>{PAUSED}</h2>;
  } else {
    status = <h2>{RUNNING}</h2>;
  }

  const onMouseOver = (e) => {
    return hoverPopoverHook(e, props);
  };
  const onClick = (e) => {
    return clickLinkHook(e, props);
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
