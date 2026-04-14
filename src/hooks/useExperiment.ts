import { useState, useEffect } from "react";
import { getExperiment } from "../assets/data/experiments";
import { getAbId, getVariant } from "../utils/experiment";

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
    if (!experiment || !experiment.enabled) {
      setResult({ variant: null, isReady: true });
      return;
    }

    const abId = getAbId();
    if (abId === null) {
      setResult({ variant: null, isReady: true });
      return;
    }

    setResult({ variant: getVariant(experiment, abId), isReady: true });
  }, [experimentName]);

  return result;
}
