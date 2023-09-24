// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getScrubScore } from "@/data/score";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  score: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const walletAddress = req.query.walletAddress as string;
  console.log({ walletAddress });
  const score = await getScrubScore({
    walletAddress,
    weights: {
      walletActivity: 1,
      frequencyPatternConsistency: 1,
      purchaseSpike: 1,
      pricePerPurchaseDistribution: 1,
      tieredSocialProfile: 1,
    },
    threshold: {
      walletAge: 1,
      maxEthSpent: 2,
      numPurchases: 10,
    },
  });
  res.status(200).json({ score: score });
}
