import type { ManualPageMeta } from "../backend/types";

export function PageList({
  pages,
  onSelect,
  activePath,
}: {
  pages: ManualPageMeta[];
  onSelect: (path: string) => void;
  activePath: string | null;
}) {
  const sections = new Map<string, ManualPageMeta[]>();
  for (const p of pages) {
    const list = sections.get(p.section) ?? [];
    list.push(p);
    sections.set(p.section, list);
  }
  const orderedSections = [...sections.entries()].sort(
    ([, a], [, b]) => a[0].sectionOrder - b[0].sectionOrder,
  );
  return (
    <nav aria-label="Manual pages">
      {orderedSections.map(([section, items]) => (
        <section key={section}>
          <h2>{section}</h2>
          <ul>
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((p) => (
                <li key={p.path}>
                  <button
                    data-testid={`page-${p.slug}`}
                    aria-current={p.path === activePath}
                    onClick={() => onSelect(p.path)}
                  >
                    {p.title}
                    {p.hasDraft ? " ●" : ""}
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
