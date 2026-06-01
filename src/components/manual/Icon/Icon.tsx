import React from "react";
import "./Icon.css";

export type IconName =
  | "mixer"
  | "menu"
  | "gripper"
  | "undo"
  | "redo"
  | "play"
  | "pause"
  | "stop"
  | "record"
  | "rewind"
  | "forward"
  | "skip-back"
  | "skip-forward"
  | "loop"
  | "plus"
  | "zoom-in"
  | "zoom-out"
  | "automation"
  | "cloud"
  | "cloud-filled"
  | "cloud-sync"
  | "export"
  | "copy"
  | "paste"
  | "cut"
  | "spectrogram"
  | "cog"
  | "trash"
  | "silence"
  | "trim"
  | "waveform"
  | "playhead"
  | "caret-down"
  | "close"
  | "user"
  | "book"
  | "brush"
  | "volume"
  | "metronome"
  | "plug"
  | "plugins"
  | "microphone"
  | "keyboard"
  | "label"
  | "midi"
  | "chevron-left"
  | "chevron-right"
  | "zoom-toggle"
  | "zoom-to-selection"
  | "zoom-to-fit"
  | "power"
  | "save"
  | "grid-view"
  | "list-view"
  | "lock"
  | "eye"
  | "refresh"
  | "check";

// Unicode mappings for MusescoreIcon font
const ICON_MAP: Record<IconName, string> = {
  mixer: "\uF41B",
  menu: "\uEF13",
  gripper: "\uF3A2",
  undo: "\uEF19",
  redo: "\uEF1A",
  play: "\uF446",
  pause: "\uF44B",
  stop: "\uF447",
  record: "\uF44A",
  rewind: "\uE007",
  forward: "\uE008",
  "skip-back": "\uF448",
  "skip-forward": "\uF449",
  loop: "\uEF1F",
  plus: "\uEF2A",
  "zoom-in": "\uEF18",
  "zoom-out": "\uEF16",
  automation: "\uF45C",
  cloud: "\uEF25",
  "cloud-filled": "\uF454",
  "cloud-sync": "\uEF25",
  export: "\uEF24",
  copy: "\uF398",
  paste: "\uF399",
  cut: "\uF39A",
  spectrogram: "\uF442",
  cog: "\uEF55",
  trash: "\uEF2C",
  silence: "\uF43A",
  trim: "\uF43B",
  waveform: "\uF43C",
  playhead: "\uF478",
  "caret-down": "\uEF12",
  close: "\uEF14",
  user: "\uEF99",
  book: "\uF441",
  brush: "\uF444",
  volume: "\uEF4E",
  metronome: "\uEF20",
  plug: "\uF440",
  plugins: "\uF440",
  microphone: "\uF41B",
  keyboard: "\uF35D",
  label: "\uF3C7",
  midi: "\uF35E",
  "chevron-left": "\uF39C",
  "chevron-right": "\uF39B",
  "zoom-toggle": "\uF437",
  "zoom-to-selection": "\uF438",
  "zoom-to-fit": "\uF439",
  power: "\uF38F",
  save: "\uEF29",
  "grid-view": "\uF35B",
  "list-view": "\uF3AA",
  lock: "\uF375",
  eye: "\uEF23",
  refresh: "\uF358",
  check: "\uEF31",
};

export interface IconProps {
  /**
   * Icon name from MusescoreIcon font
   */
  name: IconName;
  /**
   * Icon size in pixels
   */
  size?: number;
  /**
   * Icon color
   */
  color?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  color,
  className = "",
}) => {
  const iconChar = ICON_MAP[name] || "";

  return (
    <span
      className={`icon musescore-icon ${className}`}
      style={{
        fontSize: `${size}px`,
        ...(color && { color }),
      }}
      aria-hidden="true"
    >
      {iconChar}
    </span>
  );
};

export default Icon;
