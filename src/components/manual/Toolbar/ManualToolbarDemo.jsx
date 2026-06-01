import { Toolbar, ToolbarButtonGroup, ToolbarDivider } from "./Toolbar";
import { TransportButton } from "./TransportButton";
import { ToolButton } from "./ToolButton";

/**
 * Recreation of the Audacity 4 toolbar for the manual hub. Composed as a
 * single React tree so Astro ships one hydration island for the whole row.
 */
export default function ManualToolbarDemo() {
  return (
    <Toolbar>
      {/* Transport */}
      <ToolbarButtonGroup>
        <TransportButton icon="play" ariaLabel="Play" />
        <TransportButton icon="stop" ariaLabel="Stop" />
        <TransportButton icon="record" recording ariaLabel="Record" />
        <TransportButton icon="skip-back" ariaLabel="Skip to start" />
        <TransportButton icon="skip-forward" ariaLabel="Skip to end" />
        <TransportButton icon="loop" ariaLabel="Loop" />
      </ToolbarButtonGroup>

      <ToolbarDivider />

      {/* Selection / tool tools */}
      <ToolbarButtonGroup>
        <ToolButton icon="automation" ariaLabel="Automation" />
      </ToolbarButtonGroup>

      <ToolbarDivider />

      {/* Zoom */}
      <ToolbarButtonGroup>
        <ToolButton icon="zoom-in" ariaLabel="Zoom in" />
        <ToolButton icon="zoom-out" ariaLabel="Zoom out" />
        <ToolButton icon="zoom-to-selection" ariaLabel="Zoom to selection" />
        <ToolButton icon="zoom-to-fit" ariaLabel="Zoom to fit" />
        <ToolButton icon="zoom-toggle" ariaLabel="Zoom toggle" />
      </ToolbarButtonGroup>

      <ToolbarDivider />

      {/* Edit */}
      <ToolbarButtonGroup>
        <ToolButton icon="cut" ariaLabel="Cut" />
        <ToolButton icon="copy" ariaLabel="Copy" />
        <ToolButton icon="paste" ariaLabel="Paste" />
      </ToolbarButtonGroup>

      <ToolbarDivider />

      {/* Trim */}
      <ToolbarButtonGroup>
        <ToolButton icon="trim" ariaLabel="Trim" />
        <ToolButton icon="silence" ariaLabel="Silence" />
      </ToolbarButtonGroup>
    </Toolbar>
  );
}
