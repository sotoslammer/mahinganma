import { formatDateOnly } from "@/lib/format";
import { site } from "@/lib/site";

/*
 * ---------------------------------------------------------------------------
 * TODO: REPLACE THE WORDING BELOW WITH TEXT REVIEWED FOR YOUR JURISDICTION.
 *
 * `WAIVER_BODY` is a structural draft, not legal advice, and it has not been
 * reviewed by a lawyer or an insurer. To put the real waiver into service:
 *
 *   1. Replace the sections in `WAIVER_BODY`.
 *   2. Set `WAIVER_IS_DRAFT` to false, which removes the notice printed at the
 *      top of every copy.
 *   3. Bump `WAIVER_VERSION`.
 *
 * Bumping the version is what keeps the history honest: each signature stores
 * the full text it was shown, so already-signed waivers keep their old wording
 * and version, and only new signatures pick up the change.
 * ---------------------------------------------------------------------------
 */

export const WAIVER_VERSION = "2026-08-draft-1";

export const WAIVER_TITLE = "Assumption of Risk, Release of Liability and Waiver of Claims";

/** Set to false once the placeholder wording above has been replaced. */
export const WAIVER_IS_DRAFT = true;

/** Age of majority used to decide whether a guardian must sign. 18 in Saskatchewan. */
export const AGE_OF_MAJORITY = 18;

export type WaiverContext = {
  studentName: string;
  /** Date-only value; rendered in UTC to match how it is stored. */
  studentDateOfBirth: Date | null;
  isMinor: boolean;
  guardianName?: string;
  guardianRelationship?: string;
  programLabel: string;
};

type Section = { heading: string; paragraphs: string[] };

const WAIVER_BODY: Section[] = [
  {
    heading: "1. Assumption of risk",
    paragraphs: [
      "Brazilian Jiu-Jitsu, boxing and related martial arts training are physically demanding contact activities. Participation carries inherent risks that cannot be eliminated regardless of the care taken. Those risks include, without limitation: bruises, sprains, strains and joint injuries; fractures and dislocations; cuts, abrasions and mat burns; concussion and other head, neck or spinal injuries; cardiac events; exposure to communicable skin conditions and other illnesses; permanent disability; and death.",
      "The Participant voluntarily chooses to take part with full knowledge of these risks and accepts them, whether they arise from the Participant's own actions, the actions of other participants, the condition of the premises or equipment, or the ordinary negligence of the Organization or its instructors.",
    ],
  },
  {
    heading: "2. Physical condition and fitness to train",
    paragraphs: [
      "The Participant confirms that they are physically fit to take part and are not aware of any medical condition that would make participation unsafe. The Participant agrees to disclose any relevant medical condition, injury, allergy or medication on this form, and to inform an instructor promptly if their condition changes.",
      "The Participant agrees to stop and seek medical attention if they experience pain, dizziness, breathing difficulty or any other warning sign during training.",
    ],
  },
  {
    heading: "3. Release of liability and waiver of claims",
    paragraphs: [
      "In consideration of being permitted to participate, the Participant releases and agrees not to sue the Organization, its owners, instructors, coaches, employees, volunteers, members and landlords (together, the \"Released Parties\") from any and all claims, demands, actions, damages and costs arising out of or in any way connected with participation in the Organization's programs, including claims arising from the ordinary negligence of the Released Parties.",
      "This release does not extend to gross negligence, wilful misconduct, or any liability that cannot lawfully be waived.",
    ],
  },
  {
    heading: "4. Rules, conduct and instruction",
    paragraphs: [
      "The Participant agrees to follow all posted rules, mat etiquette and the directions of instructors, to train within their own limits, to tap early and release submissions immediately, and to treat every training partner with respect. The Organization may suspend or end participation for conduct that puts others at risk.",
    ],
  },
  {
    heading: "5. Emergency medical treatment",
    paragraphs: [
      "If the Participant is injured and cannot give consent, the Participant authorizes the Organization to arrange first aid, ambulance transport and emergency medical care, and accepts financial responsibility for the cost of that care.",
    ],
  },
];

const MINOR_SECTION: Section = {
  heading: "6. Parent or legal guardian consent",
  paragraphs: [
    "The Participant named above is under the age of majority. The person signing below confirms that they are the Participant's parent or legal guardian and that they have the legal authority to sign this agreement on the Participant's behalf.",
    "The parent or guardian has read this agreement in full, consents to the Participant taking part, accepts the risks described above on the Participant's behalf, and agrees to be bound by the release in section 3 both personally and on behalf of the Participant. The parent or guardian further agrees to indemnify the Released Parties against any claim brought by or on behalf of the Participant arising from participation.",
  ],
};

const ACKNOWLEDGEMENT: Section = {
  heading: "Acknowledgement",
  paragraphs: [
    "By signing below, the signer confirms that they have read and understood this entire agreement, that they are signing it freely, and that they understand it is a binding legal document that gives up substantial legal rights, including the right to sue.",
  ],
};

const DRAFT_NOTICE =
  "NOTICE: This waiver is a placeholder that has not been reviewed by a lawyer. " +
  "It is in place so the signup flow can be tested end to end and must be replaced " +
  "with reviewed wording before it is relied on.";

/**
 * Builds the exact text a signer sees and agrees to.
 *
 * Pure and isomorphic on purpose: the form re-renders it in the browser as fields
 * change, and the server rebuilds it from validated data at submit time. Only the
 * server's output is stored, so a tampered client cannot alter the recorded wording.
 */
export function renderWaiverText(ctx: WaiverContext): string {
  const sections = [...WAIVER_BODY];
  if (ctx.isMinor) sections.push(MINOR_SECTION);
  sections.push(ACKNOWLEDGEMENT);

  const details = [
    `Organization: ${site.name}`,
    `Location: ${site.contact.addressLines.join(", ")}`,
    `Participant: ${ctx.studentName || "—"}`,
    `Date of birth: ${ctx.studentDateOfBirth ? formatDateOnly(ctx.studentDateOfBirth) : "—"}`,
    `Program: ${ctx.programLabel}`,
  ];
  if (ctx.isMinor) {
    details.push(`Parent or legal guardian: ${ctx.guardianName || "—"}`);
    details.push(`Relationship to participant: ${ctx.guardianRelationship || "—"}`);
  }

  const blocks: string[] = [WAIVER_TITLE.toUpperCase()];
  if (WAIVER_IS_DRAFT) blocks.push(DRAFT_NOTICE);
  blocks.push(details.join("\n"));

  for (const section of sections) {
    blocks.push(section.heading);
    blocks.push(...section.paragraphs);
  }

  blocks.push(`Waiver version: ${WAIVER_VERSION}`);
  return blocks.join("\n\n");
}

/** Splits a stored snapshot back into display blocks for HTML and PDF rendering. */
export function waiverParagraphs(documentText: string): string[] {
  return documentText.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
}
