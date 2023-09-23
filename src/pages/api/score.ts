// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getScrubScore } from '@/data/score'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    score: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    const walletAddress = req.query.walletAddress as string
    console.log({walletAddress})
    const score = await getScrubScore({
        walletAddress,
        weights: {
            walletAge: 1,
            socialProfile: 1,
            numPurchases: 1,
            pricePurchases: 1,
            timeZoneCluster: 1,
        },
        threshold: {
            walletAge: 1,
            pricePurchases: 2,
            numPurchases: 10,
        }
    })
    res.status(200).json({ score: score })
}
