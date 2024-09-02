import type { App } from "obsidian";
import { createContext, useContext } from "react";
import { WORLD_ENGINE_HOVER_SOURCE } from "src/constants";
import { FormattedNumber, numberF } from "src/util/formatUtils";
import type { WorldEngineView } from "../worldEngineView";
import type { WBNote } from "src/world/notes/wbNote";

export const AppContext = createContext<App | undefined>(undefined);

export const WorldEngineViewContext = createContext<WorldEngineView | undefined>(undefined);

export const useAppContext = (): App | undefined => {
  return useContext(AppContext);
};

export const useWorldEngineViewContext = (): WorldEngineView | undefined => {
  return useContext(WorldEngineViewContext);
};

export const hoverPopoverHook = (e, worldEngineView: WorldEngineView) => {
  const note = worldEngineView.note;
  if (note === undefined) return;
  const app: App = worldEngineView.plugin.app;

  app.workspace.trigger("hover-link", {
    event: e,
    source: WORLD_ENGINE_HOVER_SOURCE,
    hoverParent: worldEngineView,
    targetEl: e.target,
    linktext: note.file.path,
  });
};

export const clickLinkHook = async (note: WBNote, app: App) => {
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
