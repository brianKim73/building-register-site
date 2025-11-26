// src/components/building/IssueTypeSelector.tsx

import RadioRow from "../common/RadioRow";

type IssueType = "TITLE" | "EXPOS" | "BOTH";

type IssueTypeSelectorProps = {
  issueType: IssueType;
  onChange: (value: IssueType) => void;
};

export default function IssueTypeSelector({
  issueType,
  onChange,
}: IssueTypeSelectorProps) {
  return (
    <div className="grid gap-2">
      <RadioRow
        label="표제부"
        description="건물의 기본 정보 (소재지, 용도, 구조 등)"
        checked={issueType === "TITLE"}
        onChange={() => onChange("TITLE")}
      />
      <RadioRow
        label="전유부"
        description="전유면적, 전용면적 등 상세 정보 (추후 구현)"
        checked={issueType === "EXPOS"}
        onChange={() => onChange("EXPOS")}
        disabled
      />
      <RadioRow
        label="표제부 + 전유부"
        description="모든 정보를 포함한 건축물대장 (추후 확장)"
        checked={issueType === "BOTH"}
        onChange={() => onChange("BOTH")}
        disabled
      />
      <p className="mt-1 text-[11px] text-slate-400">
        ※ 현재는 건축물대장 <span className="font-semibold">표제부</span> 기준으로
        조회·다운로드가 지원됩니다.
      </p>
    </div>
  );
}