import { hasSocialProfiles } from "./socialProfile";
import { getWalletAgeScore } from "./walletAge";

interface ScrubScoreProps {
    walletAddress: string;
    weights?: {
        walletAge: number;
        socialProfile: number;
        numPurchases: number;
        pricePurchases: number;
        timeZoneCluster: number;
    }
    threshold?: {
        walletAge: number;
        pricePurchases: number;
        numPurchases: number;
    }

}

export const getScrubScore = async (scrubScoreProps?: ScrubScoreProps) => {
    // const walletAgeScore = getWalletAgeScore('',0)
    const walletAddress = '0x1fDcf949E139dB1EEfdC5D7A2787AF15a73c26B4'
    const social = await hasSocialProfiles(walletAddress)
    console.log({social})
    return 0
}
