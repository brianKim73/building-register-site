// src/pages/api/address-search.ts
import type { NextApiRequest, NextApiResponse } from "next";

const JUSO_ENDPOINT =
  "https://business.juso.go.kr/addrlink/addrLinkApi.do";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { keyword, page = "1", size = "10" } = req.query;

  if (!keyword || typeof keyword !== "string") {
    return res.status(400).json({ message: "keyword is required" });
  }

  const confmKey = process.env.JUSO_API_KEY;
  if (!confmKey) {
    return res
      .status(500)
      .json({ message: "JUSO_API_KEY is not configured" });
  }

  const params = new URLSearchParams({
    confmKey,
    currentPage: String(page),
    countPerPage: String(size),
    keyword,
    resultType: "json",
    firstSort: "road", // 도로명 우선 정렬
  });

  try {
    const response = await fetch(`${JUSO_ENDPOINT}?${params.toString()}`);
    const text = await response.text();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ message: "Juso API error", body: text });
    }

    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Juso API error:", error);
    return res
      .status(500)
      .json({ message: "Failed to call Juso API", error: String(error) });
  }
}
