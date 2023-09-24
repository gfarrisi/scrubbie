import { PurchasePattern, ScrubScoreResult } from "@/pages";
import {
  PurchaseData,
  SocialData,
  getEarliestTransaction,
  getPurchases,
  getSocialProfiles,
} from "./dataSource/airstack";

interface WalletData {
  creationDate: Date | null;
  walletAge: number | null;
  transactions: number;
  purchases: {
    frequency: number;
    total: number;
    values: number[];
    destinations: string[];
  };
  profileScore: number;
}

export interface ScrubScoreCriteria {
  walletAddress: string;
  weights: {
    walletActivity: number;
    frequencyPatternConsistency: number; //change to automated interval
    purchaseSpike: number; //number of purchases
    pricePerPurchaseDistribution: number; //highest price spent
    tieredSocialProfile: number;
  };
  threshold: {
    walletAge: number;
    maxEthSpent: number;
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

interface MinMaxData {
  oldestWalletDate: Date;
  maxTransactions: number;
  maxFrequency: number;
  maxTotalPurchases: number;
  globalMaxPurchaseValue: number;
  globalMinPurchaseValue: number;
}

export const DEFAULT_VALUES: MinMaxData = {
  oldestWalletDate: new Date("2015-07-30"), // Ethereum's launch date
  maxTransactions: 3000, // Assuming 3000 transactions a year
  maxFrequency: 800, // Assuming 800 unique transactions a year
  maxTotalPurchases: 350, // Assuming 350 purchases a year
  globalMaxPurchaseValue: 250, // In ETH
  globalMinPurchaseValue: 0.005, // In ETH
};

export const calculateMinMax = (wallets: WalletData[] = []): MinMaxData => {
  let oldestWalletDate = new Date(); // default to the current date
  let maxTransactions = 0;
  let maxFrequency = 0;
  let maxTotalPurchases = 0;
  let globalMaxPurchaseValue = Number.MIN_VALUE; // start with the smallest possible number
  let globalMinPurchaseValue = Number.MAX_VALUE; // start with the largest possible number

  if (wallets.length === 0) {
    return DEFAULT_VALUES;
  }

  for (let wallet of wallets) {
    // Check if the wallet's creation date is older than the oldest so far
    if (
      wallet.creationDate &&
      wallet.creationDate instanceof Date &&
      wallet.creationDate < oldestWalletDate
    ) {
      oldestWalletDate = wallet.creationDate;
    }

    if (wallet.transactions > maxTransactions) {
      maxTransactions = wallet.transactions;
    }

    if (wallet.purchases.frequency > maxFrequency) {
      maxFrequency = wallet.purchases.frequency;
    }

    if (wallet.purchases.total > maxTotalPurchases) {
      maxTotalPurchases = wallet.purchases.total;
    }

    // Update global max and min purchase values
    for (let value of wallet.purchases.values) {
      if (value > globalMaxPurchaseValue) {
        globalMaxPurchaseValue = value;
      }
      if (value < globalMinPurchaseValue) {
        globalMinPurchaseValue = value;
      }
    }
  }

  return {
    oldestWalletDate,
    maxTransactions,
    maxFrequency,
    maxTotalPurchases,
    globalMaxPurchaseValue,
    globalMinPurchaseValue,
  };
};

export const createWalletData = (
  purchases: PurchaseData[],
  walletAge: string | null,
  social: SocialData
): WalletData => {
  const transactions = purchases.length;

  const values = purchases.map((item) => {
    return (
      Number(item.paymentAmount) / Math.pow(10, item.paymentToken.decimals)
    );
  });

  const destinations = purchases.flatMap((item) => {
    return item.nfts.map((nft) => nft.token.address);
  });

  let creationDate: Date | null = null;
  let walletAgeDays: number | null = null;
  let frequency: number;

  if (walletAge) {
    creationDate = new Date(walletAge);

    // Calculate the wallet's age in days
    walletAgeDays =
      (new Date().getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24);

    // Calculate the frequency as the total transactions over wallet age
    frequency = transactions / walletAgeDays;
  } else {
    creationDate = null; // Setting to null indicating that the creation date is unknown
    walletAgeDays = null; // Setting to null indicating that the wallet age is unknown
    frequency = -1; // Using -1 (or any other special value) to signify unknown frequency
  }

  return {
    creationDate: creationDate,
    walletAge: walletAgeDays,
    transactions: transactions,
    purchases: {
      frequency: frequency,
      total: transactions,
      values: values,
      destinations: destinations,
    },
    profileScore: social.profileScore,
  };
};

// Wallet age
const walletAgeScore = (wallet: WalletData, minMax: MinMaxData): number => {
  if (!wallet.creationDate) return 0;
  const ageDays =
    (new Date().getTime() - wallet.creationDate.getTime()) /
    (1000 * 60 * 60 * 24);
  const oldestWalletAgeDays = new Date(minMax.oldestWalletDate).getTime();
  return normalize(ageDays, 0, oldestWalletAgeDays);
};

// Wallet age with activity ratio
const walletActivityScore = (
  wallet: WalletData,
  minMax: MinMaxData
): number => {
  if (!wallet.creationDate) return 1;
  const age =
    (new Date().getTime() - wallet.creationDate.getTime()) /
    (1000 * 60 * 60 * 24);
  if (age === 0) return 0;
  const activityRatio = wallet.transactions / age;
  return normalize(activityRatio, 0, minMax.maxTransactions / age);
};

// Combined score for wallet age and activity
const combinedWalletAgeScore = (
  wallet: WalletData,
  minMax: MinMaxData,
  threshold: number
): number => {
  if (!wallet.creationDate) return 1;
  const walletAgeDays =
    (new Date().getTime() - wallet.creationDate.getTime()) /
    (1000 * 60 * 60 * 24);
  const maxWalletAgeDays =
    (new Date().getTime() - minMax.oldestWalletDate.getTime()) /
    (1000 * 60 * 60 * 24);
  const factor = modulationFactor(
    walletAgeDays,
    0,
    maxWalletAgeDays,
    threshold
  );
  return (
    factor *
    ((2 / 3) * walletAgeScore(wallet, minMax) +
      (1 / 3) * walletActivityScore(wallet, minMax))
  );
};

// Number of Purchases distribution over time
const purchaseSpikeScore = (wallet: WalletData, minMax: MinMaxData): number => {
  if (!wallet.creationDate) return 1;
  const purchasesPerDay =
    wallet.purchases.total /
    ((new Date().getTime() - wallet.creationDate.getTime()) /
      (1000 * 60 * 60 * 24));
  return normalize(
    purchasesPerDay,
    0,
    minMax.maxTotalPurchases /
      ((new Date().getTime() - minMax.oldestWalletDate.getTime()) /
        (1000 * 60 * 60 * 24))
  );
};

// Number of Purchases
const numOfPurchasesScore = (
  wallet: WalletData,
  minMax: MinMaxData
): number => {
  return normalize(wallet.purchases.total, 0, minMax.maxTotalPurchases);
};

// Combined score for number of purchases
const combinedPurchaseScore = (
  wallet: WalletData,
  minMax: MinMaxData,
  threshold: number
): number => {
  const factor = modulationFactor(
    wallet.purchases.total,
    0,
    minMax.maxTotalPurchases,
    threshold
  );
  return (
    factor *
    ((numOfPurchasesScore(wallet, minMax) +
      purchaseSpikeScore(wallet, minMax)) /
      2)
  );
};

// Price per Purchase distribution
const pricePerPurchaseDistributionScore = (
  wallet: WalletData,
  minMax: MinMaxData,
  threshold: number
): number => {
  if (wallet.purchases.total === 0 || wallet.purchases.values.length === 0) {
    return 1;
  }
  const mean =
    wallet.purchases.values.reduce((a, b) => a + b, 0) / wallet.purchases.total;
  const variance =
    wallet.purchases.values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    wallet.purchases.total;
  const standardDeviation = Math.sqrt(variance);
  const maxPurchase = Math.max(...wallet.purchases.values);
  const minPurchase = Math.min(...wallet.purchases.values);
  const range = maxPurchase - minPurchase;

  // If there's only one unique purchase value, the range will be 0, so we'll use the global range as a fallback.
  const normalizationMax =
    range > 0
      ? range
      : minMax.globalMaxPurchaseValue - minMax.globalMinPurchaseValue;

  const factor = modulationFactor(
    mean,
    minMax.globalMinPurchaseValue,
    minMax.globalMaxPurchaseValue,
    threshold
  );
  return factor * normalize(standardDeviation, 0, normalizationMax);
};

// Social Profile with tiered system
const tieredSocialProfileScore = (wallet: WalletData): number => {
  // Assuming 4 is the highest level of verification. Adjust if needed.
  return 1 - wallet.profileScore / 4;
};

// Utility function for normalization
const normalize = (value: number, min: number, max: number): number => {
  if (min === max) return 1; // handle potential divide by zero
  return (value - min) / (max - min);
};

// Modulation function that returns a value between 0 and 1 taking into account the threshold
const modulationFactor = (
  value: number,
  min: number,
  max: number,
  threshold: number
): number => {
  if (value < threshold) {
    // Value is between min and threshold
    return (value - min) / (threshold - min);
  }
  // Value is between threshold and max
  return 1 - (value - threshold) / (max - threshold);
};

const patternConsistencyScore = (purchases: PurchaseData[]): number => {
  if (purchases.length < 2) return 0.25;

  const deltas: number[] = [];

  // Calculate time differences between consecutive purchases
  for (let i = 1; i < purchases.length; i++) {
    const currentPurchaseTime = new Date(purchases[i].blockTimestamp).getTime();
    const previousPurchaseTime = new Date(
      purchases[i - 1].blockTimestamp
    ).getTime();
    const delta =
      (currentPurchaseTime - previousPurchaseTime) / (1000 * 60 * 60); // Delta in hours
    if (delta <= 24) {
      // Filter out purchases that are more than a day apart
      deltas.push(delta);
    }
  }

  if (deltas.length < 2) return 0.25;

  // Count deltas that fall into specific buckets
  const buckets: {
    [key: string]: number;
  } = {};
  deltas.forEach((delta) => {
    const rounded = Math.round(delta); // can adjust rounding for precision
    buckets[rounded] = (buckets[rounded] || 0) + 1;
  });

  // Find most common delta
  const mostCommonDelta = parseFloat(
    Object.keys(buckets).reduce((a, b) => (buckets[a] > buckets[b] ? a : b))
  );

  // Calculate percentage of deltas that are around the most common delta
  const tolerance = 0.5;
  const patternedDeltas = deltas.filter(
    (delta) => Math.abs(delta - mostCommonDelta) <= tolerance
  );
  const score = 1 - patternedDeltas.length / deltas.length;

  return score;
};

// Combined spam score
const computeSpamScore = (
  wallet: WalletData,
  weights: {
    walletActivity: number;
    frequencyPatternConsistency: number;
    purchaseSpike: number;
    pricePerPurchaseDistribution: number;
    tieredSocialProfile: number;
  },
  minMax: MinMaxData,
  threshold: {
    walletAge: number;
    maxEthSpent: number;
    numPurchases: number;
  },
  purchases: PurchaseData[]
): number => {
  // Normalize the weights
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalizedWeights = {
    walletActivity: weights.walletActivity / totalWeight,
    frequencyPatternConsistency:
      weights.frequencyPatternConsistency / totalWeight,
    purchaseSpike: weights.purchaseSpike / totalWeight,
    pricePerPurchaseDistribution:
      weights.pricePerPurchaseDistribution / totalWeight,
    tieredSocialProfile: weights.tieredSocialProfile / totalWeight,
  };

  const walletAgeScore =
    normalizedWeights.walletActivity *
    combinedWalletAgeScore(wallet, minMax, threshold.walletAge);
  console.log("walletAgeScore", walletAgeScore);
  const socialProfileScore =
    normalizedWeights.tieredSocialProfile * tieredSocialProfileScore(wallet);
  console.log("socialProfileScore", socialProfileScore);
  const numPurchaseScore =
    normalizedWeights.purchaseSpike *
    combinedPurchaseScore(wallet, minMax, threshold.numPurchases);
  console.log("numPurchaseScore", numPurchaseScore);
  const pricePerPurchaseDistribution =
    normalizedWeights.pricePerPurchaseDistribution *
    pricePerPurchaseDistributionScore(wallet, minMax, threshold.maxEthSpent);
  console.log("pricePerPurchaseDistribution", pricePerPurchaseDistribution);
  const frequencyPatternConsistency =
    normalizedWeights.frequencyPatternConsistency *
    patternConsistencyScore(purchases);
  console.log("frequencyPatternConsistency", frequencyPatternConsistency);

  const combinedScore =
    walletAgeScore +
    socialProfileScore +
    numPurchaseScore +
    pricePerPurchaseDistribution +
    frequencyPatternConsistency;

  return combinedScore;
};

export const getScrubScore = async (
  scrubScoreProps: ScrubScoreCriteria
): Promise<ScrubScoreResult> => {
  const socialData = await getSocialProfiles(scrubScoreProps?.walletAddress);
  const purchaseData = await getPurchases(scrubScoreProps?.walletAddress);
  let maxPurchaseValue = 0;
  purchaseData.forEach((purchase) => {
    const purchaseValue =
      Number(purchase.paymentAmount) /
      Math.pow(10, purchase.paymentToken.decimals);
    if (purchaseValue > maxPurchaseValue) {
      maxPurchaseValue = purchaseValue;
    }
  });
  const earliestTransaction = await getEarliestTransaction(
    scrubScoreProps?.walletAddress
  );
  const walletData = createWalletData(
    purchaseData,
    earliestTransaction,
    socialData
  );
  console.log("walletData", walletData);
  const minMaxData = calculateMinMax();
  const spamScore = computeSpamScore(
    walletData,
    scrubScoreProps.weights,
    minMaxData,
    scrubScoreProps.threshold,
    purchaseData
  );
  console.log("spamScore", spamScore);
  const scrubScore = 1 - spamScore;
  const walletAddressOrENS =
    socialData.primaryDomain || scrubScoreProps.walletAddress;
  const walletAgeDays = walletData.walletAge;
  const totalWeight = Object.values(scrubScoreProps.weights).reduce(
    (a, b) => a + b,
    0
  );
  const normalizedWeightPatternConsistency =
    scrubScoreProps.weights.frequencyPatternConsistency / totalWeight;
  const patternConsistencyMetric =
    normalizedWeightPatternConsistency * patternConsistencyScore(purchaseData);
  return {
    score: Math.round(scrubScore * 100),
    walletAddressOrENS: walletAddressOrENS,
    walletAgeDays: !!walletAgeDays ? Math.round(walletAgeDays) : null,
    highestPurchase: maxPurchaseValue,
    totalPurchases: purchaseData.length,
    purchasePatterns:
      purchaseData.length > 0
        ? patternConsistencyMetric > 0.15
          ? PurchasePattern.Unusual
          : PurchasePattern.Normal
        : PurchasePattern.NotAvailable,
    socialProfiles: {
      ens: socialData?.primaryDomain,
      lens: socialData?.lensProfileName,
      farcaster: socialData?.farcasterProfileName,
      xmtp: socialData?.isXMTPEnabled,
    },
  };
};
