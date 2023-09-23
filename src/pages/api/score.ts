// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getScrubScore } from '@/data'
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
    const score = await getScrubScore({walletAddress})
    res.status(200).json({ score: score })
}
