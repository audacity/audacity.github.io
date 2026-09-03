/*
  Release notes for every stable Audacity release from 3.0.0, newest first.

  Generated from the release notes on the GitHub releases, then cleaned for a
  reader who isn't working on Audacity: @handles are stripped, and GitHub's
  auto-appended "New Contributors" and "Full Changelog" blocks are dropped.
  Contributor credits are kept — they're the substance of the note, not
  boilerplate.

  Issue numbers are kept too, pulled out of the prose into `refs` so the page
  can render them as links. They read as noise mid-sentence but they're how a
  reader gets from "this was fixed" to the actual report, so they're moved,
  not dropped.

  A static snapshot rather than a build-time fetch, matching audacityReleases.ts
  and olderReleases.ts: the site shouldn't fail to build because an API is
  having a bad day. Regenerate when cutting a release.
*/

export interface ChangelogChange {
  text: string;
  /*
    Issue or pull-request numbers on audacity/audacity. Linked as /issues/,
    which GitHub redirects to /pull/ when the number turns out to be a PR —
    so the link is right either way without recording which it was.
  */
  refs: number[];
}

/*
  A titled block within a release. Only the major releases need these — patch
  notes are one flat list, and stay in `changes`. A section without a title
  continues the previous one after a prose paragraph (its `intro`).
*/
export interface ChangelogSection {
  title?: string;
  intro?: string[];
  changes: ChangelogChange[];
  outro?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  releaseUrl: string;
  /* Prose before the list — usually what kind of release this is. */
  intro: string[];
  changes: ChangelogChange[];
  /* Titled blocks after `changes`, for releases too big for one list. */
  sections?: ChangelogSection[];
  /* Prose after the list. Rare: corrections, caveats. */
  outro: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "4.0.0",
    date: "2026-09-03",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-4.0.0",
    intro: [
      "Audacity 4 rebuilds the application interface on Qt and introduces a new clip-editing model. Most Audacity 3 workflows remain available, but some controls have moved or changed.",
    ],
    changes: [],
    sections: [
      {
        title: "Editing clips",
        changes: [
          {
            text: "Clips can be selected directly. Click a clip header to select it, or Shift-click to select multiple clips",
            refs: [],
          },
          {
            text: "Several clips can be edited together. Moving, trimming and time stretching apply to all selected clips",
            refs: [],
          },
          {
            text: "Clips can be grouped. Groups remain together when moved, copied, pasted or duplicated",
            refs: [],
          },
          {
            text: "Clips can be placed more freely. They can move between mono and stereo tracks. Moving a clip over another replaces the overlapped part instead of blocking the move",
            refs: [],
          },
          {
            text: "Splitting has a dedicated tool. Press or hold S, then click the waveform or clip header. Split, split-cut, split-delete, split at silences and split to a new track are also available as commands",
            refs: [],
          },
          {
            text: "Paste handles more cases automatically. Audacity can create a track when needed, adapt compatible channel layouts and paste audio files from the operating-system clipboard",
            refs: [],
          },
          {
            text: "Alignment guides, sample-boundary snapping and per-project snap settings have been added or expanded",
            refs: [],
          },
        ],
      },
      {
        title: "Interface and tools",
        changes: [
          {
            text: "The interface has been rebuilt on Qt, with native high-DPI rendering",
            refs: [],
          },
          {
            text: "Toolbars and panels can be moved, docked, floated, shown or hidden",
            refs: [],
          },
          {
            text: "UI layouts can be saved as Workspaces. Audacity includes Modern, Classic and Music workspaces",
            refs: [],
          },
          {
            text: "Light, dark and high-contrast themes are available, along with accent colors, track colors and several clip styles",
            refs: [],
          },
          {
            text: "The new Home screen shows recent projects with preview thumbnails",
            refs: [],
          },
        ],
      },
      {
        intro: [
          "The separate Select, Envelope, Draw and Multi-tool modes have been removed. Their functions are now context-sensitive:",
        ],
        changes: [
          {
            text: "Volume envelopes are displayed in the Clip gain mode",
            refs: [],
          },
          {
            text: "Sample drawing becomes available when the waveform is zoomed to individual samples",
            refs: [],
          },
          {
            text: "Splitting is available by holding S",
            refs: [],
          },
          {
            text: "Track and effect parameters use consistent rotary controls with fine adjustment and double-click reset",
            refs: [],
          },
          {
            text: "Sync-Lock has been removed. Delete, cut and paste now have explicit variants for either leaving a gap or moving later material to preserve timing",
            refs: [],
          },
        ],
      },
      {
        title: "Playback and recording",
        changes: [
          {
            text: "The playhead remains visible during navigation and can be dragged to a new position",
            refs: [],
          },
          {
            text: "Playback can seek to another position without stopping",
            refs: [],
          },
          {
            text: "Recording can start anywhere on the timeline and creates a clip at that position",
            refs: [],
          },
          {
            text: "Loop boundaries and the interaction between playback, selections and loops have been revised",
            refs: [],
          },
          {
            text: "Punch and Roll, lead-in recording, latency compensation, software playthrough and per-track input monitoring have been rebuilt for the new interface",
            refs: [],
          },
          {
            text: "Audio Setup now includes system-default devices, refreshable device lists and custom channel mapping. Audacity can follow operating-system device changes automatically",
            refs: [],
          },
          {
            text: "Official Windows builds include ASIO playback and recording support",
            refs: [],
          },
        ],
      },
      {
        title: "Tracks, meters and effects",
        changes: [
          {
            text: "Track headers now contain live playback and recording meters",
            refs: [],
          },
          {
            text: "Preset handling is consistent across built-in, destructive and realtime effects",
            refs: [],
          },
          {
            text: "Built-in effects, generators and analyzers have been rebuilt for the Qt interface",
            refs: [],
          },
          {
            text: "Supported plugin formats are VST3, Nyquist, LV2 on Linux and Audio Units on macOS. Audacity can display generated controls when a plugin's own interface is unavailable",
            refs: [],
          },
          {
            text: "Spectrogram has been redesigned with clearer guides and rulers, and faster rendering",
            refs: [],
          },
        ],
      },
      {
        title: "Projects, import and export",
        changes: [
          {
            text: "Audacity 4 uses the new .aup4 project format",
            refs: [],
          },
          {
            text: ".aup3 projects open and convert to .aup4 without changing the original file. Converted projects cannot be saved back to .aup3",
            refs: [],
          },
          {
            text: "Older .aup projects can be imported",
            refs: [],
          },
          {
            text: "Project files store preview thumbnails and Audacity 4's additional clip and appearance data",
            refs: [],
          },
        ],
      },
      {
        title: "Compatibility notes",
        intro: [
          "The following Audacity 3 features are not available in Audacity 4.0, but we're working on adding them in future releases.",
        ],
        changes: [
          { text: "Time Tracks", refs: [] },
          { text: "Note/MIDI tracks", refs: [] },
          { text: "Mixer", refs: [] },
          { text: "Macro Manager and the scripting pipe", refs: [] },
          { text: "VAMP and LADSPA plugin hosting", refs: [] },
          { text: "Play-at-speed", refs: [] },
        ],
        outro: [
          "Sync-Lock and the old tool modes were replaced by the workflows described above.",
          "Additionally, Audacity 4 ships with some missing exporting and rendering features, analyzers, and effects.",
        ],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.9",
    date: "2026-09-01",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.9",
    intro: ["This is a patch release. It contains the following changes:"],
    changes: [
      {
        text: "Enabled ASIO support for the Windows builds; playback and recording device selection is remembered per host now",
        refs: [11690],
      },
      {
        text: "Added FFmpeg 9 support",
        refs: [11679],
      },
      {
        text: "Fixed several sources of project corruption and data loss: when the disk runs out of space, when a drive is disconnected right after a project is closed, and when a recovered project is closed without saving",
        refs: [11714],
      },
      {
        text: "Fixed crashes while a realtime effect editor is open; master track effect changes can now be undone",
        refs: [11709],
      },
      {
        text: "Fixed a freeze when double-clicking the timeline while a MIDI track is present. MIDI playback now also starts from the set position instead of the beginning",
        refs: [11696],
      },
      {
        text: "Fixed a crash after a failed recording attempt",
        refs: [11711],
      },
      {
        text: "Fixed clips having the wrong tempo after opening a project (Thanks, David Bailes!)",
        refs: [11526],
      },
      {
        text: "Fixed a freeze on startup on systems with an incorrect font configuration",
        refs: [11623],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.8",
    date: "2026-06-11",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.8",
    intro: ["This is a patch release. It contains the following changes:"],
    changes: [
      {
        text: "Fixed an exception thrown when pasting into a newly-created track (Thanks, David Bailes!)",
        refs: [10688],
      },
      {
        text: "Fixed tone generation, waveform-scale setting, SetClip Name parameter, and clip-boundary command names for scripting and macros (Thank you, David Bailes!)",
        refs: [10870, 10884, 10775, 10629],
      },
      {
        text: "Fixed the loading of presets for the Distortion effect (A million thanks, David Bailes!)",
        refs: [11106],
      },
      {
        text: "Fixed paste into an empty audio track not preserving the source sample rate (Thanks, Juan Gabriel Colonna!)",
        refs: [10947],
      },
      {
        text: "Allowed AltGr modifier in label and clip name editing (Thanks, Davide Peressoni!)",
        refs: [10776],
      },
      {
        text: "Added options to choose where silence is truncated (start/middle/end) (Thanks, Noah Rosenfield!)",
        refs: [9938],
      },
      {
        text: "Added Podcast 2.0 chapters JSON export for label tracks (Thanks, Noah Rosenfield!)",
        refs: [9935],
      },
      {
        text: "Improve UI on HiDPI displays on Linux/wxGTK (Thanks, Ivan A. Melnikov!)",
        refs: [10103],
      },
      {
        text: "Fixed MixerBoard Mute and Solo button display (Thanks, Ivan A. Melnikov!)",
        refs: [10099],
      },
      { text: "Fixed multichannel FLAC import", refs: [10681] },
      {
        text: "Fixed envelope being broken after joining clips",
        refs: [10999],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.7",
    date: "2025-12-11",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.7",
    intro: [
      "This is a hotfix release. It fixes broken waveform scrolling and selection for some users introduced in 3.7.6. The fix was provided by iv-m and DavidBailes, thank you!",
      "Other changes:",
    ],
    changes: [
      {
        text: "Added checksum to WavPack export (thanks ajsand)",
        refs: [9940],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.6",
    date: "2025-12-04",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.6",
    intro: ["This is a patch release. It contains the following changes:"],
    changes: [
      { text: "Added FFmpeg 8 support", refs: [9742] },
      {
        text: "Added middle-mouse drag panning over track panel (Thanks, Anders Jenbo)",
        refs: [9565],
      },
      {
        text: 'Added "Import from audio.com" dialog to import audio files from audio.com',
        refs: [9863],
      },
      { text: "Fixed unstable cloud audio uploads", refs: [9838] },
      {
        text: "Allowed export as OGG/Opus when exporting with FFmpeg",
        refs: [9576],
      },
      { text: "Fixed 16-bit FLAC import", refs: [9929] },
      {
        text: "Library updates: libcurl to 8.17.0, wavpack to 5.7.0",
        refs: [9897],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.5",
    date: "2025-08-05",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.5",
    intro: [
      "In this release, we added support for Windows ARM64. At this time, it comes with the following caveats:",
    ],
    changes: [
      {
        text: "Audacity for WoA requires Windows 11 or later. Windows RT is not supported.",
        refs: [],
      },
      { text: "Plugins (VST, OpenVINO, etc.) are not supported.", refs: [] },
      {
        text: "It requires an WoA-version of FFmpeg, the regular installer does not work.",
        refs: [],
      },
      {
        text: "It was not thoroughly tested with all features and workflows due to a lack of devices – your feedback is welcome.",
        refs: [],
      },
      {
        text: "Windows on ARM support (Thanks, Vasanth K and Linaro!)",
        refs: [8942],
      },
      {
        text: "FLAC importer now supports 32-bit PCM (Thanks, Dr. K. D. Murray!)",
        refs: [9121],
      },
      {
        text: "Fixed crash when rendering spectrum view (Thanks, Hailey Somerville!)",
        refs: [8851],
      },
      {
        text: "Fixed lost focus when registration window was closed",
        refs: [9097],
      },
      {
        text: "Fixed crash on wav import (when audio file is up to 7 ms long)",
        refs: [8932],
      },
      { text: "Fixed crash when using Macro Wizard", refs: [4444] },
      {
        text: "Updated libopus to 1.5.2, updated libcurl to 8.12.1, updated libpng to 1.6.50",
        refs: [9100, 8890],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.4",
    date: "2025-06-10",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.4",
    intro: ["This is a patch release. It contains the following changes:"],
    changes: [
      { text: "Added a new welcome/what's new screen.", refs: [] },
      {
        text: "OpenVINO effects are now available on macOS. More about that can be found in this blogpost.",
        refs: [],
      },
      {
        text: "OpenVINO effects can now be found via the Get Effects button. (NB, this is a slow rollout - you may not see it there just yet at the time of release)",
        refs: [],
      },
      {
        text: "OpenVINO effects have been recategorized into their own category in the Effect menu. This also goes for the transcription and music generator feature, previously found in the Generate and Analyze menus, respectively.",
        refs: [],
      },
      {
        text: "Fixed a crash when closing a large unsaved project",
        refs: [6890],
      },
      {
        text: "Fixed a crash when using real-time effects that activate delay compensation",
        refs: [8709],
      },
      {
        text: "Fixed issue where Studio Fade Out creates a new clip when applied at the end of a clip",
        refs: [8494],
      },
      {
        text: "Fixed incorrect waveform rendering on clipped audio",
        refs: [8442],
      },
      {
        text: "Fixed unintended deletion of a clip when joining two clips with pitch adjustment",
        refs: [8559],
      },
      {
        text: "Effect preview now works when the track is muted",
        refs: [3003],
      },
      {
        text: "Fixed possible incorrect calculations in the Hamming window derivative (Thanks, witwald!)",
        refs: [8666],
      },
      {
        text: "Fixed compilation issues on legacy macOS (Thanks, barracuda156!)",
        refs: [8577],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.3",
    date: "2025-03-13",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.3",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      {
        text: "Incorrect results when applying effects to multiple clips",
        refs: [8426],
      },
      {
        text: "Truncate Silence fails to work properly when there is more than one silent part",
        refs: [8425],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.2",
    date: "2025-03-10",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.2",
    intro: ["This is a patch release. It contains the following changes:"],
    changes: [
      {
        text: "Fixed a crash when applying some effects across multiple tracks if one track is empty.",
        refs: [8290],
      },
      {
        text: "Fixed some crashes emanating from the Mixer window.",
        refs: [8157, 8155],
      },
      {
        text: 'Returned the "Residue" option in noise reduction. (Thanks, Christopher Rooney!)',
        refs: [7672],
      },
      {
        text: "Modules are now allowed to stick around when patch releases like this one are published. This means you likely won't need to update the OpenVINO again during 3.7.x.",
        refs: [7809],
      },
      {
        text: "When adding a realtime effect to a track, the effect settings are now opened immediately.",
        refs: [7076],
      },
      {
        text: "Added an infobox when saving a project in a new version breaks compatibility with an old one.",
        refs: [7819],
      },
      {
        text: "Added a preference to turn off automatic tempo detection.",
        refs: [7740],
      },
      {
        text: "When duplicating tracks, the duplicated tracks now have independent realtime effect instances.",
        refs: [4169],
      },
      {
        text: "Fixed range-selection beyond the edge of a clip being destructive.",
        refs: [7700],
      },
      {
        text: "Improved stability of cloud saving.",
        refs: [8013, 8008, 8004, 8009, 8003, 8005, 8071],
      },
      {
        text: "Fixed pasting content from a clip at the beginning of itself being offset in time.",
        refs: [7410],
      },
      { text: "macOS: Fixed AUSoundIsolation.", refs: [4231] },
      {
        text: "Fixed audacity continuing to scroll after letting go of the scrollbar.",
        refs: [6342],
      },
      {
        text: "Fixed black stripes appearing when zooming in while in the envelope or multi-tool.",
        refs: [8110],
      },
      {
        text: 'Added a new "get effects" button next to the Upload Audio button.',
        refs: [8043],
      },
      {
        text: "Added UUID instance support. See this page for further info",
        refs: [8211],
      },
      {
        text: "Fixed label texts using the wrong color in dark themes. (Thanks, GovindaMadhava!)",
        refs: [7154],
      },
      {
        text: "Fixed tracks being incorrectly drawn on high zoom levels using high precision trackpads.",
        refs: [8261],
      },
      {
        text: "Linux: Fixed FFmpeg loading in the Ubuntu 22.04 AppImage.",
        refs: [7902],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.1",
    date: "2024-12-12",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.1",
    intro: ["This is a patch release. It fixes the following bugs:"],
    changes: [
      { text: "Effects can be applied to time-stretched clips.", refs: [7797] },
      {
        text: "Moving or renaming the installation directory no longer re-enables disabled modules.",
        refs: [7620],
      },
      {
        text: 'Opening the "Adjust Playback Speed" dialog doesn\'t crash Audacity anymore.',
        refs: [7652],
      },
    ],
    outro: [],
  },
  {
    version: "3.7.0",
    date: "2024-10-30",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.7.0",
    intro: [
      "The 3.7.x series is primarily maintenance releases while we're working on Audacity 4.0. 3.7.0 fixes the following bugs:",
    ],
    changes: [
      { text: "Improved Linux compatibility.", refs: [6233, 7397, 6900] },
      { text: "Improved contrast in the light theme.", refs: [6702] },
      { text: 'MP3 exports: Renamed "Insane" to "Excessive".', refs: [7008] },
      {
        text: "Improved non-standard character handling for cloud saving.",
        refs: [7570, 7452],
      },
      {
        text: 'Renamed "Split cut/delete" to "Cut/delete and leave gap".',
        refs: [7486],
      },
      {
        text: 'Pasting clips no longer moves clips on other tracks if "editing clips can move other clips" is enabled.',
        refs: [7293],
      },
      {
        text: "Fixed database compacting not working properly sometimes.",
        refs: [7312, 7382],
      },
      {
        text: "Improved startup speed on systems with many audio devices.",
        refs: [6851],
      },
      {
        text: "Multi view: Fixed the hitbox of the x being misaligned with the visuals. (Thanks, Kurtsley)",
        refs: [7186],
      },
      { text: "macOS: Fixed VST presets path.", refs: [7468] },
      {
        text: "Adding, removing, replacing and reordering of effects now is undoable.",
        refs: [7571],
      },
      {
        text: "Closing a project upon turning a realtime effect stack on and off doesn't crash Audacity anymore.",
        refs: [7573],
      },
      {
        text: "Canceling a stereo track mid-operation no longer crashes Audacity.",
        refs: [7610],
      },
      {
        text: "Importing Opus files using libopus no longer shifts the audio data.",
        refs: [7385],
      },
    ],
    outro: [],
  },
  {
    version: "3.6.4",
    date: "2024-09-19",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.4",
    intro: ["This is a patch release. It fixes the following bugs:"],
    changes: [
      {
        text: "Fixed another crash when exiting Audacity. (Thanks, Joe Souza!)",
        refs: [7310],
      },
      { text: "Fixed projects not being compacted on close.", refs: [7312] },
    ],
    outro: [],
  },
  {
    version: "3.6.3",
    date: "2024-09-09",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.3",
    intro: ["This is a patch release. It fixes the following bug:"],
    changes: [
      {
        text: "Fixed a crash when exiting Audacity. (Thanks, Joe Souza!)",
        refs: [7266],
      },
    ],
    outro: [],
  },
  {
    version: "3.6.2",
    date: "2024-09-03",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.2",
    intro: [
      'This is a patch release. It adds a "Legacy" effects section containing the old Limiter, Compressor and Classic Filters.',
      "It also fixes the following bugs:",
    ],
    changes: [
      { text: "Fixed a hang after undoing.", refs: [6995] },
      { text: "Fixed the zero line going missing.", refs: [6912] },
      {
        text: "Fixed envelope appearance for clips offset from 0.",
        refs: [6927],
      },
      { text: "Fixed Audacity turning white on some systems.", refs: [6955] },
      {
        text: "Fixed the pitch indicator disappearing on Linux when hitting double digits.",
        refs: [6857],
      },
      {
        text: "Fixed cutting not putting clips into the clipboard.",
        refs: [6941],
      },
      {
        text: "Fixed pasting sometimes resetting the clip name.",
        refs: [6926],
      },
      {
        text: "Fixed the track header UI breaking when resizing channels in a stereo track.",
        refs: [6751],
      },
      {
        text: "Fixed LV2 plugin detection on macOS and Windows.",
        refs: [6847, 6846],
      },
      { text: "Fixed Labeled Audio operations.", refs: [3679] },
      {
        text: "Fixed Cloud projects sometimes not opening.",
        refs: [6924, 6989],
      },
      { text: "Fixed a bug regarding stereo-to-mono splitting.", refs: [7060] },
      {
        text: "Fixed a bug causing tracks with master effects sometimes only exporting silence.",
        refs: [7055],
      },
      {
        text: "Fixed multi-channel OGG and Wavpack import.",
        refs: [7025, 7133],
      },
      { text: "Fixed a crash after recording long sessions.", refs: [7018] },
      {
        text: "Fixed a crash when failing to load a cloud project.",
        refs: [7126],
      },
      {
        text: "Fixed Audacity maxing out the CPU when minimized.",
        refs: [7093],
      },
      {
        text: 'Fixed the "editing clips can move other clips" preference desynchronizing multiple tracks.',
        refs: [7124],
      },
      { text: "The time track range now is a single dialog.", refs: [6736] },
      {
        text: "Reverted the behavior of selection change when importing a clip to the previous behavior.",
        refs: [6929],
      },
    ],
    outro: ["Other changes"],
  },
  {
    version: "3.6.1",
    date: "2024-07-22",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.1",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      {
        text: "Fixed a crash when exporting multichannel audio.",
        refs: [6889],
      },
      {
        text: "Fixed a crash when pasting mono clips into stereo tracks.",
        refs: [6882],
      },
      {
        text: "(Accessibility) Made more values available when using the plain UI of plugins. (Thanks, David Bailes!)",
        refs: [4763],
      },
      {
        text: "Prevented incompatible versions from opening projects created in 3.6.x.",
        refs: [6855],
      },
      {
        text: "Fixed the dark theme sometimes having white corners in buttons.",
        refs: [6892],
      },
    ],
    outro: [],
  },
  {
    version: "3.6.0",
    date: "2024-07-16",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.6.0",
    intro: [],
    changes: [
      { text: "Master effects", refs: [] },
      { text: "New compressor and limiter", refs: [] },
      { text: "New themes", refs: [] },
      { text: "Increased performance", refs: [] },
      { text: "Added FFmpeg 7 support.", refs: [] },
      {
        text: "You now can paste audio files into Audacity using Ctrl+V.",
        refs: [],
      },
      {
        text: "Alternative waveform colors are now themeable by custom themes.",
        refs: [],
      },
      {
        text: 'Removed the track name overlay preference and the "blend themes" preference.',
        refs: [],
      },
      {
        text: "Scripting: Added GetInfo: Type=Selection. (Thanks, Jonatã Bolzan Loss!)",
        refs: [],
      },
      {
        text: "Added an Extras > Export > Export Selected Audio option.",
        refs: [],
      },
      {
        text: "Import Raw: Added support for offsets larger than 2 GB.",
        refs: [],
      },
      { text: 'Redesigned the "what\'s new" dialog.', refs: [] },
      {
        text: "Added an option to the View menu to show/hide RMS in waveforms.",
        refs: [],
      },
      {
        text: "OpenVINO AI effects can now be downloaded from audacityteam.org/download/openvino/",
        refs: [],
      },
      {
        text: "When recording to a new track, the track is now scrolled back into view again.",
        refs: [6340],
      },
      {
        text: "The macro manager no longer shows parameterless actions as editable. (Thanks, Davi Nonnenmacher!)",
        refs: [3825],
      },
      {
        text: "Pressing Esc in some preference dialogs no longer saves them.",
        refs: [6138],
      },
      {
        text: "Fixed stray orange lines in the high contrast theme.",
        refs: [4504],
      },
      {
        text: "Fixed the quality slider for Ogg export on Linux. (Thanks, Devpriya Nalin!)",
        refs: [5626],
      },
      {
        text: "Fixed a bug which could open a project with the wrong sample rate.",
        refs: [6875],
      },
      {
        text: "Various compiler warning fixes and OpenBSD build fixes. (Thanks, Brad Smith!)",
        refs: [],
      },
    ],
    outro: [
      "Audacity now features master effects. Master effects are effects which apply to the entire project at once. More information can be found at Using master effects & realtime effects.",
      "A new compressor and limiter has been added, replacing the previous versions. A gain reduction history has been added to these effects when they're used as a realtime effect. Factory Presets suitable for a wide range of use cases for these effects have been provided by Vladislav Isaev and Marek Iwaszkiewicz, available via the Presets & Settings button.",
      "Audacity now features new and improved dark and light themes. You can switch between themes via Preferences -> Interface. The theme previously used still is around as the Classic theme, and themes even older than that can be optionally installed as custom themes from here. Updated instructions on creating custom themes can be found here.",
      "Audacity is now quite a bit snappier than before, especially when working on larger projects and on larger screens.",
    ],
  },
  {
    version: "3.5.1",
    date: "2024-04-24",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.5.1",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      { text: "Fixed a crash on launch on macOS 11 and older.", refs: [6322] },
      {
        text: "Fixed the update notification looking for alpha versions instead of release versions.",
        refs: [6324],
      },
      {
        text: "Fixed a freeze when using macros on multiple files.",
        refs: [6321],
      },
    ],
    outro: [],
  },
  {
    version: "3.5.0",
    date: "2024-04-22",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.5.0",
    intro: [
      "Audacity 3.5 adds cloud saving, beat detection, pitch shifting and more.",
    ],
    changes: [
      {
        text: "Cloud project saving We've introduced a new cloud-saving feature that allows you to save your Audacity projects to audio.com. This allows you to work from any device, share & collaborate with others and restore previous versions if something went wrong.",
        refs: [],
      },
      {
        text: 'Automatic tempo detection Audacity can now automatically detect the tempo of imported loops, and adjust them to be in tempo. Tempo detection is done via both audio analysis and metadata checking. If you want to prepare your loop for automatic tempo detection without relying on audio analysis, both acidizer tempo tags or simply writing "123 bpm" anywhere into the filename work. Automatic tempo detection can be turned off via Preferences -> Import/Export.',
        refs: [],
      },
      {
        text: 'Pitch shifting You now can non-destructively change the pitch of a clip by holding Alt and pressing the Up and Down arrow keys. Alternatively, you can click on the overflow menu (...) and select "Pitch and speed...". When changing the pitch this way, an arrow in the UI indicates how much you\'ve shifted it.',
        refs: [],
      },
      {
        text: "Added an option to skip plugin scanning to Preferences -> Effects.",
        refs: [],
      },
      {
        text: "Added an overflow menu, as well as speed and pitch indicators to clips.",
        refs: [],
      },
      {
        text: "Added subtitle formats for labels. Export to WebVTT and SubRip and import of SubRip files is now supported. (Thanks, Pokechu22 and Larry Bordowitz!)",
        refs: [],
      },
      { text: "Reworked the plugin manager.", refs: [] },
      { text: "Improved accessibility. (Thanks, David Bailes!)", refs: [] },
      {
        text: "When zooming in vertically (Ctrl+scroll on the vertical scale), the zeroline now remains centered. Moving the vertical zoom off-center still is possible via Shift+scroll on the vertical scale.",
        refs: [],
      },
      {
        text: "Changed the look of the selection adjust cursors (previously pointing fingers on Windows and macOS, now look like >| everywhere).",
        refs: [],
      },
      {
        text: 'Changed the timeline options button from a green triangle to a settings gear. From it, you can switch between Beats & Measures or hh:mm:ss timeline rulers, set various preferences regarding to looping, as well as playhead behaviors: "Scroll view to playhead" (previously: "Update display while playing") and "Continuous scrolling" (previously: Pinned Play Head).',
        refs: [],
      },
      { text: "Improved BSD support. (Thanks, Brad Smith!)", refs: [] },
      {
        text: "macOS: Changed the Audacity.app icon on macOS to fit new design guidelines.",
        refs: [],
      },
      { text: "Reordered some menus.", refs: [] },
      { text: "Moved OK/Cancel buttons of effects to the bottom.", refs: [] },
      { text: "Removed the read-only mouse preferences page.", refs: [] },
      { text: "Removed Printing options.", refs: [] },
      {
        text: "Removed Screenshot tool. To make a screenshot, use Win+Shift+S (Windows) or Cmd+Shift+4 (Mac) instead.",
        refs: [],
      },
      { text: "Removed Karaoke view.", refs: [] },
      { text: 'Removed the "solo=none" preference.', refs: [] },
      { text: "Removed timeline tooltips preference.", refs: [] },
      { text: 'Removed "dragging selection edges" preference.', refs: [] },
      {
        text: "Removed some warning dialogs and associated preferences.",
        refs: [],
      },
      { text: 'Removed "scrolling left of zero" preference.', refs: [] },
      {
        text: 'Replaced "Advanced Vertical Zooming" with new always-on behavior.',
        refs: [],
      },
      { text: "Removed some vertical zoom presets.", refs: [] },
      {
        text: "Removed EQ XML to TXT converter, which was needed for the Audacity 2.3 -> 2.4 transition. It is now a plugin instead, downloadable at",
        refs: [],
      },
      {
        text: 'Removed the "Vocal reduction and isolation" effect. As a replacement on Windows and Linux, the Intel OpenVINO plugins work better and on a wider array of content, including mono tracks. The old effect still can be downloaded from',
        refs: [],
      },
      {
        text: "Fixed a number of dialogs that were able to grow too large to fit on the screen.",
        refs: [],
      },
      {
        text: "Fixed the playback cursor sometimes desynchronizing with actual playback. (Thanks, David Bailes!)",
        refs: [2133],
      },
      { text: "Fixed the GetInfo scripting command.", refs: [3723, 5615] },
      {
        text: 'Fixed "Reset configuration" command breaking modules preference page.',
        refs: [5283],
      },
      {
        text: "Fixed stereo tracks randomly splitting into mono.",
        refs: [5389],
      },
      {
        text: "The Export Audio -> (external program) option remembers the command line argument again.",
        refs: [5500],
      },
      {
        text: "Fixed the Compressor effect sometimes corrupting audio. (Thanks, David Bailes!)",
        refs: [5670, 3903],
      },
      {
        text: "Fixed Timer Record sometimes failing to export. (Thanks, David Bailes!)",
        refs: [5580, 4952],
      },
      {
        text: "Fixed incorrect level measurements for mono tracks in Noise Gate effect. (Thanks, Steve Daulton!)",
        refs: [5681],
      },
      {
        text: "When exporting multiple files, the mono/stereo setting is now honored properly.",
        refs: [5750],
      },
      {
        text: "Fixed some effects failing when language is set to German, Korean, Dutch, Slovenian, or Turkish.",
        refs: [5848],
      },
      {
        text: "Fixed 8 and 9 inputs not working on keyboard inputs which have AltGr+8/9 mean [ and ]. (Thanks, David Bailes!)",
        refs: [5868, 1548],
      },
      {
        text: "Fixed Audacity crashing when making a stereo track using keyboard. (Thanks, Joe Souza!)",
        refs: [5858],
      },
      {
        text: 'Fixed the "Set default" button not working in the metadata editor. (Thanks, dg-no-9!)',
        refs: [5976],
      },
      {
        text: "Linux: Fixed a memory leak in Wayland by explicitly running on X11. (Thanks, Takahashi, Naoki!)",
        refs: [5977],
      },
    ],
    outro: [
      "There have been a number of removals of niche features to simplify the app. This should make the app a bit less overwhelming to use, and also will speed up future development as fewer things need to be considered.",
    ],
  },
  {
    version: "3.4.2",
    date: "2023-11-16",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.4.2",
    intro: ["This is a hotfix release. It fixes the following issues:"],
    changes: [
      {
        text: "Fix a crash when opening projects with zero-length clips.",
        refs: [5568],
      },
      {
        text: "When exporting a file, the sample rate of the tracks is now considered, and last-used sample rate is remembered.",
        refs: [5032],
      },
      {
        text: "Copy-pasting now pastes into audio again by default. This can be changed via Preferences -> Track Behavior -> Always paste audio as new clips.",
        refs: [5555],
      },
      {
        text: "Mix and render now also resets the gain for the resulting track.",
        refs: [5549],
      },
      {
        text: "Fix clips shifting to the right when effects are applied to them.",
        refs: [5571],
      },
      {
        text: "Fix clicks occurring when overdubbing a project with muted tracks.",
        refs: [5106],
      },
      {
        text: "Fix files being exported without a file extension in rare cases.",
        refs: [5533],
      },
      { text: "Show all sample rates possible for MP2 exports.", refs: [5539] },
      { text: "Fix pasting into labels.", refs: [5518] },
      { text: "Fix a crash when clearing loops.", refs: [5543] },
      {
        text: 'Fix copying when "select all audio if selection required" is enabled.',
        refs: [5529],
      },
      {
        text: "Fix GTK detection and compilation for wxWidgets 3.2.4.",
        refs: [5598, 5552],
      },
      { text: "Fix Nyquist-related crashes.", refs: [5551] },
      { text: "Fix EQs in macros.", refs: [5604] },
      { text: "Fix a crash when closing Audacity.", refs: [5511] },
      { text: "Fix builds on armhf.", refs: [5476] },
    ],
    outro: [],
  },
  {
    version: "3.4.1",
    date: "2023-11-08",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.4.1",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      { text: "Fix 24-bit recording.", refs: [5467] },
      { text: "Fix a crash with.aup importing.", refs: [5488] },
      { text: "Fix crossfading of clips and tracks.", refs: [5471, 5483] },
      {
        text: "Exporting multiple files honors sample rate settings again.",
        refs: [5473],
      },
      {
        text: "Fix crashes related to external program exports.",
        refs: [5480, 5417],
      },
      { text: "Fix BSD and ARM builds.", refs: [5479, 5476] },
      {
        text: "Ctrl+J is now a standard shortcut for joining clips.",
        refs: [5498],
      },
      {
        text: "Stereo tracks no longer randomly split into mono.",
        refs: [5389],
      },
      {
        text: "When exporting a file, the file extension is now always added (except for custom FFmpeg and external program exports).",
        refs: [5007],
      },
      {
        text: "Fix a crash when exporting Opus with older CPUs that don't support AVX.",
        refs: [5516],
      },
    ],
    outro: [],
  },
  {
    version: "3.4.0",
    date: "2023-11-02",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.4.0",
    intro: [
      "Audacity 3.4 adds a musical view, time stretching and a new exporter.",
    ],
    changes: [
      {
        text: "Music workflows Audacity now features several music related features, such as switching between hh:mm:ss time and Beats & Measures, and time-stretching clips to align them to a song's tempo.",
        refs: [],
      },
      {
        text: "Time stretching Hold Alt (macOS: Option) while hovering over the top third of a clip edge to stretch it.",
        refs: [],
      },
      {
        text: 'New exporter Audacity now features a new export window with easier access to options such as sample rate and custom mapping (for 5.1 or 7.1 audio). Additionally, the "Browse" button uses the native file browser now!',
        refs: [],
      },
      {
        text: "For MP3, Audacity now always uses Joint Stereo mode, which always delivers the best possible quality.",
        refs: [],
      },
      { text: "Simplified pasting logic.", refs: [4720] },
      {
        text: "Simplified stereo tracks. Left and right channels now always have synchronized clip starts and ends, and the same sample rate in both channels.",
        refs: [],
      },
      {
        text: "Added cursors trimming and stretching left and right, and changed the I-beam cursor to be less similar to either.",
        refs: [5014],
      },
      {
        text: "When importing audio, the project sample rate no longer changes.",
        refs: [4448],
      },
      {
        text: "The spectrogram colors are now perceptually uniform, and the colormap has gotten a name: Roseus. It also can be used for dataviz outside of Audacity, see for more info! (Thanks, Myungchul Keum)",
        refs: [5204],
      },
      {
        text: "New defaults: The Time Signature toolbar now gets shown, the solo button is set to multi-track mode, time tracks have a wider starting range.",
        refs: [],
      },
      {
        text: "Unsquished the Audacity logo found in some places of the app.",
        refs: [5291],
      },
      {
        text: "Clicking on the border of two clips no longer merges them.",
        refs: [2330],
      },
      {
        text: "Overdubbing on Windows fails with WASAPI with default Recording device.",
        refs: [2530],
      },
      { text: "Built-in Opus support.", refs: [443] },
      {
        text: "lib-time-and-pitch implements a time stretching algorithm originating in Staffpad.",
        refs: [],
      },
      { text: "Audacity now uses Conan 2.", refs: [] },
      {
        text: "Continued extracting code into libraries and modules, especially in the context of importing and exporting.",
        refs: [],
      },
      { text: "nogap metadata no longer is ignored.", refs: [3778] },
      {
        text: "fixed a crash with LV2 plugins (thanks jfroyall!).",
        refs: [4410],
      },
      { text: "fixed some crashes related to macros.", refs: [2471, 4798] },
      {
        text: "fixed a crash when pasting in certain configurations.",
        refs: [4769],
      },
      {
        text: "Accessibility: GUI can be disabled again for VST2 plugins (thanks, David Bailes!).",
        refs: [4677],
      },
      {
        text: "Accessibility: Restored window control IDs, improving NVDA compatibility (thanks again, David Bailes!).",
        refs: [4988],
      },
      {
        text: "fixed a crash on launch on OSX 10.9 (thanks, René Bertin!).",
        refs: [4872],
      },
    ],
    outro: [],
  },
  {
    version: "3.3.3",
    date: "2023-06-08",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.3",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      {
        text: "Fixed EQ not scaling properly when resizing the window.",
        refs: [4618],
      },
      { text: "Fixed the audio.com upload flow.", refs: [4743] },
    ],
    outro: [],
  },
  {
    version: "3.3.2",
    date: "2023-05-05",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.2",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      { text: "Linux AppImage fails to start.", refs: [4629] },
      {
        text: "Issues with selection and time toolbars on Linux packages.",
        refs: [4637],
      },
      {
        text: "Missing duration input in generators on Linux packages.",
        refs: [4639],
      },
      { text: "Potentialy extreme memory usage with Jack host.", refs: [4646] },
      { text: "Anonymous upload to audio.com is disabled.", refs: [4654] },
    ],
    outro: [],
  },
  {
    version: "3.3.1",
    date: "2023-04-28",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.1",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      {
        text: "Fixed cut lines massively inflating project size.",
        refs: [4600],
      },
      {
        text: "Fixed custom project sample rates being uneditable.",
        refs: [4612],
      },
      { text: "Fixed crash reporting being disabled.", refs: [4604] },
      {
        text: "Audacity now shows an error if the upload to audio.com exceeds file size limits.",
        refs: [4234],
      },
      {
        text: "Fixed an error in calculating channels when uploading to audio.com.",
        refs: [4114],
      },
    ],
    outro: [],
  },
  {
    version: "3.3.0",
    date: "2023-04-24",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.3.0",
    intro: ["Changes:"],
    changes: [
      {
        text: "Some of the built-in effects are now realtime capable (Bass & Treble, Distortion, Phaser, Reverb and Wahwah).",
        refs: [],
      },
      { text: "Added a new effect: Shelf Filter.", refs: [4352] },
      {
        text: "Added an initial (beta) version of Beats and Measures.",
        refs: [],
      },
      { text: "Reworked the bottom toolbar dock", refs: [4414] },
      {
        text: "Project Sample Rate is now found in Audio Setup -> Audio Settings (formerly known as Project Rate).",
        refs: [],
      },
      {
        text: "The Snapping Toolbar (formerly known as Snap-To) is now independent of the Selection Toolbar.",
        refs: [],
      },
      {
        text: "Added a new Time Signature Toolbar (beta). It is hidden by default.",
        refs: [],
      },
      {
        text: "Improved Zooming behavior slightly (more to come in the future).",
        refs: [4212],
      },
      {
        text: "Added a new ruler, Linear (dB). This ruler goes from 0 dBFS to -∞ dBFS and better reflects the volume as shown in the recording/playback meters.",
        refs: [4393],
      },
      {
        text: "When copying clips between projects, you now can choose between whether to copy smart clips or just the visible portion.",
        refs: [3820],
      },
      {
        text: "Added a delete button to the Cut/Copy/Paste toolbar.",
        refs: [4133],
      },
      {
        text: "Audacity no longer dithers tracks unnecessarily.",
        refs: [1584],
      },
      {
        text: "Linux playback now handles output latency better (less stutters).",
        refs: [2427],
      },
      { text: "The EQ effect no longer resets clip names.", refs: [3796] },
      {
        text: "Audacity no longer crashes when trying to load projects with plugins that since have been deleted.",
        refs: [3801],
      },
      { text: "Resampling a track no longer trims it.", refs: [4417] },
      { text: "FFmpeg 6 (avformat 60) is now supported.", refs: [] },
      { text: "Moved from Breakpad to Crashpad.", refs: [] },
      { text: "Extracted various libraries from within Audacity.", refs: [] },
    ],
    outro: ["Bugfixes", "Libraries"],
  },
  {
    version: "3.2.5",
    date: "2023-03-01",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.5",
    intro: ["This is a hotfix release. It fixes the following bug:"],
    changes: [
      {
        text: "Fixes authorization flow for the audio.com sharing service",
        refs: [4373],
      },
    ],
    outro: [],
  },
  {
    version: "3.2.4",
    date: "2023-01-27",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.4",
    intro: ["This is a hotfix release. It fixes the following bug:"],
    changes: [{ text: "Fixed the meters not retaining size", refs: [4057] }],
    outro: [],
  },
  {
    version: "3.2.3",
    date: "2022-12-27",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.3",
    intro: [
      "This is a patch release for Audacity 3.2. It adds ability to share audio publicly and fixes some bugs.",
    ],
    changes: [
      { text: "Audio can now be shared publicly on audio.com", refs: [3884] },
      { text: "Fixed the screenshot tool", refs: [4040] },
      {
        text: "Selecting audio no longer marks the project as changed",
        refs: [4019],
      },
      {
        text: "A new toolbar with cut/copy/paste buttons has been added",
        refs: [3693],
      },
      {
        text: "Plain UI for VST3 plugins no longer show MIDI CC parameters",
        refs: [3216],
      },
      {
        text: "The effects sidebar no longer can fill the entire screen",
        refs: [2620],
      },
    ],
    outro: [],
  },
  {
    version: "3.2.2",
    date: "2022-12-06",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.2",
    intro: [
      "This is a patch release for Audacity 3.2. It enables use of VST2 as realtime effects and fixes some bugs.",
    ],
    changes: [
      { text: "VST2 effects are now realtime capable.", refs: [2850] },
      { text: "Improved accessibility of the meters", refs: [3696] },
      {
        text: "Fixed a crash when editing some macro parameters",
        refs: [3769],
      },
      {
        text: "Fixed some play commands getting stuck in play mode",
        refs: [3792],
      },
      {
        text: "Audacity no longer quietly discards changes in realtime effects but instead asks if you want to save before quitting",
        refs: [3670],
      },
      {
        text: "Plugin scanning now lets you skip individual plugins if scanning gets stuck on them",
        refs: [3838],
      },
      {
        text: 'Plugin scanning no longer produces "Audacity crashed" windows when a plugin fails validation, and no longer shows the plugins in the macOS dock during validation',
        refs: [3980],
      },
      {
        text: "Fixed an issue with labels losing focus on macOS Ventura",
        refs: [3883],
      },
      { text: "Fixed various plugin-specific issues", refs: [] },
    ],
    outro: ["Additional plugins have been added to plugins.audacityteam.org"],
  },
  {
    version: "3.2.1",
    date: "2022-10-05",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.1",
    intro: [
      "This is a patch release. It fixes some bugs and has minor improvements.",
    ],
    changes: [
      {
        text: "Fixed Audacity crashing on startup on some systems.",
        refs: [3686],
      },
      {
        text: "Fixed a crash when applying Waves Berzerk Distortion Mono to a mono track",
        refs: [3694],
      },
      {
        text: "Fixed a freeze when very quickly starting and stopping playback.",
        refs: [3699],
      },
      {
        text: "macOS: Homebrew FFmpeg installs are now found automatically",
        refs: [3747],
      },
      { text: "macOS: Fixed Melda VST Plugin UI", refs: [3594] },
      {
        text: "Building with VST3 support is now possible without Conan.",
        refs: [3474],
      },
    ],
    outro: [],
  },
  {
    version: "3.2.0",
    date: "2022-09-22",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.2.0",
    intro: ["This version adds realtime effects and VST3."],
    changes: [
      {
        text: "Added a new Effects button to the tracks menu, allowing you to place realtime effects.",
        refs: [],
      },
      {
        text: "The ability to upload and share your audio using our new sister service, Audio.com",
        refs: [],
      },
      { text: "Merged the mixer bar with the meter bars.", refs: [] },
      {
        text: "Added a new Audio Setup button, replacing the Device Toolbar by default. The device toolbar can be re-added via the View > Toolbars menu.",
        refs: [],
      },
      {
        text: "The Effects menu has gotten a new sorting. Other sorting and grouping options can be found in the Effects preferences.",
        refs: [],
      },
      { text: "Updated the icons.", refs: [] },
      { text: "VST3 effects are now supported.", refs: [] },
      {
        text: "The following plugin formats are now realtime capable: VST3, LV2, LADSPA, Audio Units.",
        refs: [],
      },
      {
        text: "Plugins now automatically get scanned, tested and enabled when Audacity starts.",
        refs: [],
      },
      { text: "Apple Silicon (arm64) is now supported on macOS", refs: [] },
      {
        text: "FFMPEG 5.0 (avformat 59) is now supported, in addition to avformat 55, 57 and 58",
        refs: [],
      },
      { text: "Added support for Wavpack", refs: [] },
      {
        text: "On Linux, Audacity can now be compiled without JACK present.",
        refs: [],
      },
      { text: "Audacity now uses XDG directories on Linux.", refs: [] },
      { text: "Switched from mad to mpg123 as MP3 importer", refs: [] },
      {
        text: "Removed the Zoom Tool. You can use the zoom buttons or Ctrl+Scroll (macOS: Cmd+Scroll) to zoom instead.",
        refs: [],
      },
      {
        text: "The Audacity Manual HTML pages are no longer included in the installation.",
        refs: [],
      },
      {
        text: "Fixed Audacity sometimes not being able to import MP3 files (or reporting Huffman Data Overruns)",
        refs: [3079],
      },
      {
        text: "Fixed rare data loss bug when placing labels during recording",
        refs: [2590],
      },
      {
        text: "Fixed clip titles being able to disappear off-screen when editing them",
        refs: [2272],
      },
      { text: "Fixed Punch and Roll not paying tracks in sync", refs: [2162] },
      {
        text: "Fixed clip titles changing name when applying some effects",
        refs: [1889],
      },
      {
        text: "During batch processing, Audacity will no longer stop to ask for a sample rate when an unsupported one is chosen, but choose the nearest supported one instead.",
        refs: [1624],
      },
      {
        text: "Fixed mod-script-pipe not being installed on Linux",
        refs: [2265],
      },
      {
        text: "Fixed GTK packaging in Appimages. This fixes various issues with icons, dropdowns and similar things not appearing properly.",
        refs: [3571],
      },
      {
        text: "Improved M4A/AAC support. Previously the target bitrate was not honored at all, now it can be set between 98 and 160 kbit/s (mono) or 196 and 320 kbit/s (stereo). The UI does not yet reflect these limits.",
        refs: [3634],
      },
    ],
    outro: [
      "Further information can be found can be found on",
      "More info can be found on",
      "You can find plugins on",
      "> Note: When using an arm64 Audacity, you must use arm64 versions of FFMPEG and plugins. Plugins for x86-64 (Intel macs) will not load. > For the time being, Audacity will continue to download x86-64 versions by default to avoid these incompatibilities, > but you can download an arm64 version from Github releases",
      "> Note: If you are upgrading from a previous version, Audacity will keep using the ~/.audacity-data and ~/.audacity folders until you delete them.",
      "Audacity binaries are now licensed under the GNU General Public License, Version 3. Most code files remain GPLv2-or-later, but VST3 support required this license update. More information can be found in the announcement post",
      "> If you require offline access of the manual, you can download it here: > You also can download PDFs of straight from its sidebar (or the three-dot button on mobile devices).",
    ],
  },
  {
    version: "3.1.3",
    date: "2021-12-23",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.3",
    intro: ["This is a patch release. It improves the following aspects:"],
    changes: [
      {
        text: "Improved performance. Loading in projects especially should now be up to 50x faster compared to 3.1.0.",
        refs: [2121, 2087, 2065, 2267],
      },
      { text: "Added snap guides when resizing clips", refs: [2066] },
      {
        text: 'Added new shortcuts for looping: Shift+L for "Set Loop to Selection", Shift+Alt+L for "Clear Looping Region"',
        refs: [2209],
      },
      {
        text: "Added a new selection region indicator in the timeline (identical in function as the one found pre-3.1, but with updated visuals)​",
        refs: [2067],
      },
      {
        text: "Changed error messages to look less like a crash report",
        refs: [2178],
      },
      {
        text: "Re-added the Quick Play indicator (green triangle and line) that got lost during 3.1.0 development",
        refs: [2122],
      },
      {
        text: "Fixed Play-at-speed not updating the playback speed dynamically",
        refs: [2149],
      },
      {
        text: "Fixed looping regions being created unintentionally when attempting to use Timeline Quick Play",
        refs: [2182],
      },
      { text: "Fixed looping sometimes playing the wrong audio", refs: [2103] },
      {
        text: "Fixed a bug that could cause data-loss when joining multiple clips",
        refs: [2226],
      },
      { text: "Fixed scrub preview visibility", refs: [2294] },
      {
        text: "Fixed a bug when trying to locate FFMPEG manually",
        refs: [2282],
      },
      { text: "Fixed a glitch with Loop Playback", refs: [2314] },
      {
        text: "Fixed a crash and a macOS-specific bug when renaming sync-locked clips using a dialog box.,",
        refs: [2199, 2198],
      },
      { text: "Fixed a crash when releasing a clip handle", refs: [2147] },
      {
        text: "Fixed a freeze when closing Audacity with the logging window open",
        refs: [2114],
      },
      {
        text: "Fixed a crash when loading a saved project using certain compilers",
        refs: [2216],
      },
      { text: "Fixed a crash on paste after running macros", refs: [2021] },
      { text: "Fixed a crash when cancelling a nyquist prompt", refs: [2239] },
    ],
    outro: [],
  },
  {
    version: "3.1.2",
    date: "2021-11-16",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.2",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      { text: "Fixed UTF8 support in clip titles", refs: [2135] },
      { text: "Fixed data loss when joining clips", refs: [2123] },
      { text: "Fixed a crash with exporting resampled tracks", refs: [2136] },
      {
        text: "Fixed a crash when opening projects with very small double values",
        refs: [2128],
      },
    ],
    outro: [],
  },
  {
    version: "3.1.1",
    date: "2021-11-11",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.1",
    intro: ["This is a hotfix release. It fixes the following bugs:"],
    changes: [
      {
        text: "Fixed FFMPEG imports only importing the left channel",
        refs: [2046],
      },
      {
        text: "Improved Audacity's performance when many clips are present",
        refs: [],
      },
      { text: "Fixed a crash with detach at silences", refs: [2072] },
      {
        text: "Fixed clip name corruption when applying effects to adjacent clips",
        refs: [1889],
      },
      { text: "Fixed a crash with the time shift commands", refs: [2061] },
      { text: "Fixed custom themes not working", refs: [2043] },
    ],
    outro: ["Other than that, this release is identical to Audacity 3.1.0"],
  },
  {
    version: "3.1.0",
    date: "2021-10-28",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.1.0",
    intro: [
      "This release introduces clip handles, smart clips and playback looping as its major new features.",
    ],
    changes: [
      { text: "Context menus have been added in more places.", refs: [] },
      {
        text: "In the preferences, Tracks > Track behaviors > Editing a clip can move other clips is now disabled by default",
        refs: [],
      },
      {
        text: "The spectrogram defaults have been changed: scale type to Mel (was Linear), top of scale to 20000 Hz (was 8000 Hz), window size to 2048 (was 1024), and zero padding to 2 (was 1).",
        refs: [],
      },
      {
        text: "The main volume controls no longer change the system volume.",
        refs: [],
      },
      {
        text: "Raw Import now will remember the previously used settings. Automatic detection of the format now is a button.",
        refs: [],
      },
      {
        text: "A journaling feature has been added for QA purposes.",
        refs: [],
      },
      { text: "Generate > Tone now supports triangle waves.", refs: [] },
      {
        text: 'There now exist "What\'s new" screens for the update and welcome dialogs.',
        refs: [],
      },
      {
        text: "Timeline Quick Play for regions and locked regions have been replaced by playback looping.",
        refs: [],
      },
      {
        text: "The shortcut to rename labels and clip names has temporarily been hardcoded to Ctrl+F2.",
        refs: [],
      },
      {
        text: "This conflicts with the default xfce shortcut to change workspaces.",
        refs: [],
      },
      { text: "FFMPEG now supports avformat 55, 57 and 58.", refs: [] },
      {
        text: "PortAudio has been updated to version 19.7 and devendored (so it can be built against 19.6).",
        refs: [],
      },
      {
        text: "Several libraries (expat, libsndfile,...) have been devendored. The CMakeLists.txt lists which versions we build against.",
        refs: [],
      },
      { text: "AppImages support localization.", refs: [1382] },
      {
        text: "Progress bars for Nyquist generators have been made more accurate.",
        refs: [1856],
      },
      {
        text: "Rhythm tracks can no longer drift off-time by 2ms over 9 minutes; they're now sample-accurate.",
        refs: [1853],
      },
      {
        text: "The play button has regained a pixel or two to become a triangle once more.",
        refs: [1792],
      },
      {
        text: "Auto Duck has been made way more accurate and should no longer miss sections above the threshold.",
        refs: [1389],
      },
      {
        text: "The manual now only is included in the executable once",
        refs: [1917],
      },
      {
        text: "Shift-clicking a menu item no longer opens the settings menu",
        refs: [1358],
      },
      { text: "FFMPEG no longer segfaults ALSA", refs: [1170] },
      {
        text: "Audacity no longer crashes when macros output directory is set to C:\\",
        refs: [1174],
      },
      { text: "A bouncing ball of death problem has been fixed", refs: [1312] },
    ],
    outro: ["There are some 50 issues closed labeled as bug. Among them"],
  },
  {
    version: "3.0.5",
    date: "2021-09-29",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.5",
    intro: [
      "This is a hotfix release that fixes a bug on macOS that could corrupt project files when being opened via cmd+o on languages where the decimal separator wasn't a dot.",
    ],
    changes: [],
    outro: [],
  },
  {
    version: "3.0.4",
    date: "2021-08-24",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.4",
    intro: [
      "Fixes a user reported issue, which possibly leads to the project corruption",
    ],
    changes: [],
    outro: [],
  },
  {
    version: "3.0.3",
    date: "2021-07-26",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.3",
    intro: [],
    changes: [
      { text: "The Windows version of Audacity is now 64-bit", refs: [] },
      {
        text: "(Note: 32-bit plug-ins will not work on 64-bit Audacity)",
        refs: [],
      },
      { text: "We have improved the default spectrogram colors", refs: [] },
      {
        text: "We now provide an official binary for Linux in the form of an AppImage",
        refs: [],
      },
      {
        text: "Update checking: Audacity can now check to see if there is a newer version available",
        refs: [],
      },
      {
        text: "Error reporting: allows users to send us the details of a serious error",
        refs: [],
      },
      { text: "Multiple bugs fixed", refs: [] },
    ],
    outro: [
      "Full details of new features in the visual guide to New Features in 3.0.3",
    ],
  },
  {
    version: "3.0.2",
    date: "2021-04-19",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.2",
    intro: [
      "Audacity 3.0.2 fixes some important bugs and improves diagnostic reporting. We also added a new preference for macro output, and a 'Save' button on the manage macros dialog.",
    ],
    changes: [],
    outro: [],
  },
  {
    version: "3.0.0",
    date: "2021-03-17",
    releaseUrl:
      "https://github.com/audacity/audacity/releases/tag/Audacity-3.0.0",
    intro: [
      "Audacity 3.0.0 introduces the new all-in-one-file aup3 project file format.",
      "Over 160 bugs were fixed since Audacity 2.4.2",
    ],
    changes: [],
    outro: [],
  },
];
