// src/pages/api/address-search.ts
import type { NextApiRequest, NextApiResponse } from "next";

const JUSO_BASE = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const keyword = (req.query.keyword as string | undefined)?.trim();
  if (!keyword) {
    return res.status(400).json({ message: "keyword is required" });
  }

  const confmKey = process.env.JUSO_API_KEY;
  if (!confmKey) {
    return res
      .status(500)
      .json({ message: "JUSO_API_KEY is not configured" });
  }

  // ✨ 1) 더 이상 이상한 띄어쓰기 보정 안 함
  // 사용자가 입력한 그대로 보냄
  const searchKeyword = keyword;

  const params = new URLSearchParams({
    confmKey,
    currentPage: "1",
    countPerPage: "5",
    keyword: searchKeyword,
    resultType: "json",
  });

  const apiUrl = `${JUSO_BASE}?${params.toString()}`;

  try {
    console.log("[주소검색] 요청", { rawKeyword: keyword, apiUrl });

    const apiRes = await fetch(apiUrl);
    const text = await apiRes.text();

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("[주소검색] JSON 파싱 실패:", text);
      return res
        .status(502)
        .json({ message: "Juso 응답을 해석할 수 없습니다.", raw: text });
    }

    if (!apiRes.ok) {
      const msg =
        json?.results?.common?.errorMessage ||
        json?.message ||
        `Juso API 오류 (status: ${apiRes.status})`;
      return res.status(502).json({ message: msg, raw: json });
    }

    const juso = json.results?.juso;
    if (!juso || !Array.isArray(juso) || juso.length === 0) {
      return res
        .status(200)
        .json({ message: "검색 결과가 없습니다.", raw: json });
    }

    const first = juso[0];

    const admCd: string = first.admCd || "";
    const lnbrMnnm: string = first.lnbrMnnm || "";
    const lnbrSlno: string = first.lnbrSlno || "";

    let sigunguCd = "";
    let bjdongCd = "";
    let bun = "";
    let ji = "";

    if (admCd.length === 10) {
      sigunguCd = admCd.slice(0, 5); // 시군구코드
      bjdongCd = admCd.slice(5); // 법정동코드
    }

    if (lnbrMnnm) bun = lnbrMnnm.toString().padStart(4, "0");
    if (lnbrSlno) ji = lnbrSlno.toString().padStart(4, "0");

    console.log("[주소검색] 결과", {
      sigunguCd,
      bjdongCd,
      bun,
      ji,
      jibunAddr: first.jibunAddr,
      roadAddr: first.roadAddr,
    });

    return res.status(200).json({
      sigunguCd,
      bjdongCd,
      bun,
      ji,
      item: first,
      raw: json,
    });
  } catch (e: any) {
    console.error("[주소검색] 서버 오류", e);
    return res
      .status(500)
      .json({ message: "주소 검색 서버 오류가 발생했습니다." });
  }
}