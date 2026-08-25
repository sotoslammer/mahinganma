export type StudentIdentity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dob: string | null;
};

export type MatchDecision =
  | { type: "existing"; studentId: string }
  | { type: "create" }
  | { type: "review"; candidateIds: string[]; reason: string };

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function decideMatch(input: {
  firstName: string;
  lastName: string;
  email: string | null;
  dob: string | null;
}, candidates: StudentIdentity[]): MatchDecision {
  const email = input.email ? input.email.trim().toLowerCase() : null;
  const first = norm(input.firstName);
  const last = norm(input.lastName);
  const dob = input.dob?.trim() || null;

  const exact = candidates.filter((student) => {
    const emailOk = Boolean(email && student.email && student.email.toLowerCase() === email);
    const nameOk = norm(student.firstName) === first && norm(student.lastName) === last;
    const dobOk = !dob || !student.dob || student.dob === dob;
    return emailOk && nameOk && dobOk;
  });
  if (exact.length === 1) return { type: "existing", studentId: exact[0].id };
  if (exact.length > 1) {
    return { type: "review", candidateIds: exact.map((row) => row.id), reason: "multiple_exact" };
  }

  const byEmail = email
    ? candidates.filter((student) => student.email && student.email.toLowerCase() === email)
    : [];
  if (byEmail.length === 1) {
    const student = byEmail[0];
    const nameOk = norm(student.firstName) === first && norm(student.lastName) === last;
    const dobOk = !dob || !student.dob || student.dob === dob;
    if (nameOk && dobOk) return { type: "existing", studentId: student.id };
    return { type: "review", candidateIds: [student.id], reason: "email_conflict" };
  }
  if (byEmail.length > 1) {
    return { type: "review", candidateIds: byEmail.map((row) => row.id), reason: "email_ambiguous" };
  }

  if (first && last && dob) {
    const byNameDob = candidates.filter(
      (student) =>
        norm(student.firstName) === first &&
        norm(student.lastName) === last &&
        student.dob === dob,
    );
    if (byNameDob.length === 1) return { type: "existing", studentId: byNameDob[0].id };
    if (byNameDob.length > 1) {
      return {
        type: "review",
        candidateIds: byNameDob.map((row) => row.id),
        reason: "name_dob_ambiguous",
      };
    }
  }

  return { type: "create" };
}
