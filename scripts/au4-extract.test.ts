import { describe, expect, test } from "bun:test";
import { parseAppMenu } from "./au4-extract/parse-appmenu";
import {
  parseBuiltinEffectSymbols,
  parseBuiltinLoader,
  parseNyquistHeader,
} from "./au4-extract/parse-effects";
import { parsePreferences } from "./au4-extract/parse-preferences";
import { parseShortcuts } from "./au4-extract/parse-shortcuts";
import { parseUiActions } from "./au4-extract/parse-uiactions";

/*
  Fixtures are verbatim excerpts of the Audacity 4 sources the extractor
  reads, pinning each idiom the parsers must understand. When upstream
  changes shape, these tests keep passing (they pin the parser, not the
  repo) — the live extraction's warnings are what surface the drift.
*/

describe("parseShortcuts", () => {
  const XML = `<?xml version='1.0' encoding='UTF-8'?>
<Shortcuts>
<!-- Dev -->
    <SC>
        <key>nav-dev-show-controls</key>
        <seq>Ctrl+F1</seq>
        <autorepeat>0</autorepeat>
    </SC>
<!-- Keyboard navigation -->
<!-- NOTE special context for navigation shortcuts because the notation has its own navigation system -->
    <SC>
        <key>nav-next-section</key>
        <seq>F6</seq>
        <seq>\`</seq>
    </SC>
<!-- end Trackedit actions -->
    <SC>
        <key>about</key>
    </SC>
</Shortcuts>
`;

  test("parses blocks with groups, multiple sequences and autorepeat", () => {
    const { shortcuts, warnings } = parseShortcuts(XML);
    expect(warnings).toEqual([]);
    expect(shortcuts).toEqual([
      {
        action: "nav-dev-show-controls",
        sequences: ["Ctrl+F1"],
        sourceGroup: "Dev",
        autorepeat: false,
      },
      {
        action: "nav-next-section",
        sequences: ["F6", "`"],
        sourceGroup: "Keyboard navigation",
      },
      { action: "about", sequences: [], sourceGroup: null },
    ]);
  });
});

describe("parseUiActions", () => {
  const CPP = `
static const ActionQuery PLAYBACK_PLAY_SELECTION_QUERY("action://playback/play-selection");
static const TranslatableString REPEAT_LAST_EFFECT_DEF_TITLE("action", "Repeat last effect");

const UiActionList PlaybackUiActions::m_mainActions = {
    UiAction(PLAYBACK_PLAY_SELECTION_QUERY.toString(),
             au::context::UiCtxProjectOpened,
             au::context::CTX_PROJECT_OPENED,
             TranslatableString("action", "Play selection"),
             TranslatableString("action", "Play the selected time range"),
             IconCode::Code::PLAY_FILL
             ),
    UiAction("toggle-loop-region",
             au::context::UiCtxProjectOpened,
             au::context::CTX_PROJECT_FOCUSED,
             TranslatableString("action", "Loop playback"),
             TranslatableString("action", "Toggle ‘Loop playback’"),
             IconCode::Code::LOOP,
             Checkable::Yes
             ),
    UiAction("audio-settings",
             au::context::UiCtxProjectOpened,
             au::context::CTX_PROJECT_FOCUSED,
             TranslatableString("action", "Audio settings"),
             TranslatableString("action", "Open audio setup dialog")
             ),
    UiAction("action://copy",
             { "action://trackedit/copy" },
             au::context::UiCtxAny,
             au::context::CTX_ANY,
             TranslatableString("action", "Copy"),
             TranslatableString("action", "Copy"),
             IconCode::Code::COPY
             ),
    UiAction("repeat-last-effect",
             au::context::UiCtxAny,
             au::context::CTX_ANY,
             REPEAT_LAST_EFFECT_DEF_TITLE,
             TranslatableString("action", "Repeat last effect")
             ),
    UiAction(EXTERNAL_CONSTANT,
             au::context::UiCtxAny,
             au::context::CTX_ANY,
             TranslatableString("action", "External"))
};
`;

  test("handles query constants, literals, alias lists, TS constants and Checkable", () => {
    const { actions, warnings } = parseUiActions(CPP, "playback", [
      'static const muse::actions::ActionCode EXTERNAL_CONSTANT("from-header");',
    ]);
    expect(warnings).toEqual([]);
    expect(actions.map((a) => a.code)).toEqual([
      "action://playback/play-selection",
      "toggle-loop-region",
      "audio-settings",
      "action://copy",
      "repeat-last-effect",
      "from-header",
    ]);
    expect(actions[0]).toMatchObject({
      title: "Play selection",
      description: "Play the selected time range",
      uiContext: "UiCtxProjectOpened",
      shortcutContext: "CTX_PROJECT_OPENED",
    });
    expect(actions[1].checkable).toBe(true);
    // Identical title/description collapses to title only.
    expect(actions[3]).toMatchObject({ title: "Copy", description: null });
    // Title via a file-level TranslatableString constant.
    expect(actions[4].title).toBe("Repeat last effect");
  });

  test("warns instead of silently dropping unresolvable blocks", () => {
    const { actions, warnings } = parseUiActions(
      `UiAction(mystery(), a, b, TranslatableString("action", "X"))`,
      "m",
    );
    expect(actions).toEqual([]);
    expect(warnings).toEqual(["m: unresolved action code: mystery()"]);
  });
});

