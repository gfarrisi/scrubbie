import { getSocialProfiles } from "./dataSource/airstack";

export interface SocialProfile {
    lens: string | false;
    farcaster: string | false;
    ens: string | false
}

export const hasSocialProfiles = async (walletAddress: string):Promise<SocialProfile> => {
    //get social profiles for wallet using ens
    const socialProfiles = await getSocialProfiles(walletAddress);
    console.log({socialProfiles})
    return {
        lens: socialProfiles?.lens || false,
        farcaster: socialProfiles?.farcaster || false,
        ens:socialProfiles?.ens || false,
    }
}
