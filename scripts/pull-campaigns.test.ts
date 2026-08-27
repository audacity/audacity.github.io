import { describe, expect, test } from "bun:test";
import {
  assertUrlsFromSource,
  buildCampaignBundle,
  cellText,
  extractPromoTable,
  formatReport,
  mapRowToPromo,
  mergeCampaignBundleAdditively,
  parseCliArgs,
  parseConfluencePageReference,
  renderCampaignModule,
  resolveTimeline,
  toCamelCaseId,
  type ConfluencePagePayload,
  type ExtractedRow,
} from "./pull-campaigns";

const TABLE_HTML = `
<table>
  <tbody>
    <tr><th>Dates (From - to )</th><th>Partner/product</th><th>Copy</th><th>Audacity</th><th>MuseScore.org</th><th>Results</th><th>Notes</th></tr>
    <tr>
      <td>May 28-June 11</td>
      <td><p>URL: <a href="https://www.musehub.com/plugin/denoiser?utm_source=au-web-banner&amp;utm_medium=au-banner">link</a></p></td>
      <td><p>Denoiser: The smart noise removal tool for clean audio.</p></td>
      <td><p>Top Banner</p></td>
      <td>N/A</td><td></td><td></td>
    </tr>
    <tr>
      <td>Apr 29 to May 13</td>
      <td><a href="https://www.musehub.com/course/audacity-explained?utm_source=au-web-banner">link</a></td>
      <td>Audacity Explained: The complete guide. CTA Copy: Learn more</td>
      <td>Top Banner</td>
      <td>N/A</td><td></td><td></td>
    </tr>
    <tr>
      <td>Feb 18 to xx</td>
      <td><a href="https://www.musehub.com/app/overtune-studio?utm_source=au-web">link</a></td>
      <td>Overtune: record your vocals.</td>
      <td><p>Video embed Video URL: https://www.youtube.com/watch?v=A4jPvCdbrKA</p></td>
      <td>N/A</td><td></td><td></td>
    </tr>
    <tr>
      <td>Oct 21 to 29</td>
      <td><a href="https://www.musehub.com/app/mooz?utm_source=mss-web">link</a></td>
      <td>MOOZ video platform</td>
      <td>N/A</td>
      <td>Promo banner</td><td></td><td></td>
    </tr>
  </tbody>
</table>`;

const TODAY = new Date("2026-05-27T00:00:00.000Z");

describe("parseCliArgs", () => {
  test("parses flags and custom output", () => {
    const parsed = parseCliArgs([
      "--dry-run",
      "--clean-copy",
      "--output",
      "tmp/promos.ts",
      "--page-url",
      "https://confluence.example.com/spaces/TEAM/pages/123456789/example",
    ]);
    expect(parsed.dryRun).toBe(true);
    expect(parsed.cleanCopy).toBe(true);
    expect(parsed.outputPath.endsWith("tmp/promos.ts")).toBe(true);
    expect(parsed.pageUrl).toContain("123456789");
  });

  test("rejects unknown arguments", () => {
    expect(() => parseCliArgs(["--nope"])).toThrow("Unknown argument");
  });
});

describe("parseConfluencePageReference", () => {
  test("extracts origin and page id", () => {
    expect(
      parseConfluencePageReference(
        "https://confluence.example.com/spaces/TEAM/pages/123456789/Title+Here",
      ),
    ).toEqual({
      origin: "https://confluence.example.com",
      pageId: "123456789",
      pageUrl:
        "https://confluence.example.com/spaces/TEAM/pages/123456789/Title+Here",
    });
  });

  test("throws when no page id is present", () => {
    expect(() =>
      parseConfluencePageReference("https://confluence.example.com/dashboard"),
    ).toThrow();
  });
});

describe("cellText", () => {
  test("strips tags, decodes entities, collapses whitespace", () => {
    expect(cellText("<p>SOAP &amp;  Capture<br/>now</p>")).toBe(
      "SOAP & Capture now",
    );
  });
});

describe("extractPromoTable", () => {
  test("returns one row per data row with URLs collected", () => {
    const rows = extractPromoTable(TABLE_HTML);
    expect(rows).toHaveLength(4);
    expect(rows[0].dates).toBe("May 28-June 11");
    expect(rows[0].placement).toBe("Top Banner");
    expect(rows[0].urls).toContain(
      "https://www.musehub.com/plugin/denoiser?utm_source=au-web-banner&utm_medium=au-banner",
    );
  });

  test("returns [] when the calendar table is missing", () => {
    expect(extractPromoTable("<p>no table here</p>")).toEqual([]);
  });
});

