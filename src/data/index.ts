import { getWalletAgeScore } from "./walletAge";

interface ScrubScoreProps {
    walletAddress: string;
    weights: {
        walletAge: number;
        socialProfile: number;
        numPurchases: number;
        pricePurchases: number;
        timeZoneCluster: number;
    }
    threshold: {
        walletAge: number;
        pricePurchases: number;
        numPurchases: number;
    }

}

export const getScrubScore = (scrubScoreProps: ScrubScoreProps) => {
    const walletAgeScore = getWalletAgeScore('',0)
}