describe("parseAppMenu", () => {
  const CPP = `
static const ActionCode RENAME_ITEM_CODE("rename-item");

void AppMenuModel::load()
{
    MenuItemList items {
        makeFileMenu(),
        makeViewMenu()
    };

    if (globalConfiguration()->devModeEnabled()) {
        const auto diagnosticMenu = makeDiagnosticMenu();
        items << diagnosticMenu;
    }

    setItems(items);
}

MenuItem* AppMenuModel::makeFileMenu()
{
    MenuItemList recentScoresList = makeRecentProjectsItems();

    MenuItemList fileItems {
        makeMenuItem("file-new"),
        makeMenu(TranslatableString("appshell-menu-file", "Open &recent"), recentScoresList, "menu-file-open", openRecentEnabled),
        makeSeparator(),
        // makeMenuItem("commented-away"),
        makeMenu(TranslatableString("appshell-menu-clip", "Clip"), makeClipItems(), "menu-clip"),
        makeMenuItem("quit", MenuItemRole::QuitRole)
    };

    return makeMenu(TranslatableString("appshell-menu-file", "&File"), fileItems, "menu-file");
}

MenuItem* AppMenuModel::makeViewMenu()
{
    MenuItem* effectsItem = makeMenuItem("toggle-effects");

    auto spectralMenu = makeMenu(TranslatableString("appshell-menu-select", "Spectral"),
                                 makeSpectralSelectionItems(), "menu-selection-spectral");
    spectralMenu->setState(spectralMenu->state().make_disabled());

    MenuItemList viewItems {
        spectralMenu,
        makeMenu(TranslatableString("appshell-menu-skip", "Skip to"), makeSkipToItems(), "menu-skip", false),
    };

    if (effectsItem) {
        viewItems << effectsItem;
    }

    viewItems << makeSeparator()
#ifdef MUSE_MODULE_WORKSPACE
        << makeMenu(TranslatableString("appshell-menu-view", "W&orkspaces"), m_workspacesMenuModel->items(), "menu-workspaces")
#endif
        << makeMenuItem("fullscreen");

    return makeMenu(TranslatableString("appshell-menu-view", "&View"), viewItems, "menu-view");
}

MenuItem* AppMenuModel::makeDiagnosticMenu()
{
    MenuItemList items {
        makeMenuItem("diagnostic-save-diagnostic-files")
    };
    return makeMenu(TranslatableString("appshell-menu-diagnostics", "&Diagnostics"), items, "menu-diagnostic");
}

MenuItemList AppMenuModel::makeClipItems()
{
    MenuItem* renameClipItem = makeMenuItem(RENAME_ITEM_CODE, TranslatableString("appshell-menu-clip", "Rename clip"));

    MenuItemList items {
        renameClipItem,
        makeMenuItem("trim-clip")
    };

    return items;
}

MenuItemList AppMenuModel::makeSpectralSelectionItems()
{
    MenuItemList items {
        makeMenuItem("toggle-spectral-selection")
    };

    return items;
}

MenuItemList AppMenuModel::makeSkipToItems()
{
    MenuItemList items {
        makeMenuItem("skip-to-selection-start")
    };

    return items;
}

MenuItemList AppMenuModel::makeRecentProjectsItems()
{
    MenuItemList items;
    const RecentFilesList& recentFiles = recentFilesController()->recentFilesList();
    return items;
}
`;

  test("reconstructs the tree with accelerators stripped and dynamic regions marked", () => {
    const { menus, warnings } = parseAppMenu(CPP);
    expect(warnings).toEqual([]);
    expect(menus.map((m) => m.title)).toEqual(["File", "View", "Diagnostics"]);

    const file = menus[0];
    expect(file.children).toEqual([
      { type: "item", code: "file-new" },
      {
        type: "menu",
        title: "Open recent",
        id: "menu-file-open",
        children: [{ type: "dynamic", source: "recent-files" }],
      },
      { type: "separator" },
      { type: "item", code: "commented-away", commentedOut: true },
      {
        type: "menu",
        title: "Clip",
        id: "menu-clip",
        children: [
          {
            type: "item",
            code: "rename-item",
            titleOverride: "Rename clip",
          },
          { type: "item", code: "trim-clip" },
        ],
      },
      { type: "item", code: "quit" },
    ]);

    const view = menus[1];
    expect(view.children).toEqual([
      {
        type: "menu",
        title: "Spectral",
        id: "menu-selection-spectral",
        disabled: true,
        children: [{ type: "item", code: "toggle-spectral-selection" }],
      },
      {
        type: "menu",
        title: "Skip to",
        id: "menu-skip",
        disabled: true,
        children: [{ type: "item", code: "skip-to-selection-start" }],
      },
      { type: "item", code: "toggle-effects" },
      { type: "separator" },
      {
        type: "menu",
        title: "Workspaces",
        id: "menu-workspaces",
        children: [{ type: "dynamic", source: "workspaces" }],
      },
      { type: "item", code: "fullscreen" },
    ]);

    expect(menus[2].devOnly).toBe(true);
  });
});

