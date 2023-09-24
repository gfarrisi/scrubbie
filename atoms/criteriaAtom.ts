import { ScrubScoreCriteria } from "@/data/score";
import { atom } from "jotai";
export const scrubScoreAtom = atom<ScrubScoreCriteria>({
    walletAddress: 'vitalik.eth',
    weights: {
      walletActivity: 1,
      diversePurchaseFrequency: 3,
      purchaseSpike: 1,
      pricePerPurchaseDistribution: 3,
      tieredSocialProfile: 2
    },
    threshold: {
      walletAge: .8,
      maxEthSpent: .1,
      numPurchases: 10,
    }
  }
);
