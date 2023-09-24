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
  const reqBody = req.body;
  const score = await getScrubScore(reqBody);
  res.status(200).json(score);
}
