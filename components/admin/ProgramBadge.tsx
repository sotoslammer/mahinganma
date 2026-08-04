import { PROGRAM_LABELS, type ProgramValue } from "@/lib/validation/signup";

const SHORT: Record<ProgramValue, string> = {
  BJJ: "BJJ",
  BOXING: "BOX",
  YOUNG_WARRIORS: "YW",
  UNDECIDED: "—",
};

// Matches the tag colours used for the same programs on the public site.
const TONE: Record<ProgramValue, string> = {
  BJJ: "bg-bjj text-white",
  BOXING: "bg-accent text-white",
  YOUNG_WARRIORS: "bg-accent text-white",
  UNDECIDED: "bg-white/10 text-dim",
};

export function ProgramBadge({ program }: { program: ProgramValue }) {
  return (
    <span
      className={`inline-flex min-w-7 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] ${TONE[program]}`}
      title={PROGRAM_LABELS[program]}
    >
      {SHORT[program]}
    </span>
  );
}
