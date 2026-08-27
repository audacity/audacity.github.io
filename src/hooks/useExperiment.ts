import { useState, useEffect } from "react";
import { getExperiment } from "../assets/data/experiments";
import { resolveVariant } from "../utils/experiment";

type UseExperimentResult = {
  variant: string | null;
  isReady: boolean;
};

export function useExperiment(experimentName: string): UseExperimentResult {
  const [result, setResult] = useState<UseExperimentResult>({
    variant: null,
    isReady: false,
  });

  useEffect(() => {
    const experiment = getExperiment(experimentName);
    // resolveVariant handles the ?ab= force (any experiment) and the
    // enabled-only auto-assignment, so the hook just reflects its result.
    setResult({
      variant: experiment ? resolveVariant(experiment) : null,
      isReady: true,
    });
  }, [experimentName]);

  return result;
}
