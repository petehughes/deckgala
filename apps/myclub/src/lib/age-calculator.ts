export type AgeCalculationRule = "AGE_DEC_31" | "AGE_DAY_OF_MEET";

/**
 * Calculates the competitive swimming age of a swimmer based on governing body rules.
 * - AGE_DEC_31: British Swimming / Swim England standard (Age as of 31 December of the competition year).
 * - AGE_DAY_OF_MEET: Age on the start date of the gala or today.
 */
export function calculateCompetitionAge(
  dateOfBirth: Date | string,
  referenceDate: Date | string = new Date(),
  rule: AgeCalculationRule = "AGE_DEC_31",
): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const ref = typeof referenceDate === "string" ? new Date(referenceDate) : referenceDate;

  if (Number.isNaN(dob.getTime()) || Number.isNaN(ref.getTime())) {
    throw new Error("Invalid date provided for age calculation");
  }

  const birthYear = dob.getUTCFullYear();
  const refYear = ref.getUTCFullYear();

  if (rule === "AGE_DEC_31") {
    return Math.max(0, refYear - birthYear);
  }

  // AGE_DAY_OF_MEET
  let age = refYear - birthYear;
  const monthDiff = ref.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getUTCDate() < dob.getUTCDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Resolves the standardized competitive age group string for meet event matching.
 * e.g., 9-10, 11-12, 13-14, 15-16, 17+ or Open.
 */
export function resolveStandardAgeGroup(age: number): string {
  if (age <= 10) return "9-10";
  if (age <= 12) return "11-12";
  if (age <= 14) return "13-14";
  if (age <= 16) return "15-16";
  return "17 & Over";
}