describe("parseBuiltinEffectSymbols / parseBuiltinLoader", () => {
  test("reads the Symbol declaration dialects", () => {
    const { effects, warnings } = parseBuiltinEffectSymbols(
      `
const ComponentInterfaceSymbol AmplifyEffect::Symbol { TranslatableString("effects-amplify", "Amplify") };
const ComponentInterfaceSymbol FilterCurveEq::Symbol{ wxT("Filter Curve"), TranslatableString("effects-filtercurveeq", "Filter Curve EQ") };
const ComponentInterfaceSymbol SilenceBase::Symbol
/*: noun */
{ TranslatableString("builtin-effects", "Silence", "generator") };
const ComponentInterfaceSymbol StereoToMono::Symbol { XO("Stereo To Mono") };
`,
      "fixture.cpp",
    );
    expect(warnings).toEqual([]);
    expect(effects.map((e) => e.name)).toEqual([
      "Amplify",
      "Filter Curve EQ",
      "Silence",
      "Stereo To Mono",
    ]);
  });

  test("reads registrations and view registrations", () => {
    const loader = parseBuiltinLoader(`
    static BuiltinEffectsModule::Registration< AmplifyEffect > regAmplify;
    static BuiltinEffectsModule::Registration< SilenceGenerator > regSilence;
    regView(AmplifyEffect::Symbol, u"qrc:/amplify/AmplifyView.qml");
`);
    expect(loader.registered).toEqual(["AmplifyEffect", "SilenceGenerator"]);
    expect(loader.withView).toEqual(["AmplifyEffect"]);
  });
});

describe("parseNyquistHeader", () => {
  test("reads the $-dialect", () => {
    const { effect } = parseNyquistHeader(
      `$nyquist plug-in
$version 5
$type process delayandreverb
$name (_ "Delay")
`,
      "delay.ny",
    );
    expect(effect).toEqual({
      name: "Delay",
      family: "nyquist",
      kind: "process",
      source: "delay.ny",
      subcategory: "delayandreverb",
    });
  });

  test("reads the legacy ;-dialect", () => {
    const { effect } = parseNyquistHeader(
      `;nyquist plug-in
;version 5
;type analyze nogroup
;name "Measure RMS"
`,
      "rms.ny",
    );
    expect(effect).toMatchObject({
      name: "Measure RMS",
      kind: "analyze",
      subcategory: "nogroup",
    });
  });
});

describe("parsePreferences", () => {
  test("reads makeItem entries, including wrapped QT_TRANSLATE_NOOP", () => {
    const { pages, warnings } = parsePreferences(`
    QList<PreferencePageItem*> items {
        makeItem("general", QT_TRANSLATE_NOOP("preferences", "General"), IconCode::Code::SETTINGS_COG,
                 "Preferences/GeneralPreferencesPage.qml"),

        makeItem("playback-recording", QT_TRANSLATE_NOOP("preferences",
                                                         "Playback/Recording"), IconCode::Code::MICROPHONE,
                 "Preferences/PlaybackPreferencesPage.qml"),

        makeItem("cloud", QT_TRANSLATE_NOOP("preferences", "Cloud"), IconCode::Code::CLOUD, ""),
    };
`);
    expect(warnings).toEqual([]);
    expect(pages).toEqual([
      {
        id: "general",
        title: "General",
        qmlPage: "Preferences/GeneralPreferencesPage.qml",
      },
      {
        id: "playback-recording",
        title: "Playback/Recording",
        qmlPage: "Preferences/PlaybackPreferencesPage.qml",
      },
      { id: "cloud", title: "Cloud", qmlPage: null },
    ]);
  });
});
