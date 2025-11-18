// src/pages/api/building-owner.ts
// 건축물대장 소유자 정보 조회 API
import type { NextApiRequest, NextApiResponse } from "next";

const BASE_URL =
  "http://apis.data.go.kr/1613000/BldRgstService_v2/getBrOwnerInfo";

type SuccessResponse = {
  items: any[];
  raw?: any;
};

type ErrorResponse = {
  message: string;
  status?: number;
  body?: string;
  error?: string;
  requestUrl?: string;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const sigunguRaw = first(req.query.sigunguCd);
    const bjdongRaw = first(req.query.bjdongCd);
    const bunRaw = first(req.query.bun);
    const jiRaw = first(req.query.ji);
    const platGbRaw = first(req.query.platGbCd);
    const mgmBldrgstPk = first(req.query.mgmBldrgstPk); // 관리건축물대장PK

    if (!sigunguRaw || !bjdongRaw || !mgmBldrgstPk) {
      return res.status(400).json({
        message: "sigunguCd, bjdongCd, mgmBldrgstPk는 필수입니다.",
      });
    }

    const serviceKey = process.env.BUILDING_API_SERVICE_KEY;
    if (!serviceKey) {
      return res.status(500).json({
        message: "환경변수 BUILDING_API_SERVICE_KEY가 없습니다.",
      });
    }

    const sigunguCd = sigunguRaw.padStart(5, "0");

    let bjdongCd: string;
    if (bjdongRaw.length === 10) {
      bjdongCd = bjdongRaw.slice(5);
    } else {
      bjdongCd = bjdongRaw.padStart(5, "0");
    }

    const bun = bunRaw ? bunRaw.padStart(4, "0") : "";
    const ji = jiRaw ? jiRaw.padStart(4, "0") : "";
    const platGbCd = platGbRaw ?? "0";

    const url = new URL(BASE_URL);
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("sigunguCd", sigunguCd);
    url.searchParams.set("bjdongCd", bjdongCd);
    url.searchParams.set("mgmBldrgstPk", mgmBldrgstPk);
    url.searchParams.set("platGbCd", platGbCd);
    if (bun) url.searchParams.set("bun", bun);
    if (ji) url.searchParams.set("ji", ji);
    url.searchParams.set("numOfRows", "100");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("_type", "json");

    const requestUrl = url.toString();
    console.log("📡 소유자 정보 요청 URL:", requestUrl);

    const response = await fetch(requestUrl);
    const text = await response.text();

    if (!response.ok) {
      console.error("❌ 공공데이터 API 응답:", response.status, text);
      return res.status(500).json({
        message: "공공데이터 API 호출 실패",
        status: response.status,
        body: text,
        requestUrl,
      });
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e: any) {
      console.error("❌ JSON 파싱 오류:", e);
      return res.status(500).json({
        message: "공공데이터 응답 파싱 실패",
        status: response.status,
        body: text,
        error: e?.message,
        requestUrl,
      });
    }

    const items =
      data?.response?.body?.items?.item
        ? Array.isArray(data.response.body.items.item)
          ? data.response.body.items.item
          : [data.response.body.items.item]
        : [];

    return res.status(200).json({ items, raw: data });
  } catch (error: any) {
    console.error("❌ 서버 오류:", error);
    return res.status(500).json({
      message: "서버 오류",
      error: error?.message ?? "unknown error",
    });
  }
}


