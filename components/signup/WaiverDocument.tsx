import { waiverParagraphs } from "@/lib/waiver";

/**
 * Renders a waiver snapshot verbatim.
 *
 * The signup form and the owner's copy both go through here, so what a signer reads
 * on screen is the same text that gets stored, emailed and printed.
 */
export function WaiverDocument({
  documentText,
  className = "",
}: {
  documentText: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {waiverParagraphs(documentText).map((paragraph, index) => (
        <p
          key={index}
          className="mb-3 whitespace-pre-wrap text-[13px] leading-relaxed text-dim last:mb-0"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
