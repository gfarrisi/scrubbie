import { getWalletAge } from "./dataSource/airstack"

export const matchestWalletAgeThreshold = (walletAddress: string, threshold: number) => {
    const walletAge = getWalletAge(walletAddress)
    return  walletAge > threshold 
}


export const getWalletAgeScore = (walletAddress: string, threshold: number) => {
   return 0
}