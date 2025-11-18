// src/pages/index.tsx
import { useState } from "react";

type BuildingItem = {
  [key: string]: any;
};

type JusoItem = {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  admCd: string;
  siNm: string;
  sggNm: string;
  emdNm: string;
  rn: string;
  buldMnnm: string;
  buldSlno: string;
  lnbrMnnm: string;
  lnbrSlno: string;
  mtYn: string;
};

export default function Home() {
  // 건축물대장 조회용 코드 상태
  const [sigunguCd, setSigunguCd] = useState("11680"); // 강남구 샘플
  const [bjdongCd, setBjdongCd] = useState("10300"); // 개포동 샘플
  const [platGbCd, setPlatGbCd] = useState("0"); // 0: 대지
  const [bun, setBun] = useState("0012");
  const [ji, setJi] = useState("0000");

  const [items, setItems] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 주소 검색 상태
  const [addressKeyword, setAddressKeyword] = useState("");
  const [addressResults, setAddressResults] = useState<JusoItem[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // 건축물대장 조회
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

    const headers = Object.keys(items[0]);

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

  const hasResult = items.length > 0;

  // 주소 검색 호출
  const handleAddressSearch = async () => {
    const keyword = addressKeyword.trim();
    if (!keyword) {
      setAddressError("주소(도로명 또는 지번)를 입력해 주세요.");
      return;
    }

    setAddressLoading(true);
    setAddressError(null);
    setAddressResults([]);

    try {
      const res = await fetch(
        `/api/address-search?keyword=${encodeURIComponent(keyword)}`
      );
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.message || `주소 검색 실패 (status: ${res.status})`;
        throw new Error(msg);
      }

      const common = data?.results?.common;
      if (common?.errorCode && common.errorCode !== "0") {
        throw new Error(common.errorMessage || "주소 검색 에러");
      }

      const list: JusoItem[] = data?.results?.juso ?? [];
      setAddressResults(list);
      if (!list.length) {
        setAddressError("검색 결과가 없습니다.");
      }
    } catch (e: any) {
      console.error(e);
      setAddressError(e?.message ?? "주소 검색 중 오류가 발생했습니다.");
    } finally {
      setAddressLoading(false);
    }
  };

  // 주소 선택 시 코드 자동 세팅 + 건축물대장 조회
  const handleSelectAddress = (item: JusoItem) => {
    // admCd: 10자리 행정구역코드 (시군구 5 + 법정동 5)
    const admCd = item.admCd ?? "";
    if (admCd.length >= 5) {
      setSigunguCd(admCd.slice(0, 5));
    }
    if (admCd.length >= 10) {
      setBjdongCd(admCd.slice(5, 10));
    }

    // 지번 본번/부번 → bun/ji (4자리 0패딩)
    const bunNum =
      item.lnbrMnnm !== null && item.lnbrMnnm !== undefined
        ? String(item.lnbrMnnm)
        : "";
    const jiNum =
      item.lnbrSlno !== null && item.lnbrSlno !== undefined
        ? String(item.lnbrSlno)
        : "";

    const paddedBun = bunNum ? bunNum.padStart(4, "0") : "0000";
    const paddedJi = jiNum ? jiNum.padStart(4, "0") : "0000";

    setBun(paddedBun);
    setJi(paddedJi);

    // 산 여부(mtYn) → platGbCd (0: 대지, 1: 산)
    const mtYn = (item.mtYn ?? "0").toString();
    setPlatGbCd(mtYn === "1" ? "1" : "0");

    // 검색결과 목록 닫기
    setAddressResults([]);

    // 건축물대장 즉시 조회
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              건축물대장 조회 · CSV 다운로드
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              건축HUB 건축물대장 표제부 API를 사용하여
              시군구/법정동/번/지 기준으로 건축물 정보를 조회합니다.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            <div>시범 값: 강남구 개포동 12-0</div>
            <div>sigunguCd=11680 / bjdongCd=10300 / bun=0012 / ji=0000</div>
          </div>
        </header>

        {/* 검색 카드 */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-6 mb-6 shadow-lg shadow-black/40 space-y-4">
          {/* 주소 검색 영역 */}
          <div>
            <h2 className="font-semibold mb-2 text-slate-100">
              1. 주소로 찾기
            </h2>
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <input
                value={addressKeyword}
                onChange={(e) => setAddressKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddressSearch();
                  }
                }}
                placeholder="예: 서울특별시 성북구 정릉동 239-0 또는 강남구 개포동 12-0"
                className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <button
                onClick={handleAddressSearch}
                disabled={addressLoading}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-sm font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {addressLoading ? "주소 검색 중..." : "주소 검색"}
              </button>
            </div>
            {addressError && (
              <p className="mt-1 text-xs text-red-400">{addressError}</p>
            )}

            {addressResults.length > 0 && (
              <div className="mt-3 max-h-56 overflow-auto border border-slate-800 rounded-xl bg-slate-950/80 text-xs">
                {addressResults.map((item, idx) => (
                  <button
                    key={`${item.admCd}-${item.roadAddr}-${idx}`}
                    type="button"
                    onClick={() => handleSelectAddress(item)}
                    className="w-full text-left px-3 py-2 border-b border-slate-800 hover:bg-slate-800/70 transition"
                  >
                    <div className="font-medium text-slate-100">
                      {item.roadAddr}
                    </div>
                    <div className="text-slate-400">
                      지번: {item.jibunAddr} · 우편번호: {item.zipNo}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 코드 직접 입력 영역 */}
          <div>
            <h2 className="font-semibold mb-3 text-slate-100">
              2. 코드로 조회 (자동 채움 가능)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-300">
                  시군구코드 (sigunguCd)
                </label>
                <input
                  value={sigunguCd}
                  onChange={(e) => setSigunguCd(e.target.value)}
                  placeholder="예: 11680 (강남구)"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-300">
                  법정동코드 (bjdongCd)
                </label>
                <input
                  value={bjdongCd}
                  onChange={(e) => setBjdongCd(e.target.value)}
                  placeholder="예: 10300 (개포동)"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-300">
                  대지구분 (platGbCd)
                </label>
                <select
                  value={platGbCd}
                  onChange={(e) => setPlatGbCd(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="0">0 - 대지</option>
                  <option value="1">1 - 산</option>
                  <option value="2">2 - 블록</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-300">
                  번 (bun)
                </label>
                <input
                  value={bun}
                  onChange={(e) => setBun(e.target.value)}
                  placeholder="예: 0012"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-slate-300">
                  지 (ji)
                </label>
                <input
                  value={ji}
                  onChange={(e) => setJi(e.target.value)}
                  placeholder="예: 0000"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* 버튼/에러 영역 */}
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "조회 중..." : "조회하기"}
              </button>
              <button
                onClick={handleDownloadCsv}
                disabled={!hasResult}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                CSV 다운로드
              </button>

              {error && (
                <p className="text-xs text-red-400 ml-0 md:ml-3">
                  에러: {error}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 결과 영역 */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-100">
              조회 결과{" "}
              <span className="text-sm text-emerald-400">
                ({items.length}건)
              </span>
            </h2>
            {hasResult && (
              <span className="text-xs text-slate-500">
                컬럼 헤더는 공공데이터 API 응답 필드명을 그대로 사용합니다.
              </span>
            )}
          </div>

          {!hasResult && !loading && !error && (
            <p className="text-sm text-slate-500">
              아직 조회 결과가 없습니다. 상단에서 조건을 입력하고
              &quot;조회하기&quot;를 눌러 보세요.
            </p>
          )}

          {loading && (
            <p className="text-sm text-slate-400">
              데이터를 불러오는 중입니다…
            </p>
          )}

          {hasResult && (
            <div className="mt-2 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <div className="max-h-[520px] overflow-auto text-xs">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-900 sticky top-0 z-10">
                    <tr>
                      {Object.keys(items[0]).map((key) => (
                        <th
                          key={key}
                          className="border border-slate-800 px-2 py-1 text-left font-semibold"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={
                          rowIdx % 2 === 0 ? "bg-slate-950" : "bg-slate-900/60"
                        }
                      >
                        {Object.keys(items[0]).map((key) => (
                          <td
                            key={key}
                            className="border border-slate-900 px-2 py-1 align-top"
                          >
                            {String(item[key] ?? "")}
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