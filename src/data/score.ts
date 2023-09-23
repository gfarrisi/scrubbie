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

interface ScrubScoreProps {
  walletAddress: string;
  weights: {
    walletActivity: number;
    diversePurchaseFrequency: number;
    purchaseSpike: number;
    pricePerPurchaseDistribution: number;
    tieredSocialProfile: number;
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

// Purchase Frequency considering diverse purchases
const diversePurchaseFrequencyScore = (
  wallet: WalletData,
  minMax: MinMaxData
): number => {
  if (wallet.purchases.total === 0) return 1;
  const uniqueDestinations = new Set(wallet.purchases.destinations).size;
  const diversityScore = uniqueDestinations / wallet.purchases.total;
  const frequency = wallet.purchases.frequency || 0;
  return normalize(frequency * diversityScore, 0, minMax.maxFrequency);
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

// Price per Purchase distribution
const pricePerPurchaseDistributionScore = (
  wallet: WalletData,
  minMax: MinMaxData
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

  return normalize(standardDeviation, 0, normalizationMax);
};

// Social Profile with tiered system
const tieredSocialProfileScore = (wallet: WalletData): number => {
  // Assuming 3 is the highest level of verification. Adjust if needed.
  return 1 - wallet.profileScore / 3;
};

// Utility function for normalization
const normalize = (value: number, min: number, max: number): number => {
  if (min === max) return 1; // handle potential divide by zero
  return (value - min) / (max - min);
};

// Combined spam score
const computeSpamScore = (
  wallet: WalletData,
  weights: {
    walletActivity: number;
    diversePurchaseFrequency: number;
    purchaseSpike: number;
    pricePerPurchaseDistribution: number;
    tieredSocialProfile: number;
  },
  minMax: MinMaxData
): number => {
  // Normalize the weights
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalizedWeights = {
    walletActivity: weights.walletActivity / totalWeight,
    diversePurchaseFrequency: weights.diversePurchaseFrequency / totalWeight,
    purchaseSpike: weights.purchaseSpike / totalWeight,
    pricePerPurchaseDistribution:
      weights.pricePerPurchaseDistribution / totalWeight,
    tieredSocialProfile: weights.tieredSocialProfile / totalWeight,
  };

  const walletAgeScore =
    normalizedWeights.walletActivity * walletActivityScore(wallet, minMax);
  console.log("walletAgeScore", walletAgeScore);
  const socialProfileScore =
    normalizedWeights.tieredSocialProfile * tieredSocialProfileScore(wallet);
  console.log("socialProfileScore", socialProfileScore);
  const purchaseSpike =
    normalizedWeights.purchaseSpike * purchaseSpikeScore(wallet, minMax);
  console.log("purchaseSpike", purchaseSpike);
  const pricePerPurchaseDistribution =
    normalizedWeights.pricePerPurchaseDistribution *
    pricePerPurchaseDistributionScore(wallet, minMax);
  console.log("pricePerPurchaseDistribution", pricePerPurchaseDistribution);
  const diversePurchaseFrequency =
    normalizedWeights.diversePurchaseFrequency *
    diversePurchaseFrequencyScore(wallet, minMax);
  console.log("diversePurchaseFrequency", diversePurchaseFrequency);

  const combinedScore =
    walletAgeScore +
    socialProfileScore +
    purchaseSpike +
    pricePerPurchaseDistribution +
    diversePurchaseFrequency;

  return combinedScore;
};

export const getScrubScore = async (scrubScoreProps: ScrubScoreProps) => {
  const socialData = await getSocialProfiles(scrubScoreProps?.walletAddress);
  const purchaseData = await getPurchases(scrubScoreProps?.walletAddress);
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
    minMaxData
  );
  console.log("spamScore", spamScore);
  return 1 - spamScore;
};
