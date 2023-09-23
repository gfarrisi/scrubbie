import { fetchAirstackData, getPurchases } from "./dataSource/airstack";
import { socialProfileScore } from "./socialProfile";

interface ScrubScoreProps {
  walletAddress: string;
  weights: {
    walletAge: number;
    socialProfile: number;
    numPurchases: number;
    pricePurchases: number;
    timeZoneCluster: number;
  };
  threshold: {
    walletAge: number;
    pricePurchases: number;
    numPurchases: number;
  };
}

export type Metric =
  | "walletAge"
  | "socialProfile"
  | "numPurchases"
  | "pricePurchases"
  | "timeZoneCluster";

export type MetricScore = {
  metric: Metric;
  score: number;
};

export type WeightAndThreshold = {
  weight: number;
  threshold: number | null;
};

export const weightAndThresholdDefaults = (
  scrubScoreProps: ScrubScoreProps,
  metric: Metric
): WeightAndThreshold => {
  const weight = scrubScoreProps.weights[metric];
  const threshold =
    metric === "socialProfile" || metric === "timeZoneCluster"
      ? null
      : scrubScoreProps.threshold[metric];
  return {
    weight,
    threshold,
  };
};

export const getScrubScore = async (scrubScoreProps: ScrubScoreProps) => {
  const walletData = await fetchAirstackData([scrubScoreProps?.walletAddress]);
  const socialScore = await socialProfileScore(
    walletData,
    weightAndThresholdDefaults(scrubScoreProps, "socialProfile")
  );
  const purchaseData = await getPurchases(scrubScoreProps?.walletAddress);
  // const walletAgeScore = await getWalletAgeScore(walletData, weightAndThresholdDefaults(scrubScoreProps, 'walletAge'))
  // const numPurchasesScore = await getNumPurchasesScore(walletData, weightAndThresholdDefaults(scrubScoreProps, 'numPurchases'))
  // const pricePurchasesScore = await getPricePurchasesScore(walletData, weightAndThresholdDefaults(scrubScoreProps, 'pricePurchases'))
  // const timeZoneClusterScore = await getTimeZoneClusterScore(walletData, weightAndThresholdDefaults(scrubScoreProps, 'timeZoneCluster'))

  return 0;
};
