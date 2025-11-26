// src/components/common/RadioRow.tsx

type RadioRowProps = {
    label: string;
    description: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
  };
  
  export default function RadioRow({
    label,
    description,
    checked,
    onChange,
    disabled,
  }: RadioRowProps) {
    return (
      <button
        type="button"
        onClick={!disabled ? onChange : undefined}
        className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs md:text-sm transition flex items-start gap-3 ${
          disabled
            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
            : checked
            ? "bg-sky-50 border-sky-300 text-slate-900"
            : "bg-white border-slate-200 hover:bg-slate-50"
        }`}
      >
        <span
          className={`mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "border-sky-500 bg-sky-500"
              : "border-slate-300 bg-white"
          }`}
        >
          {checked && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
        <span>
          <div className="font-semibold">{label}</div>
          <div className="text-[11px] md:text-xs text-slate-500">
            {description}
          </div>
        </span>
      </button>
    );
  }