describe("resolveTimeline", () => {
  test("anchors the newest row near today and walks years backwards", () => {
    const rows = extractPromoTable(TABLE_HTML);
    const timeline = resolveTimeline(rows, TODAY);
    expect(timeline[0]).toEqual({
      startDate: "2026-05-28",
      endDate: "2026-06-11",
    });
    expect(timeline[1]).toEqual({
      startDate: "2026-04-29",
      endDate: "2026-05-13",
    });
    // Open-ended ("to xx") yields a start with no end.
    expect(timeline[2]).toEqual({ startDate: "2026-02-18" });
    // Older row resolves into a prior year, not a future one.
    expect(timeline[3].startDate?.startsWith("2025-")).toBe(true);
  });

  test("rolls a cross-year range's end into the next year", () => {
    const rows: ExtractedRow[] = [
      {
        dates: "Dec 3 to Feb 18",
        product: "",
        copy: "X",
        placement: "Top Banner",
        urls: [],
      },
    ];
    const [resolved] = resolveTimeline(rows, TODAY);
    expect(resolved.startDate?.endsWith("-12-03")).toBe(true);
    const startYear = Number(resolved.startDate?.slice(0, 4));
    expect(resolved.endDate).toBe(`${startYear + 1}-02-18`);
  });
});

describe("toCamelCaseId", () => {
  test("camelCases and expands ampersands", () => {
    expect(toCamelCaseId("SOAP Voice Clean & Capture")).toBe(
      "soapVoiceCleanAndCapture",
    );
    expect(toCamelCaseId("Denoiser")).toBe("denoiser");
  });
});

describe("mapRowToPromo", () => {
  test("maps a banner row with derived tracking and exact URL", () => {
    const rows = extractPromoTable(TABLE_HTML);
    const mapped = mapRowToPromo(rows[0], {
      startDate: "2026-05-28",
      endDate: "2026-06-11",
    });
    expect(mapped?.id).toBe("denoiser");
    expect(mapped?.promo.type).toBe("banner");
    expect(mapped?.promo.osTargets).toEqual(["Windows", "OS X"]);
    expect(mapped?.promo.cta?.link).toContain("utm_medium=au-banner");
    expect(mapped?.promo.tracking?.name).toBe("Denoiser MuseHub");
  });

  test("uses the inline CTA Copy label", () => {
    const rows = extractPromoTable(TABLE_HTML);
    const mapped = mapRowToPromo(rows[1], {});
    expect(mapped?.promo.cta?.text).toBe("Learn more");
  });

  test("maps a video row, deriving embed + thumbnail from the watch URL", () => {
    const rows = extractPromoTable(TABLE_HTML);
    const mapped = mapRowToPromo(rows[2], { startDate: "2026-02-18" });
    expect(mapped?.promo.type).toBe("video");
    expect(mapped?.promo.slot).toBe(2);
    expect(mapped?.promo.video?.videoURL).toBe(
      "https://www.youtube-nocookie.com/embed/A4jPvCdbrKA?autoplay=1",
    );
    expect(mapped?.promo.video?.placeholderImage).toBe(
      "https://i.ytimg.com/vi/A4jPvCdbrKA/maxresdefault.jpg",
    );
  });

  test("skips rows that are not Audacity placements", () => {
    const rows = extractPromoTable(TABLE_HTML);
    expect(mapRowToPromo(rows[3], {})).toBeNull(); // MOOZ: Audacity = N/A
  });
});

describe("buildCampaignBundle", () => {
  test("keeps active/upcoming promos and reports the rest as ignored", () => {
    const rows = extractPromoTable(TABLE_HTML);
    const timeline = resolveTimeline(rows, TODAY);
    const bundle = buildCampaignBundle(rows, timeline, "2026-05-27");

    expect(Object.keys(bundle.bannerPromos)).toEqual(["denoiser"]);
    expect(Object.keys(bundle.videoPromos)).toEqual(["overtune"]);
    // Audacity Explained ended 2026-05-13 -> dropped as past.
    expect(
      bundle.ignoredEntries.some((entry) =>
        entry.includes("audacityExplained"),
      ),
    ).toBe(true);
    // MOOZ row is MuseScore-only (Audacity = N/A) -> dropped as non-Audacity.
    expect(
      bundle.ignoredEntries.some((entry) => entry.includes("Oct 21 to 29")),
    ).toBe(true);
  });
});

