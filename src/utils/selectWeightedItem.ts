type FallbackStrategy = "random" | "highest";

type SelectWeightedItemOptions = {
  fallback?: FallbackStrategy;
};

export const selectWeightedItem = <T>(
  items: T[],
  getWeight: (item: T) => number,
  options: SelectWeightedItemOptions = {},
): T | null => {
  if (items.length === 0) {
    return null;
  }

  const fallback = options.fallback ?? "random";
  const weightedItems = items.map((item) => ({
    item,
    weight: Math.max(getWeight(item), 0),
  }));

  const totalWeight = weightedItems.reduce(
    (sum, weightedItem) => sum + weightedItem.weight,
    0,
  );

  if (totalWeight <= 0) {
    if (fallback === "highest") {
      let selected = weightedItems[0];

      for (const weightedItem of weightedItems) {
        if (weightedItem.weight > selected.weight) {
          selected = weightedItem;
        }
      }

      return selected?.item ?? null;
    }

    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex] ?? null;
  }

  let threshold = Math.random() * totalWeight;

  for (const weightedItem of weightedItems) {
    threshold -= weightedItem.weight;
    if (threshold <= 0) {
      return weightedItem.item;
    }
  }

  return weightedItems[weightedItems.length - 1]?.item ?? null;
};
