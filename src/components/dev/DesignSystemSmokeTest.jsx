import {
  AccessibilityProfileProvider,
  ThemeProvider,
  Toolbar,
  ToolbarButtonGroup,
  ToolbarDivider,
  TransportButton,
  ToolButton,
} from "@dilsonspickles/components";

/**
 * Smoke test for @dilsonspickles/components. Wraps the toolbar bits in
 * ThemeProvider so the package's CSS variables hydrate to real colours.
 * Single React island; static otherwise.
 */
export default function DesignSystemSmokeTest() {
  return (
    <ThemeProvider>
      <AccessibilityProfileProvider>
        <Toolbar>
          <ToolbarButtonGroup>
            <TransportButton icon="play" ariaLabel="Play" />
            <TransportButton icon="stop" ariaLabel="Stop" />
            <TransportButton icon="record" recording ariaLabel="Record" />
            <TransportButton icon="skip-back" ariaLabel="Skip to start" />
            <TransportButton icon="skip-forward" ariaLabel="Skip to end" />
            <TransportButton icon="loop" ariaLabel="Loop" />
          </ToolbarButtonGroup>
          <ToolbarDivider />
          <ToolbarButtonGroup>
            <ToolButton icon="zoom-in" ariaLabel="Zoom in" />
            <ToolButton icon="zoom-out" ariaLabel="Zoom out" />
            <ToolButton icon="zoom-to-fit" ariaLabel="Zoom to fit" />
          </ToolbarButtonGroup>
          <ToolbarDivider />
          <ToolbarButtonGroup>
            <ToolButton icon="cut" ariaLabel="Cut" />
            <ToolButton icon="copy" ariaLabel="Copy" />
            <ToolButton icon="paste" ariaLabel="Paste" />
          </ToolbarButtonGroup>
        </Toolbar>
      </AccessibilityProfileProvider>
    </ThemeProvider>
  );
}