describe("mergeCampaignBundleAdditively", () => {
  test("keeps existing promos and applies fresh updates", () => {
    const merged = mergeCampaignBundleAdditively(
      {
        bannerPromos: {
          legacy: {
            type: "banner",
            isActive: true,
            message: "Legacy promo",
            cta: { text: "Open", link: "https://example.com/legacy" },
          },
        },
        videoPromos: {},
      },
      {
        bannerPromos: {
          denoiser: {
            type: "banner",
            isActive: true,
            message: "Fresh promo",
            cta: { text: "Open", link: "https://example.com/fresh" },
          },
        },
        videoPromos: {},
        summary: "ignored",
        ignoredEntries: ["past-row"],
      },
      "2026-06-09",
    );

    expect(Object.keys(merged.bannerPromos).sort()).toEqual([
      "denoiser",
      "legacy",
    ]);
    expect(merged.summary).toContain("after additive merge");
    expect(merged.ignoredEntries).toEqual(["past-row"]);
  });
});

describe("assertUrlsFromSource", () => {
  const sourceUrls = ["https://www.musehub.com/plugin/denoiser?x=1"];

  test("accepts URLs present verbatim in the source", () => {
    const bundle = {
      bannerPromos: {
        denoiser: {
          type: "banner" as const,
          message: "x",
          cta: {
            text: "Go",
            link: "https://www.musehub.com/plugin/denoiser?x=1",
          },
        },
      },
      videoPromos: {},
      summary: "",
      ignoredEntries: [],
    };
    expect(() => assertUrlsFromSource(bundle, sourceUrls)).not.toThrow();
  });

  test("rejects a destination URL that is not in the source", () => {
    const bundle = {
      bannerPromos: {
        denoiser: {
          type: "banner" as const,
          message: "x",
          cta: {
            text: "Go",
            link: "https://www.musehub.com/plugin/denoiser?x=2",
          },
        },
      },
      videoPromos: {},
      summary: "",
      ignoredEntries: [],
    };
    expect(() => assertUrlsFromSource(bundle, sourceUrls)).toThrow(
      "not found in Confluence",
    );
  });

  test("accepts derived YouTube embed/thumbnail when the id is in the source", () => {
    const bundle = {
      bannerPromos: {},
      videoPromos: {
        overtune: {
          type: "video" as const,
          message: "x",
          video: {
            placeholderImage:
              "https://i.ytimg.com/vi/A4jPvCdbrKA/maxresdefault.jpg",
            imageAltText: "x",
            videoURL:
              "https://www.youtube-nocookie.com/embed/A4jPvCdbrKA?autoplay=1",
          },
        },
      },
      summary: "",
      ignoredEntries: [],
    };
    expect(() =>
      assertUrlsFromSource(bundle, [
        "https://www.youtube.com/watch?v=A4jPvCdbrKA",
      ]),
    ).not.toThrow();
  });
});

describe("formatReport", () => {
  test("reports what was written and lists the ignored rows", () => {
    const page: ConfluencePagePayload = {
      origin: "https://confluence.example.com",
      pageId: "123456789",
      pageUrl:
        "https://confluence.example.com/spaces/TEAM/pages/123456789/Title",
      storageHtml: "",
      title: "Promo calendar",
      version: 61,
    };
    const report = formatReport(
      page,
      {
        bannerPromos: {},
        videoPromos: {},
        summary: "2 banner + 1 video promo(s)",
        ignoredEntries: ["Apr 29 to May 13 — audacityExplained (past)"],
      },
      "/out/campaigns.ts",
    );
    expect(report).toContain("Source: Promo calendar (version 61)");
    expect(report).toContain("2 banner + 1 video promo(s)");
    expect(report).toContain("Wrote /out/campaigns.ts");
    expect(report).toContain("Ignored rows");
    expect(report).toContain("audacityExplained (past)");
  });
});

describe("renderCampaignModule", () => {
  test("renders typed exports without leaking source URL or report into the file", () => {
    const rendered = renderCampaignModule({
      bannerPromos: {
        denoiser: {
          type: "banner",
          isActive: true,
          message: "Denoiser",
          cta: {
            text: "Get it",
            link: "https://www.musehub.com/plugin/denoiser",
          },
        },
      },
      videoPromos: {},
      summary: "1 banner + 0 video promo(s)",
      ignoredEntries: ["should not appear in file"],
    });

    expect(rendered).toContain("campaignBannerPromos");
    expect(rendered).toContain("campaignVideoPromos");
    expect(rendered).toContain("Denoiser");
    expect(rendered).toContain("do not edit");

    // No URL of any kind may land in the comment header — that is where an
    // internal source link would otherwise leak. (Public promo URLs live in
    // the data below, not in comments.)
    const commentLines = rendered
      .split("\n")
      .filter((line) => line.trimStart().startsWith("//"));
    expect(commentLines.some((line) => /https?:\/\//.test(line))).toBe(false);

    // The sync report (summary + ignored rows) is not baked into the file.
    expect(rendered).not.toContain("should not appear in file");
  });
});
