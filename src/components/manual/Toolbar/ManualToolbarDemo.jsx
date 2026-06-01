import {
  Toolbar,
  ToolbarButtonGroup,
  ToolbarDivider,
  TransportButton,
  ToolButton,
} from "@dilsonspickles/components";

/**
 * Recreation of the Audacity 4 toolbar for the manual hub. Each button
 * navigates to the relevant manual page on click. Composed as a single
 * React tree so Astro ships one hydration island for the whole row.
 */
const go = (slug) => () => {
  if (typeof window !== "undefined") {
    window.location.href = "/manual/manual-index/toolbar/" + slug;
  }
};

export default function ManualToolbarDemo() {
  return (
    <Toolbar>
      {/* Transport */}
      <ToolbarButtonGroup>
        <TransportButton icon="play" ariaLabel="Play" onClick={go("play")} />
        <TransportButton icon="stop" ariaLabel="Stop" onClick={go("stop")} />
        <TransportButton
          icon="record"
          recording
          ariaLabel="Record"
          onClick={go("record")}
        />
        <TransportButton
          icon="skip-back"
          ariaLabel="Skip to start"
          onClick={go("rewind-to-start")}
        />
        <TransportButton
          icon="skip-forward"
          ariaLabel="Skip to end"
          onClick={go("rewind-to-end")}
        />
        <TransportButton
          icon="loop"
          ariaLabel="Loop"
          onClick={go("toggle-loop-region")}
        />
      </ToolbarButtonGroup>

      <ToolbarDivider />

      {/* Zoom */}
      <ToolbarButtonGroup>
        <ToolButton
          icon="zoom-in"
          ariaLabel="Zoom in"
          onClick={go("zoom-in")}
        />
        <ToolButton
          icon="zoom-out"
          ariaLabel="Zoom out"
          onClick={go("zoom-out")}
        />
        <ToolButton
          icon="zoom-to-selection"
          ariaLabel="Zoom to selection"
          onClick={go("zoom-to-selection")}
        />
        <ToolButton
          icon="zoom-to-fit"
          ariaLabel="Zoom to fit"
          onClick={go("zoom-to-fit-project")}
        />
        <ToolButton
          icon="zoom-toggle"
          ariaLabel="Zoom toggle"
          onClick={go("zoom-toggle")}
        />
      </ToolbarButtonGroup>

      <ToolbarDivider />

      {/* Edit */}
      <ToolbarButtonGroup>
        <ToolButton icon="cut" ariaLabel="Cut" onClick={go("cut")} />
        <ToolButton icon="copy" ariaLabel="Copy" onClick={go("copy")} />
        <ToolButton icon="paste" ariaLabel="Paste" onClick={go("paste")} />
      </ToolbarButtonGroup>

      <ToolbarDivider />

      {/* Trim */}
      <ToolbarButtonGroup>
        <ToolButton icon="trim" ariaLabel="Trim" onClick={go("trim")} />
        <ToolButton
          icon="silence"
          ariaLabel="Silence"
          onClick={go("silence")}
        />
      </ToolbarButtonGroup>
    </Toolbar>
  );
}
