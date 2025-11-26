// src/pages/index.tsx
import AddressSearchSection from "../components/address/AddressSearchSection";
import RadioRow from "../components/common/RadioRow"; // 이미 있을 수도 있음
import CodeInputsSection from "../components/building/CodeInputsSection";
import IssueTypeSelector from "../components/building/IssueTypeSelector";
import { useState } from "react";

type BuildingItem = {
  [key: string]: any;
};

// 화면에 보여줄 주요 컬럼 정의
const COLUMNS: { key: string; label: string }[] = [
  { key: "platPlc", label: "대지위치" },
  { key: "mainPurpsCdNm", label: "주용도" },
  { key: "totArea", label: "연면적(㎡)" },
  { key: "bcRat", label: "건폐율(%)" },
  { key: "vlRat", label: "용적률(%)" },
  { key: "grndFlrCnt", label: "지상층수" },
  { key: "ugrndFlrCnt", label: "지하층수" },
  { key: "useAprDay", label: "사용승인일" },
  { key: "mgmBldrgstPk", label: "관리번호" },
];

type IssueType = "TITLE" | "EXPOS" | "BOTH";


export default function Home() {
  // 기본 샘플 값: 강남구 개포동 12-0
  const [address, setAddress] = useState("강남구 개포동 12-0");

  const [sigunguCd, setSigunguCd] = useState("11680");
  const [bjdongCd, setBjdongCd] = useState("10300");
  const [platGbCd, setPlatGbCd] = useState("0");
  const [bun, setBun] = useState("0012");
  const [ji, setJi] = useState("0000");

  const [items, setItems] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주소 검색 상태
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // 발급 옵션
  const [issueType, setIssueType] = useState<IssueType>("TITLE");

  const hasResult = items.length > 0;

  // 🔍 1단계: 주소 검색 (Juso API 사용)
  const handleAddressSearch = async () => {
    if (!address.trim()) {
      setAddressError("주소를 입력해 주세요.");
      return;
    }

    setAddressLoading(true);
    setAddressError(null);

    try {
      const params = new URLSearchParams();
      params.set("keyword", address.trim());

      const res = await fetch(`/api/address-search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.resultMsg ||
          data?.message ||
          `주소 검색 실패 (status: ${res.status})`;
        throw new Error(msg);
      }

      // 1️⃣ 백엔드에서 sigunguCd/bjdongCd/bun/ji를 직접 내려주는 경우
      if (data.sigunguCd && data.bjdongCd) {
        setSigunguCd(data.sigunguCd || sigunguCd);
        setBjdongCd(data.bjdongCd || bjdongCd);
        if (data.bun) setBun(data.bun);
        if (data.ji) setJi(data.ji);
        setAddressError(null);
        return;
      }

      // 2️⃣ Juso 원본(results.juso)을 그대로 주는 경우 대비
      const juso =
        data.results?.juso && Array.isArray(data.results.juso)
          ? data.results.juso[0]
          : null;

      if (!juso) {
        throw new Error(
          data.message || "검색 결과가 없습니다. 다른 주소로 시도해 보세요."
        );
      }

      const admCd: string = juso.admCd || ""; // 10자리 행정동 코드
      const lnbrMnnm: string = juso.lnbrMnnm || ""; // 본번
      const lnbrSlno: string = juso.lnbrSlno || ""; // 부번

      if (admCd.length === 10) {
        const nextSigungu = admCd.slice(0, 5); // 시군구코드
        const nextBjdong = admCd.slice(5, 10); // 법정동코드
        const nextBun = lnbrMnnm ? lnbrMnnm.toString().padStart(4, "0") : bun;
        const nextJi = lnbrSlno ? lnbrSlno.toString().padStart(4, "0") : ji;

        setSigunguCd(nextSigungu);
        setBjdongCd(nextBjdong);
        setBun(nextBun);
        setJi(nextJi);
        setAddressError(null);
      } else {
        throw new Error("행정동 코드(admCd)를 해석할 수 없습니다.");
      }
    } catch (e: any) {
      console.error(e);
      setAddressError(e?.message ?? "주소 검색 중 오류가 발생했습니다.");
    } finally {
      setAddressLoading(false);
    }
  };

  // 🧾 3단계: 건축물대장 조회
  const handleSearch = async () => {
    if (!sigunguCd || !bjdongCd) {
      setError("시군구코드와 법정동코드는 필수입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("sigunguCd", sigunguCd.trim());
      params.set("bjdongCd", bjdongCd.trim());
      if (platGbCd) params.set("platGbCd", platGbCd.trim());
      if (bun) params.set("bun", bun.trim());
      if (ji) params.set("ji", ji.trim());

      const res = await fetch(`/api/building-register?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.resultMsg ||
          data?.message ||
          `조회 실패 (status: ${res.status})`;
        throw new Error(msg);
      }

      setItems(data.items || []);
    } catch (e: any) {
      console.error(e);
      setItems([]);
      setError(e?.message ?? "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // CSV 다운로드
  const handleDownloadCsv = () => {
    if (!items.length) return;

    const headers = COLUMNS.map((c) => c.key);

    const csvRows = [
      headers.join(","), // 헤더
      ...items.map((item) =>
        headers
          .map((h) => {
            const v = item[h] ?? "";
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "building-register.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 text-slate-900">
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* 헤더 영역 */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            건축물대장 자동 발급 시스템
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-500">
            주소를 입력하거나 코드 정보를 채워서 건축HUB 건축물대장을 바로
            조회하고, CSV로 내려받을 수 있습니다.
          </p>
        </header>

        {/* 메인 카드: 1~3단계 */}
        <section className="bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-sky-100 border border-sky-100 p-6 md:p-8 space-y-8">
          {/* 1단계: 주소 검색 */}
          {/* 1단계: 주소 검색 섹션 */}
          <AddressSearchSection
            address={address}
            onAddressChange={setAddress}
            onSearch={handleAddressSearch}
            loading={addressLoading}
            error={addressError}
          />

          {/* 2단계: 코드 / 발급 옵션 */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-sm md:text-base">
                  코드 및 발급 옵션 선택
                </h2>
                <p className="text-xs md:text-sm text-slate-500">
                  자동으로 채워진 코드 값을 확인하거나 직접 수정할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 코드 입력 라인 */}
            <CodeInputsSection
              sigunguCd={sigunguCd}
              bjdongCd={bjdongCd}
              platGbCd={platGbCd}
              bun={bun}
              ji={ji}
              onSigunguCdChange={setSigunguCd}
              onBjdongCdChange={setBjdongCd}
              onPlatGbCdChange={setPlatGbCd}
              onBunChange={setBun}
              onJiChange={setJi}
            />

            {/* 발급 옵션 라디오 → 컴포넌트 */}
            <IssueTypeSelector
              issueType={issueType}
              onChange={setIssueType}
            />
          
          </div>

          {/* 3단계: 실행 및 다운로드 */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-sm md:text-base">
                  실행 및 다운로드
                </h2>
                <p className="text-xs md:text-sm text-slate-500">
                  조회 후 결과를 화면에서 확인하고, 필요하면 CSV 파일로
                  내려받으세요.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "조회 중..." : "건축물대장 조회"}
              </button>
              <button
                onClick={handleDownloadCsv}
                disabled={!hasResult}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm text-slate-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                CSV 다운로드
              </button>

              {error && (
                <p className="text-xs text-red-500 mt-1">에러: {error}</p>
              )}
            </div>
          </div>
        </section>

        {/* 조회 결과 카드 */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              조회 결과{" "}
              <span className="text-xs text-sky-600">({items.length}건)</span>
            </h2>
            {hasResult && (
              <span className="text-[11px] md:text-xs text-slate-400">
                컬럼은 공공데이터 API의 주요 필드만 선별하여 표시합니다.
              </span>
            )}
          </div>

          {!hasResult && !loading && !error && (
            <p className="text-sm text-slate-500 bg-white/70 border border-dashed border-slate-200 rounded-2xl px-4 py-6 text-center">
              아직 조회 결과가 없습니다. 위의 단계를 따라 주소를 입력하고{" "}
              <span className="font-semibold">“건축물대장 조회”</span> 버튼을
              눌러 보세요.
            </p>
          )}

          {loading && (
            <p className="text-sm text-slate-500 bg-white/80 rounded-2xl px-4 py-6 text-center">
              건축물대장 정보를 불러오는 중입니다…
            </p>
          )}

          {hasResult && (
            <div className="bg-white/90 rounded-2xl shadow-md shadow-slate-100 border border-slate-100 overflow-hidden">
              <div className="max-h-[520px] overflow-auto text-xs">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="border border-slate-100 px-2 py-2 text-left font-semibold text-slate-700 whitespace-nowrap"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={
                          rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                        }
                      >
                        {COLUMNS.map((col) => (
                          <td
                            key={col.key}
                            className="border border-slate-100 px-2 py-2 align-top text-slate-700"
                          >
                            {String(item[col.key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}