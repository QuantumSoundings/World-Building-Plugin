import type { App } from "obsidian";
import { WORLD_ENGINE_HOVER_SOURCE } from "src/constants";
import { FormattedNumber, numberF } from "src/util/formatUtils";

export const hoverPopoverHook = (e, props) => {
  if (props.note === undefined) return;
  const app: App = props.app;

  app.workspace.trigger("hover-link", {
    event: e,
    source: WORLD_ENGINE_HOVER_SOURCE,
    hoverParent: props.hoverParent,
    targetEl: e.target,
    linktext: props.note.file.path,
  });
};

export const clickLinkHook = async (_e, props) => {
  const note = props.note;
  const app = props.app;
  if (note === undefined) return;
  await app.workspace.openLinkText(note.file.path, "", true);
};

export const formatTable = (headers: string[], rows: any[][]) => {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => (
            <th>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr>
            {row.map((cell) => {
              if (typeof cell === "number" || cell instanceof FormattedNumber) {
                return <td>{numberF(cell)}</td>;
              }
              return <td>{cell}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
