// src/components/address/AddressSearchSection.tsx

type AddressSearchSectionProps = {
    address: string;
    onAddressChange: (value: string) => void;
    onSearch: () => void;
    loading: boolean;
    error: string | null;
  };
  
  export default function AddressSearchSection({
    address,
    onAddressChange,
    onSearch,
    loading,
    error,
  }: AddressSearchSectionProps) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-semibold">
            1
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm md:text-base">
              주소로 찾기
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              도로명 또는 지번 주소를 입력하면 시군구/법정동/번/지가 자동으로 채워집니다.
              (엑셀 일괄 업로드 기능은 나중에 여기로 확장 가능)
            </p>
          </div>
        </div>
  
        <div className="border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50/60 px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="예: 서울시 성북구 정릉동 239-0"
              className="flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
            />
            <button
              onClick={onSearch}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "주소 검색 중..." : "주소 검색"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-500">{error}</p>
          )}
          <p className="mt-2 text-[11px] text-sky-500">
            ※ 도로명주소 API 승인키가 올바르게 설정되어 있어야 합니다.
          </p>
        </div>
      </div>
    );
  }