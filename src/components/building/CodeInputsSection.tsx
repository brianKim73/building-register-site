// src/components/building/CodeInputsSection.tsx

type CodeInputsSectionProps = {
    sigunguCd: string;
    bjdongCd: string;
    platGbCd: string;
    bun: string;
    ji: string;
    onSigunguCdChange: (value: string) => void;
    onBjdongCdChange: (value: string) => void;
    onPlatGbCdChange: (value: string) => void;
    onBunChange: (value: string) => void;
    onJiChange: (value: string) => void;
  };
  
  export default function CodeInputsSection({
    sigunguCd,
    bjdongCd,
    platGbCd,
    bun,
    ji,
    onSigunguCdChange,
    onBjdongCdChange,
    onPlatGbCdChange,
    onBunChange,
    onJiChange,
  }: CodeInputsSectionProps) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-medium mb-1 text-slate-500">
            시군구코드
          </label>
          <input
            value={sigunguCd}
            onChange={(e) => onSigunguCdChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1 text-slate-500">
            법정동코드
          </label>
          <input
            value={bjdongCd}
            onChange={(e) => onBjdongCdChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1 text-slate-500">
            대지구분
          </label>
          <select
            value={platGbCd}
            onChange={(e) => onPlatGbCdChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            <option value="0">0 - 대지</option>
            <option value="1">1 - 산</option>
            <option value="2">2 - 블록</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1 text-slate-500">
            번 (bun)
          </label>
          <input
            value={bun}
            onChange={(e) => onBunChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1 text-slate-500">
            지 (ji)
          </label>
          <input
            value={ji}
            onChange={(e) => onJiChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </div>
    );
  }