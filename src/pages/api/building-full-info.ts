// src/pages/api/building-full-info.ts
// 건축물대장 전체 정보 조회 (기본정보, 전유부, 소유자 정보 통합)
import type { NextApiRequest, NextApiResponse } from "next";

type SuccessResponse = {
  titleInfo: any[]; // 기본정보
  exposInfo: any[]; // 전유부 정보
  ownerInfo: any[]; // 소유자 정보
};

type ErrorResponse = {
  message: string;
  status?: number;
  body?: string;
  error?: string;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function fetchBuildingData(
  url: string,
  serviceKey: string,
  params: {
    sigunguCd: string;
    bjdongCd: string;
    bun?: string;
    ji?: string;
    platGbCd: string;
    mgmBldrgstPk?: string;
  }
) {
  const apiUrl = new URL(url);
  apiUrl.searchParams.set("serviceKey", serviceKey);
  apiUrl.searchParams.set("sigunguCd", params.sigunguCd);
  apiUrl.searchParams.set("bjdongCd", params.bjdongCd);
  apiUrl.searchParams.set("platGbCd", params.platGbCd);
  if (params.bun) apiUrl.searchParams.set("bun", params.bun);
  if (params.ji) apiUrl.searchParams.set("ji", params.ji);
  if (params.mgmBldrgstPk) {
    apiUrl.searchParams.set("mgmBldrgstPk", params.mgmBldrgstPk);
  }
  apiUrl.searchParams.set("numOfRows", "100");
  apiUrl.searchParams.set("pageNo", "1");
  apiUrl.searchParams.set("_type", "json");

  const response = await fetch(apiUrl.toString());
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`API 호출 실패: ${response.status} - ${text}`);
  }

  const data = JSON.parse(text);
  const items =
    data?.response?.body?.items?.item
      ? Array.isArray(data.response.body.items.item)
        ? data.response.body.items.item
        : [data.response.body.items.item]
      : [];

  return items;
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

    // 1. 기본정보 조회
    const titleInfo = await fetchBuildingData(
      "http://apis.data.go.kr/1613000/BldRgstService_v2/getBrTitleInfo",
      serviceKey,
      { sigunguCd, bjdongCd, bun, ji, platGbCd }
    );

    if (titleInfo.length === 0) {
      return res.status(404).json({
        message: "건축물 정보를 찾을 수 없습니다.",
      });
    }

    // mgmBldrgstPk 추출 (첫 번째 결과 사용)
    const mgmBldrgstPk = titleInfo[0]?.mgmBldrgstPk;

    if (!mgmBldrgstPk) {
      return res.status(400).json({
        message: "관리건축물대장PK를 찾을 수 없습니다.",
      });
    }

    // 2. 전유부 정보 조회
    let exposInfo: any[] = [];
    try {
      exposInfo = await fetchBuildingData(
        "http://apis.data.go.kr/1613000/BldRgstService_v2/getBrExposPubuseAreaInfo",
        serviceKey,
        { sigunguCd, bjdongCd, bun, ji, platGbCd, mgmBldrgstPk }
      );
    } catch (e: any) {
      console.warn("전유부 정보 조회 실패:", e.message);
    }

    // 3. 소유자 정보 조회
    let ownerInfo: any[] = [];
    try {
      ownerInfo = await fetchBuildingData(
        "http://apis.data.go.kr/1613000/BldRgstService_v2/getBrOwnerInfo",
        serviceKey,
        { sigunguCd, bjdongCd, bun, ji, platGbCd, mgmBldrgstPk }
      );
    } catch (e: any) {
      console.warn("소유자 정보 조회 실패:", e.message);
    }

    return res.status(200).json({
      titleInfo,
      exposInfo,
      ownerInfo,
    });
  } catch (error: any) {
    console.error("❌ 서버 오류:", error);
    return res.status(500).json({
      message: "서버 오류",
      error: error?.message ?? "unknown error",
    });
  }
}


