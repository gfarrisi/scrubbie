import { ScrubScoreCriteria } from "@/data/score";
import { atom } from "jotai";

export const scrubScoreAtom = atom<ScrubScoreCriteria>({
  walletAddress: "vitalik.eth",
  weights: {
    walletActivity: 1,
    frequencyPatternConsistency: 3,
    purchaseSpike: 1,
    pricePerPurchaseDistribution: 3,
    tieredSocialProfile: 2,
  },
  threshold: {
    walletAge: 0.8,
    maxEthSpent: 0.1,
    numPurchases: 10,
  },
});
