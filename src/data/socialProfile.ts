import { AirstackWalletData } from "./dataSource/airstack";
import { WeightAndThreshold } from "./score";

export interface SocialProfile {
    lens: string | false;
    farcaster: string | false;
    ens: string | false
}



export const socialProfileScore = async (walletData: AirstackWalletData, metricDetails: WeightAndThreshold):Promise<{
    data: SocialProfile;
    score: number;
}> => {
    let score = 0;

    const lens = walletData.socials.find((social) => social.dappName === 'lens')
    const farcaster = walletData.socials.find((social) => social.dappName === 'farcaster')
    const ens = walletData.primaryDomain.name

    if (lens) {
        score += 100
    }
    if (farcaster) {
        score += 100
    }
    if (ens) {
        score += 100
    }

    score = score / 3
    score = score * metricDetails.weight

    return {
        data:{
            lens: lens?.profileName || false,
            farcaster: farcaster?.profileName || false,
            ens: ens || false,
        }, 
        score
    }

}
