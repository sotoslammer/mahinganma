const styles: Record<string, string> = {
  active: "bg-bjj/20 text-[#7dffb4]",
  trial: "bg-white/10 text-[#eaeaea]",
  inactive: "bg-white/5 text-dim",
  needs_review: "bg-accent/20 text-accent-hover",
  past_due: "bg-accent/20 text-accent-hover",
  canceled: "bg-white/5 text-dim",
  unpaid: "bg-accent/20 text-accent-hover",
  paid: "bg-bjj/20 text-[#7dffb4]",
  granted: "bg-bjj/20 text-[#7dffb4]",
  revoked: "bg-white/5 text-dim",
  pending: "bg-accent/20 text-accent-hover",
  expired: "bg-accent/20 text-accent-hover",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value || "unknown";
  const className = styles[label] ?? "bg-white/10 text-dim";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${className}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}
