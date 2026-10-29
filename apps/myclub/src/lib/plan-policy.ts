export function parseFreeClubLimit(value: string | undefined): number {
  if (value === undefined) return 1;
  if (!/^(0|[1-9]\d{0,3})$/.test(value)) {
    throw new Error("The configured free-club limit is invalid");
  }
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 1000) {
    throw new Error("The configured free-club limit is invalid");
  }
  return limit;
}

export function canCreateClub(
  administratorClubCount: number,
  freeClubLimit: number,
  subscriptionStatus: string | null | undefined,
): boolean {
  return administratorClubCount < freeClubLimit ||
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing";
}
