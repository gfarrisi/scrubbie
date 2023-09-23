import { getSocialProfiles } from "./dataSource/airstack";

export interface SocialProfile {
    lens: string | false;
    farcaster: string | false;
    ens: string | false
}

export const hasSocialProfiles = async (walletAddress: string):Promise<SocialProfile> => {
    //get social profiles for wallet using ens
    const socialProfiles = await getSocialProfiles(walletAddress);
    return {
        lens: false,
        farcaster: false,
        ens: false
    }
}
