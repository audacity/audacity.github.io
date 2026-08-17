import type { Editor } from "@tiptap/core";
import {
  clearBlockSelection,
  deleteSelectedBlocks,
  duplicateSelectedBlocks,
  isSelectionTextConvertible,
  turnSelectedBlocksInto,
  type TurnIntoTarget,
} from "./blockSelection";

export interface SelectionBarProps {
  editor: Editor;
  /** Live selected-block count, computed by `Editor.tsx` (which subscribes
   * to the editor's `transaction` event and re-reads `getSelectedBlocks`)
   * rather than by this component — see that file's wiring comment. */
  count: number;
}

/**
 * Floating batch-action bar for the Notion-style multi-block selection
 * (`blockSelection.ts`): "N blocks selected" plus Turn-into/Duplicate/
 * Delete/Clear, all operating on whatever the plugin's decoration set
 * currently holds. `Editor.tsx` mounts this only once `count >= 1` (it's
 * unmounted, not just hidden, when the selection is empty), so every
 * button here can assume a non-empty selection exists.
 *
 * "Turn into" is conditionally rendered via `isSelectionTextConvertible`:
 * lists, admonitions, images, tabs, etc. in the selection hide the whole
 * group rather than partially applying to some of the selected blocks (see
 * that helper's own doc comment for the v1 scope decision).
 */
export function SelectionBar({ editor, count }: SelectionBarProps) {
  const showTurnInto = isSelectionTextConvertible(editor);

  function turnInto(target: TurnIntoTarget) {
    turnSelectedBlocksInto(editor, target);
  }

  return (
    <div className="selection-bar" data-testid="selection-bar">
      <span className="selection-bar__count">
        {count} block{count === 1 ? "" : "s"} selected
      </span>

      {showTurnInto ? (
        <span className="selection-bar__group">
          <button
            type="button"
            data-testid="selection-turn-text"
            className="selection-bar__button"
            onClick={() => turnInto("paragraph")}
          >
            Text
          </button>
          <button
            type="button"
            data-testid="selection-turn-h2"
            className="selection-bar__button"
            onClick={() => turnInto("heading2")}
          >
            Heading 2
          </button>
          <button
            type="button"
            data-testid="selection-turn-h3"
            className="selection-bar__button"
            onClick={() => turnInto("heading3")}
          >
            Heading 3
          </button>
          <button
            type="button"
            data-testid="selection-turn-code"
            className="selection-bar__button"
            onClick={() => turnInto("code")}
          >
            Code
          </button>
        </span>
      ) : null}

      <span className="selection-bar__group">
        <button
          type="button"
          data-testid="selection-duplicate"
          className="selection-bar__button"
          onClick={() => duplicateSelectedBlocks(editor)}
        >
          Duplicate
        </button>
        <button
          type="button"
          data-testid="selection-delete"
          className="selection-bar__button selection-bar__button--danger"
          onClick={() => deleteSelectedBlocks(editor)}
        >
          Delete
        </button>
      </span>

      <button
        type="button"
        data-testid="selection-clear"
        className="selection-bar__close"
        aria-label="Clear selection"
        onClick={() => clearBlockSelection(editor)}
      >
        ✕
      </button>
    </div>
  );
}

export default SelectionBar;
