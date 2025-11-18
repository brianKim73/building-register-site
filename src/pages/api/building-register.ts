// src/pages/api/building-register.ts
import type { NextApiRequest, NextApiResponse } from "next";

// 건축HUB 건축물대장 표제부 조회 API (getBrTitleInfo)
// 공식 가이드 기준 URL: https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo
const BASE_URL =
  "https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo";

type SuccessResponse = {
  items: any[];
  raw: any;
};

type ErrorResponse = {
  message: string;
  status?: number;
  body?: string;
  error?: string;
  requestUrl?: string;
  resultCode?: string;
  resultMsg?: string;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // GET만 허용
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ── 1) 쿼리 파라미터 정리 ──────────────────────────────
    const sigunguRaw = first(req.query.sigunguCd);
    const bjdongRaw = first(req.query.bjdongCd);
    const bunRaw = first(req.query.bun);
    const jiRaw = first(req.query.ji);
    const platGbRaw = first(req.query.platGbCd); // 0: 대지, 1: 산, 2: 블록

    if (!sigunguRaw || !bjdongRaw) {
      return res.status(400).json({
        message: "sigunguCd와 bjdongCd는 필수입니다.",
      });
    }

    const serviceKey = process.env.BUILDING_API_SERVICE_KEY;
    if (!serviceKey) {
      return res.status(500).json({
        message: "환경변수 BUILDING_API_SERVICE_KEY가 없습니다.",
      });
    }

    // ── 2) 코드 / 자리수 보정 ─────────────────────────────
    // 시군구코드: 5자리 (예: 11680, 11290 …)
    const sigunguCd = sigunguRaw.padStart(5, "0");

    // 법정동코드: 5자리 사용
    // - 10자리 코드가 들어오면 뒤 5자리만 사용 (행정표준코드 10자리 대응)
    let bjdongCd: string;
    if (bjdongRaw.length === 10) {
      bjdongCd = bjdongRaw.slice(5);
    } else {
      bjdongCd = bjdongRaw.padStart(5, "0");
    }

    // 번/지: 4자리 (0012, 0000 형식)
    const bun = bunRaw ? bunRaw.padStart(4, "0") : "";
    const ji = jiRaw ? jiRaw.padStart(4, "0") : "";

    // 대지구분코드: 기본값 0(대지)
    const platGbCd = platGbRaw ?? "0";

    // ── 3) 요청 URL 구성 ──────────────────────────────────
    const url = new URL(BASE_URL);
    // Decoding 키 그대로 사용 (추가 인코딩 X)
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("sigunguCd", sigunguCd);
    url.searchParams.set("bjdongCd", bjdongCd);
    url.searchParams.set("platGbCd", platGbCd);

    if (bun) url.searchParams.set("bun", bun);
    if (ji) url.searchParams.set("ji", ji);

    // 페이징 기본값
    url.searchParams.set("numOfRows", "100");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("_type", "json");

    const requestUrl = url.toString();
    console.log("📡 요청 URL:", requestUrl);

    // ── 4) 공공데이터 API 호출 ────────────────────────────
    const response = await fetch(requestUrl);
    const text = await response.text();

    if (!response.ok) {
      console.error("❌ 공공데이터 API HTTP 오류:", response.status, text);
      return res.status(500).json({
        message: "공공데이터 API 호출 실패 (HTTP 에러)",
        status: response.status,
        body: text,
        requestUrl,
      });
    }

    // ── 5) JSON 파싱 및 resultCode 체크 ───────────────────
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

    const header = data?.response?.header;
    const body = data?.response?.body;

    const resultCode = header?.resultCode;
    const resultMsg = header?.resultMsg;

    // 공공데이터 표준: 00 = 정상, 그 외 = 오류
    if (resultCode !== "00") {
      console.error("❌ 공공데이터 API 비정상 코드:", header);
      return res.status(502).json({
        message: "공공데이터 API 오류",
        status: response.status,
        body: text,
        requestUrl,
        resultCode,
        resultMsg,
      });
    }

    const itemsRaw = body?.items?.item;
    const items = Array.isArray(itemsRaw)
      ? itemsRaw
      : itemsRaw
      ? [itemsRaw]
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