// Per-workspace configuration consumed by WorkspaceCanvas.
// The canvas itself owns layout primitives (Toolbar, TrackControlSidePanel,
// TrackNew, TimelineRuler, PlayheadCursor, MixerPanel). These configs only
// describe what to show — they don't render anything themselves.

const env = (points) => points.map(([time, db]) => ({ time, db }));

export const WORKSPACE_CONFIGS = {
  classic: {
    label: "Classic",
    workspace: "classic",
    blurb:
      "As close to Audacity 3 as it gets. Cut, copy, paste right in the transport, time in seconds, no tempo to fight with.",
    duration: 24,
    playheadPosition: 14.0,
    envelopeMode: false,
    toolbar: {
      showLoop: true,
      showTrimSilence: true,
      showBPM: false,
      showTimeSignature: false,
      showCutCopyPaste: true,
      rulerFormat: "minutes-seconds",
      timeCodeFormat: "hh:mm:ss",
    },
    tracks: [
      {
        trackIndex: 0,
        controlProps: { trackName: "Voice 1", trackType: "mono", volume: -3 },
        height: 110,
        clips: [
          { id: "c1", name: "Take 1", start: 0.2, duration: 3.4 },
          { id: "c2", name: "Take 2", start: 4.0, duration: 3.4 },
        ],
      },
      {
        trackIndex: 1,
        controlProps: { trackName: "Voice 2", trackType: "mono", volume: -6 },
        height: 110,
        clips: [{ id: "c3", name: "Background", start: 0.5, duration: 7.0 }],
      },
      {
        trackIndex: 2,
        controlProps: { trackName: "Ambient", trackType: "mono", volume: -10 },
        height: 110,
        clips: [{ id: "c4", name: "Room tone", start: 0.0, duration: 7.8 }],
      },
    ],
  },

  music: {
    label: "Music",
    workspace: "music",
    blurb:
      "Built for tracking and mixing. Tempo and time signature live in the transport, the ruler counts in bars and beats.",
    duration: 24,
    playheadPosition: 15.4,
    envelopeMode: false,
    toolbar: {
      showLoop: true,
      showTrimSilence: true,
      showBPM: true,
      showTimeSignature: true,
      showCutCopyPaste: false,
      rulerFormat: "beats-measures",
      timeCodeFormat: "beats:bars",
    },
    tracks: [
      {
        trackIndex: 0,
        controlProps: {
          trackName: "Vocals",
          trackType: "stereo",
          volume: -4,
          pan: -10,
        },
        height: 114,
        clips: [
          { id: "v1", name: "Lead vocal", start: 0.4, duration: 2.6 },
          { id: "v2", name: "Harmony", start: 3.4, duration: 2.0 },
          { id: "v3", name: "Ad lib", start: 5.8, duration: 1.4 },
        ],
      },
      {
        trackIndex: 2,
        controlProps: {
          trackName: "Synth",
          trackType: "stereo",
          volume: -8,
          pan: 8,
        },
        height: 114,
        clips: [{ id: "s1", name: "Pad", start: 0.1, duration: 7.2 }],
      },
      {
        trackIndex: 4,
        controlProps: {
          trackName: "Drums",
          trackType: "stereo",
          volume: -2,
        },
        height: 114,
        clips: [
          { id: "d1", name: "Loop A", start: 0.1, duration: 1.6 },
          { id: "d2", name: "Loop A", start: 1.8, duration: 1.6 },
          { id: "d3", name: "Loop B", start: 3.5, duration: 1.6 },
          { id: "d4", name: "Loop A", start: 5.2, duration: 1.6 },
        ],
      },
    ],
    mixer: {
      masterChannel: {
        trackName: "Master",
        trackColor: "#9CA3AF",
        variant: "stereo",
        volume: -3,
        meterLeft: 68,
        meterRight: 70,
      },
      channels: [
        {
          id: "vocals",
          channelProps: {
            trackName: "Vocals",
            trackColor: "#6CCBD8",
            variant: "stereo",
            volume: -4,
            pan: -10,
            meterLeft: 62,
            meterRight: 58,
          },
        },
        {
          id: "synth",
          channelProps: {
            trackName: "Synth",
            trackColor: "#ADABFC",
            variant: "stereo",
            volume: -8,
            pan: 8,
            meterLeft: 48,
            meterRight: 52,
          },
        },
        {
          id: "drums",
          channelProps: {
            trackName: "Drums",
            trackColor: "#F5A26B",
            variant: "stereo",
            volume: -2,
            meterLeft: 74,
            meterRight: 76,
          },
        },
      ],
    },
  },

  podcast: {
    label: "Podcast",
    workspace: "classic",
    blurb:
      "Voice-first projects with mono speakers, a music bed, and sound effects all on one canvas.",
    duration: 20,
    playheadPosition: 11.2,
    envelopeMode: false,
    toolbar: {
      showLoop: true,
      showTrimSilence: true,
      showBPM: false,
      showTimeSignature: false,
    },
    tracks: [
      {
        trackIndex: 0,
        controlProps: { trackName: "Host", trackType: "mono", volume: -3 },
        height: 114,
        clips: [
          { id: "h1", name: "Intro", start: 0.2, duration: 4.0 },
          { id: "h2", name: "Question", start: 5.0, duration: 2.6 },
          { id: "h3", name: "Follow up", start: 11.4, duration: 3.2 },
          { id: "h4", name: "Wrap", start: 16.0, duration: 3.2 },
        ],
      },
      {
        trackIndex: 1,
        controlProps: {
          trackName: "Music bed",
          trackType: "stereo",
          volume: -10,
          pan: 0,
        },
        height: 114,
        clips: [
          {
            id: "s1",
            name: "Intro theme",
            start: 0.1,
            duration: 7.2,
            focused: true,
          },
          { id: "s2", name: "Outro music", start: 9.0, duration: 5.0 },
        ],
      },
      {
        trackIndex: 2,
        controlProps: { trackName: "Guest", trackType: "mono", volume: -4 },
        height: 114,
        clips: [
          { id: "g1", name: "Hello", start: 4.4, duration: 0.6 },
          { id: "g2", name: "Answer", start: 7.8, duration: 3.4 },
          { id: "g3", name: "Story", start: 14.8, duration: 4.6 },
        ],
      },
      {
        trackIndex: 3,
        controlProps: { trackName: "SFX", trackType: "mono", volume: -8 },
        height: 84,
        clips: [
          { id: "sfx1", name: "Sting", start: 4.6, duration: 0.5 },
          { id: "sfx2", name: "Transition", start: 11.0, duration: 0.4 },
        ],
      },
    ],
  },

  modern: {
    label: "Modern",
    workspace: "modern",
    blurb:
      "Envelopes front and centre, cut-copy-paste off the transport. Modern editing trusts you to drag and drop instead.",
    duration: 24,
    playheadPosition: 16.6,
    envelopeMode: true,
    toolbar: {
      showLoop: true,
      showTrimSilence: false,
      showBPM: false,
      showTimeSignature: false,
      showCutCopyPaste: false,
      showAdvancedZoom: false,
      rulerFormat: "minutes-seconds",
      timeCodeFormat: "hh:mm:ss",
    },
    tracks: [
      {
        trackIndex: 0,
        controlProps: {
          trackName: "Lead",
          trackType: "stereo",
          volume: -3,
        },
        height: 200,
        clips: [
          {
            id: "m1",
            name: "Verse",
            start: 0.2,
            duration: 7.4,
            envelopePoints: env([
              [0.0, 0],
              [1.4, -4],
              [3.0, -1],
              [5.0, -6],
              [7.0, -2],
            ]),
          },
        ],
      },
      {
        trackIndex: 2,
        controlProps: {
          trackName: "Pad",
          trackType: "stereo",
          volume: -7,
        },
        height: 200,
        clips: [
          {
            id: "m2",
            name: "Sustain",
            start: 0.0,
            duration: 7.8,
            envelopePoints: env([
              [0.0, -12],
              [1.0, -4],
              [4.0, -3],
              [6.5, -10],
              [7.8, -20],
            ]),
          },
        ],
      },
    ],
  },

  custom: {
    label: "Custom",
    workspace: "classic",
    blurb:
      "Start from any preset and rearrange. Add or remove any tool group, switch ruler formats, and save the result as your own workspace.",
    duration: 24,
    playheadPosition: 18.2,
    envelopeMode: false,
    toolbar: {
      showLoop: true,
      showTrimSilence: true,
      showBPM: true,
      showTimeSignature: true,
      showCutCopyPaste: true,
      rulerFormat: "minutes-seconds",
      timeCodeFormat: "hh:mm:ss",
    },
    tracks: [
      {
        trackIndex: 0,
        controlProps: {
          trackName: "Narration",
          trackType: "mono",
          volume: -2,
        },
        height: 90,
        clips: [
          { id: "u1", name: "Intro", start: 0.1, duration: 2.4 },
          { id: "u2", name: "Body", start: 2.8, duration: 3.6 },
          { id: "u3", name: "Outro", start: 6.6, duration: 1.2 },
        ],
      },
      {
        trackIndex: 2,
        controlProps: {
          trackName: "SFX",
          trackType: "stereo",
          volume: -8,
        },
        height: 90,
        clips: [
          { id: "u4", name: "Whoosh", start: 0.5, duration: 0.6 },
          { id: "u5", name: "Click", start: 2.8, duration: 0.3 },
          { id: "u6", name: "Sweep", start: 4.0, duration: 1.2 },
          { id: "u7", name: "Sting", start: 6.4, duration: 0.4 },
        ],
      },
      {
        trackIndex: 4,
        controlProps: {
          trackName: "Music bed",
          trackType: "stereo",
          volume: -14,
        },
        height: 90,
        clips: [{ id: "u8", name: "Underscore", start: 0.0, duration: 7.8 }],
      },
      {
        trackIndex: 6,
        controlProps: {
          trackName: "Notes",
          trackType: "label",
        },
        height: 60,
        isLabelTrack: true,
        clips: [
          { id: "u9", name: "Cue: drop", start: 2.5, duration: 0.0 },
          { id: "u10", name: "Cue: callout", start: 5.0, duration: 0.0 },
        ],
      },
    ],
  },
};
