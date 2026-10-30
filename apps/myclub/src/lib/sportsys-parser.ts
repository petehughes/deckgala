import type { Gender, PoolCourse, SwimStroke } from "@aquateamhub/database";

export interface ParsedSportsysMeet {
  meetName?: string;
  course?: PoolCourse;
  meetDate?: string;
  venue?: string;
}

export interface ParsedSportsysEvent {
  eventNumber: number;
  sessionNumber?: number;
  sessionEventNumber?: number;
  name?: string;
  gender?: Gender;
  distance: number;
  stroke: SwimStroke;
  ageGroup?: string;
  minAge?: number;
  maxAge?: number;
  qualifyingTimeMs?: number | null;
  cutoffTimeMs?: number | null;
  feePence?: number | null;
}

export interface ParsedSportsysSwimmer {
  governingBodyId?: string; // ASA / Swim England number
  firstName: string;
  lastName: string;
  gender?: Gender;
  dateOfBirth?: string; // YYYY-MM-DD
  clubCode?: string;
}

export interface ParsedSportsysEntry {
  governingBodyId?: string;
  swimmerName?: string;
  eventNumber: number;
  seedTimeMs?: number | null;
  isNoTime: boolean;
}

export interface SportsysParseResult {
  meet: ParsedSportsysMeet;
  events: ParsedSportsysEvent[];
  swimmers: ParsedSportsysSwimmer[];
  entries: ParsedSportsysEntry[];
  rawLineCount: number;
  warnings: string[];
}

/**
 * Normalizes string representation of stroke to SwimStroke enum.
 */
export function normalizeStroke(input: string | undefined): SwimStroke {
  if (!input) return "FREESTYLE";
  const s = input.trim().toUpperCase();

  if (s.includes("FREE") || s === "FR" || s === "FS") return "FREESTYLE";
  if (s.includes("BACK") || s === "BK" || s === "BS") return "BACKSTROKE";
  if (s.includes("BREAST") || s === "BR") return "BREASTSTROKE";
  if (s.includes("FLY") || s.includes("BUTTER") || s === "FL" || s === "BF") return "BUTTERFLY";
  if (s.includes("MEDLEY") || s.includes("IM") || s.includes("IND")) return "INDIVIDUAL_MEDLEY";

  return "FREESTYLE";
}

/**
 * Normalizes string representation of course to PoolCourse enum.
 */
export function normalizeCourse(input: string | undefined): PoolCourse {
  if (!input) return "SHORT_COURSE_METERS";
  const c = input.trim().toUpperCase();

  if (c.includes("50") || c === "L" || c.includes("LONG") || c === "LC") {
    return "LONG_COURSE_METERS";
  }
  if (c.includes("YARD") || c === "Y" || c.includes("SCY")) {
    return "SHORT_COURSE_YARDS";
  }
  return "SHORT_COURSE_METERS";
}

/**
 * Normalizes gender input.
 */
export function normalizeGender(input: string | undefined): Gender {
  if (!input) return "OPEN";
  const g = input.trim().toUpperCase();

  if (g.includes("MIX") || g === "O" || g === "OPEN" || g === "X") {
    return "OPEN";
  }
  if (g.startsWith("F") || g.includes("GIRL") || g.includes("WOMEN") || g.includes("FEMALE")) {
    return "FEMALE";
  }
  if (g === "M" || g.includes("BOY") || g.includes("MEN") || g.includes("MALE")) {
    return "MALE";
  }
  return "OPEN";
}

/**
 * Parses a swim time string to milliseconds.
 * Supports:
 * - "28.45" -> 28450 ms
 * - "1:04.25" -> 64250 ms
 * - "1.04.25" (dot notation) -> 64250 ms
 * - "NT", "N.T.", "0", "0.00" -> null
 */
export function parseSportsysTimeToMs(rawTime: string | number | undefined | null): {
  timeMs: number | null;
  isNoTime: boolean;
} {
  if (rawTime == null) return { timeMs: null, isNoTime: true };
  if (typeof rawTime === "number") {
    if (rawTime <= 0) return { timeMs: null, isNoTime: true };
    return { timeMs: Math.round(rawTime), isNoTime: false };
  }

  const s = rawTime.trim().toUpperCase();
  if (!s || s === "NT" || s === "N.T." || s === "NO TIME" || s === "0" || s === "0.00" || s === "0:00.00") {
    return { timeMs: null, isNoTime: true };
  }

  // Check for colon format: "mm:ss.hh" or "hh:mm:ss.hh"
  if (s.includes(":")) {
    const parts = s.split(":");
    if (parts.length === 2) {
      const minutes = Number.parseInt(parts[0], 10);
      const secParts = parts[1].split(".");
      const seconds = Number.parseInt(secParts[0], 10);
      const hundredths = secParts[1] ? Number.parseInt(secParts[1].padEnd(2, "0").slice(0, 2), 10) : 0;
      if (!Number.isNaN(minutes) && !Number.isNaN(seconds) && !Number.isNaN(hundredths)) {
        return {
          timeMs: (minutes * 60 + seconds) * 1000 + hundredths * 10,
          isNoTime: false,
        };
      }
    } else if (parts.length === 3) {
      const hours = Number.parseInt(parts[0], 10);
      const minutes = Number.parseInt(parts[1], 10);
      const secParts = parts[2].split(".");
      const seconds = Number.parseInt(secParts[0], 10);
      const hundredths = secParts[1] ? Number.parseInt(secParts[1].padEnd(2, "0").slice(0, 2), 10) : 0;
      if (!Number.isNaN(hours) && !Number.isNaN(minutes) && !Number.isNaN(seconds) && !Number.isNaN(hundredths)) {
        return {
          timeMs: (hours * 3600 + minutes * 60 + seconds) * 1000 + hundredths * 10,
          isNoTime: false,
        };
      }
    }
  }

  // Check for dot-separated format: "1.04.25" vs "28.45"
  const dots = s.split(".");
  if (dots.length === 3) {
    // "mm.ss.hh"
    const minutes = Number.parseInt(dots[0], 10);
    const seconds = Number.parseInt(dots[1], 10);
    const hundredths = Number.parseInt(dots[2].padEnd(2, "0").slice(0, 2), 10);
    if (!Number.isNaN(minutes) && !Number.isNaN(seconds) && !Number.isNaN(hundredths)) {
      return {
        timeMs: (minutes * 60 + seconds) * 1000 + hundredths * 10,
        isNoTime: false,
      };
    }
  } else if (dots.length === 2) {
    // "ss.hh"
    const seconds = Number.parseInt(dots[0], 10);
    const hundredths = Number.parseInt(dots[1].padEnd(2, "0").slice(0, 2), 10);
    if (!Number.isNaN(seconds) && !Number.isNaN(hundredths)) {
      return {
        timeMs: seconds * 1000 + hundredths * 10,
        isNoTime: false,
      };
    }
  }

  // Pure integer seconds or milliseconds fallback
  const numeric = Number(s);
  if (!Number.isNaN(numeric) && numeric > 0) {
    // If > 10000 assume already ms, else seconds
    const ms = numeric > 10000 ? Math.round(numeric) : Math.round(numeric * 1000);
    return { timeMs: ms, isNoTime: false };
  }

  return { timeMs: null, isNoTime: true };
}

/**
 * Normalizes date strings (YYYY-MM-DD, YYYYMMDD, DD/MM/YYYY, etc.)
 */
export function normalizeDate(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const cleaned = input.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // YYYYMMDD
  if (/^\d{8}$/.test(cleaned)) {
    const y = cleaned.slice(0, 4);
    const m = cleaned.slice(4, 6);
    const d = cleaned.slice(6, 8);
    return `${y}-${m}-${d}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const parts = cleaned.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }

  return undefined;
}

/**
 * Main parser for SPORTSYSTEMS entry files (.sef, .set, .sed, entry text/csv).
 */
export function parseSportsysEntryFile(fileContent: string): SportsysParseResult {
  const result: SportsysParseResult = {
    meet: {},
    events: [],
    swimmers: [],
    entries: [],
    rawLineCount: 0,
    warnings: [],
  };

  if (!fileContent || typeof fileContent !== "string") {
    return result;
  }

  const lines = fileContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("//") && !line.startsWith("#"));

  result.rawLineCount = lines.length;

  let currentSection = "";
  let lastSwimmerRef: ParsedSportsysSwimmer | null = null;
  const swimmerMap = new Map<string, ParsedSportsysSwimmer>();
  const eventMap = new Map<number, ParsedSportsysEvent>();

  // Check if first row is a CSV header
  const firstLine = lines[0];
  const isDelimitedHeader =
    firstLine.includes(",") || firstLine.includes(";") || firstLine.includes("\t");

  if (isDelimitedHeader && /event|swimmer|stroke|distance|seed/i.test(firstLine)) {
    parseDelimitedFile(lines, result);
    return result;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect INI/bracket sections: [MEET], [EVENTS], [ENTRIES], [SWIMMERS], [INDIVIDUALS]
    const sectionMatch = line.match(/^\[([a-zA-Z0-9_\s-]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toUpperCase();
      continue;
    }

    // Key-value pairs: Key=Value
    if (line.includes("=") && !line.includes(",")) {
      const eqIdx = line.indexOf("=");
      const key = line.slice(0, eqIdx).trim().toUpperCase();
      const val = line.slice(eqIdx + 1).trim();

      if (key === "MEETNAME" || key === "NAME" || key === "MEET") {
        result.meet.meetName = val;
      } else if (key === "COURSE" || key === "POOL") {
        result.meet.course = normalizeCourse(val);
      } else if (key === "MEETDATE" || key === "DATE") {
        result.meet.meetDate = normalizeDate(val) ?? val;
      } else if (key === "VENUE") {
        result.meet.venue = val;
      }
      continue;
    }

    // Split by comma or semicolon
    const delimiter = line.includes(";") ? ";" : ",";
    const tokens = line.split(delimiter).map((t) => t.trim());
    const token0 = tokens[0].toUpperCase();

    // 1. Tagged Lines: MEET, EVENT, SWIMMER, ENTRY
    if (token0 === "MEET") {
      // MEET, MeetName, Course, Date, Venue
      if (tokens[1]) result.meet.meetName = tokens[1];
      if (tokens[2]) result.meet.course = normalizeCourse(tokens[2]);
      if (tokens[3]) result.meet.meetDate = normalizeDate(tokens[3]);
      if (tokens[4]) result.meet.venue = tokens[4];
      continue;
    }

    if (token0 === "EVENT") {
      // EVENT, EventNum, SessionNum, Gender, Distance, Stroke, AgeGroup, QualifyingTime, CutoffTime, Fee
      parseEventTokens(tokens.slice(1), eventMap);
      continue;
    }

    if (token0 === "SWIMMER" || token0 === "ATHLETE") {
      // SWIMMER, SE_ID, LastName, FirstName, DOB, Gender, ClubCode
      const swimmer = parseSwimmerTokens(tokens.slice(1), swimmerMap);
      if (swimmer) {
        lastSwimmerRef = swimmer;
      }
      continue;
    }

    if (token0 === "ENTRY") {
      // ENTRY, EventNum, Time OR ENTRY, SE_ID, EventNum, Time
      parseEntryTokens(tokens.slice(1), lastSwimmerRef, result);
      continue;
    }

    // 2. Section-driven rows
    if (currentSection === "MEET") {
      if (tokens.length >= 2) {
        if (!result.meet.meetName) result.meet.meetName = tokens[0];
        if (!result.meet.course) result.meet.course = normalizeCourse(tokens[1]);
        if (tokens[2] && !result.meet.meetDate) result.meet.meetDate = normalizeDate(tokens[2]);
      }
    } else if (currentSection === "EVENTS") {
      parseEventTokens(tokens, eventMap);
    } else if (currentSection === "SWIMMERS" || currentSection === "INDIVIDUALS") {
      const swimmer = parseSwimmerTokens(tokens, swimmerMap);
      if (swimmer) lastSwimmerRef = swimmer;
    } else if (currentSection === "ENTRIES") {
      parseEntryTokens(tokens, lastSwimmerRef, result);
    }
  }

  result.events = Array.from(eventMap.values()).sort((a, b) => a.eventNumber - b.eventNumber);
  result.swimmers = Array.from(swimmerMap.values());

  return result;
}

function parseEventTokens(
  tokens: string[],
  eventMap: Map<number, ParsedSportsysEvent>,
) {
  if (tokens.length < 3) return;

  const eventNum = Number.parseInt(tokens[0], 10);
  if (Number.isNaN(eventNum)) return;

  let sessionNumber = 1;
  let genderIdx = 1;

  // If token 1 is a number, treat as session number
  const possibleSession = Number.parseInt(tokens[1], 10);
  if (!Number.isNaN(possibleSession) && tokens.length > 4) {
    sessionNumber = possibleSession;
    genderIdx = 2;
  }

  const genderStr = tokens[genderIdx];
  const distanceStr = tokens[genderIdx + 1];
  const strokeStr = tokens[genderIdx + 2];
  const ageGroup = tokens[genderIdx + 3] || "Open";

  const distance = Number.parseInt(distanceStr, 10) || 50;
  const stroke = normalizeStroke(strokeStr);
  const gender = normalizeGender(genderStr);

  let qualifyingTimeMs: number | null = null;
  let cutoffTimeMs: number | null = null;
  let feePence: number | null = null;

  if (tokens[genderIdx + 4]) {
    const q = parseSportsysTimeToMs(tokens[genderIdx + 4]);
    qualifyingTimeMs = q.timeMs;
  }
  if (tokens[genderIdx + 5]) {
    const c = parseSportsysTimeToMs(tokens[genderIdx + 5]);
    cutoffTimeMs = c.timeMs;
  }
  if (tokens[genderIdx + 6]) {
    const fee = Number.parseFloat(tokens[genderIdx + 6]);
    if (!Number.isNaN(fee)) {
      feePence = fee > 50 ? Math.round(fee) : Math.round(fee * 100);
    }
  }

  const genderLabel = gender === "MALE" ? "Boys" : gender === "FEMALE" ? "Girls" : "Open";
  const strokeLabel =
    stroke === "FREESTYLE"
      ? "Freestyle"
      : stroke === "BACKSTROKE"
      ? "Backstroke"
      : stroke === "BREASTSTROKE"
      ? "Breaststroke"
      : stroke === "BUTTERFLY"
      ? "Butterfly"
      : "Individual Medley";

  const eventObj: ParsedSportsysEvent = {
    eventNumber: eventNum,
    sessionNumber,
    name: `${genderLabel} ${ageGroup} ${distance}m ${strokeLabel}`,
    gender,
    distance,
    stroke,
    ageGroup,
    qualifyingTimeMs,
    cutoffTimeMs,
    feePence,
  };

  eventMap.set(eventNum, eventObj);
}

function parseSwimmerTokens(
  tokens: string[],
  swimmerMap: Map<string, ParsedSportsysSwimmer>,
): ParsedSportsysSwimmer | null {
  if (tokens.length < 2) return null;

  let regNo: string | undefined;
  let lastName = "";
  let firstName = "";
  let dob: string | undefined;
  let gender: Gender | undefined;
  let clubCode: string | undefined;

  // Check if token[0] is pure numeric or alphanumeric ID (e.g. ASA ID 1234567)
  if (/^\d{5,9}$/.test(tokens[0])) {
    regNo = tokens[0];
    lastName = tokens[1] || "";
    firstName = tokens[2] || "";
    dob = normalizeDate(tokens[3]);
    gender = normalizeGender(tokens[4]);
    clubCode = tokens[5];
  } else {
    // Format: LastName, FirstName, DOB, Gender, RegNo, ClubCode
    lastName = tokens[0] || "";
    firstName = tokens[1] || "";
    dob = normalizeDate(tokens[2]);
    gender = normalizeGender(tokens[3]);
    if (tokens[4] && /^\d+$/.test(tokens[4])) {
      regNo = tokens[4];
    }
    clubCode = tokens[5];
  }

  if (!lastName && !firstName) return null;

  const swimmerKey = regNo || `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
  const swimmerObj: ParsedSportsysSwimmer = {
    governingBodyId: regNo,
    firstName: firstName || "Unknown",
    lastName: lastName || "Unknown",
    dateOfBirth: dob,
    gender,
    clubCode,
  };

  swimmerMap.set(swimmerKey, swimmerObj);
  return swimmerObj;
}

function parseEntryTokens(
  tokens: string[],
  lastSwimmerRef: ParsedSportsysSwimmer | null,
  result: SportsysParseResult,
) {
  if (tokens.length < 1) return;

  let eventNum: number;
  let rawTime: string;
  let swimmerReg: string | undefined = lastSwimmerRef?.governingBodyId;
  let swimmerName: string | undefined = lastSwimmerRef
    ? `${lastSwimmerRef.firstName} ${lastSwimmerRef.lastName}`
    : undefined;

  // Case 1: tokens[0] is swimmer reg/name, tokens[1] is eventNum, tokens[2] is time
  if (tokens.length >= 3 && (isNaN(Number(tokens[0])) || Number(tokens[0]) > 5000)) {
    swimmerReg = /^\d+$/.test(tokens[0]) ? tokens[0] : undefined;
    swimmerName = !swimmerReg ? tokens[0] : undefined;
    eventNum = Number.parseInt(tokens[1], 10);
    rawTime = tokens[2];
  } else {
    // Case 2: hierarchical: tokens[0] is eventNum, tokens[1] is time
    eventNum = Number.parseInt(tokens[0], 10);
    rawTime = tokens[1] || "NT";
  }

  if (Number.isNaN(eventNum)) return;

  const parsedTime = parseSportsysTimeToMs(rawTime);

  result.entries.push({
    governingBodyId: swimmerReg,
    swimmerName,
    eventNumber: eventNum,
    seedTimeMs: parsedTime.timeMs,
    isNoTime: parsedTime.isNoTime,
  });
}

/**
 * Parses flat delimited CSV / TSV files with column headers.
 */
function parseDelimitedFile(lines: string[], result: SportsysParseResult) {
  const headerLine = lines[0];
  const delimiter = headerLine.includes("\t")
    ? "\t"
    : headerLine.includes(";")
    ? ";"
    : ",";

  const headers = headerLine
    .split(delimiter)
    .map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));

  const getIdx = (patterns: string[]) =>
    headers.findIndex((h) => patterns.some((p) => h.includes(p)));

  const eventIdx = getIdx(["eventnum", "eventno", "event"]);
  const sessionIdx = getIdx(["session"]);
  const strokeIdx = getIdx(["stroke", "style"]);
  const distIdx = getIdx(["distance", "dist"]);
  const genderIdx = getIdx(["gender", "sex"]);
  const ageIdx = getIdx(["agegroup", "age"]);
  const firstNameIdx = getIdx(["firstname", "forename", "first"]);
  const lastNameIdx = getIdx(["lastname", "surname", "last"]);
  const nameIdx = getIdx(["swimmername", "athlete", "name", "swimmer"]);
  const regIdx = getIdx(["regno", "asanumber", "senumber", "governingbodyid", "id", "membership"]);
  const dobIdx = getIdx(["dob", "dateofbirth", "birthdate"]);
  const timeIdx = getIdx(["seedtime", "time", "entrytime", "seed"]);

  const swimmerMap = new Map<string, ParsedSportsysSwimmer>();
  const eventMap = new Map<number, ParsedSportsysEvent>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(delimiter).map((c) => c.trim());
    if (row.length < 2) continue;

    const eventNum = eventIdx >= 0 ? Number.parseInt(row[eventIdx], 10) : i;
    if (Number.isNaN(eventNum)) continue;

    // Swimmer resolution
    let firstName = "";
    let lastName = "";
    if (firstNameIdx >= 0 && row[firstNameIdx]) firstName = row[firstNameIdx];
    if (lastNameIdx >= 0 && row[lastNameIdx]) lastName = row[lastNameIdx];
    if (!firstName && !lastName && nameIdx >= 0 && row[nameIdx]) {
      const parts = row[nameIdx].split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "";
    }

    const regNo = regIdx >= 0 ? row[regIdx] : undefined;
    const dob = dobIdx >= 0 ? normalizeDate(row[dobIdx]) : undefined;
    const gender = genderIdx >= 0 ? normalizeGender(row[genderIdx]) : "OPEN";

    const swimmerKey = regNo || `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
    if ((firstName || lastName || regNo) && !swimmerMap.has(swimmerKey)) {
      swimmerMap.set(swimmerKey, {
        governingBodyId: regNo,
        firstName: firstName || "Swimmer",
        lastName: lastName || "",
        dateOfBirth: dob,
        gender,
      });
    }

    // Event resolution
    if (distIdx >= 0 || strokeIdx >= 0) {
      const distance = distIdx >= 0 ? Number.parseInt(row[distIdx], 10) || 50 : 50;
      const stroke = strokeIdx >= 0 ? normalizeStroke(row[strokeIdx]) : "FREESTYLE";
      const sessionNumber = sessionIdx >= 0 ? Number.parseInt(row[sessionIdx], 10) || 1 : 1;
      const ageGroup = ageIdx >= 0 ? row[ageIdx] || "Open" : "Open";

      if (!eventMap.has(eventNum)) {
        eventMap.set(eventNum, {
          eventNumber: eventNum,
          sessionNumber,
          gender,
          distance,
          stroke,
          ageGroup,
          name: `${gender === "MALE" ? "Boys" : gender === "FEMALE" ? "Girls" : "Open"} ${distance}m ${stroke}`,
        });
      }
    }

    // Entry resolution
    const rawTime = timeIdx >= 0 ? row[timeIdx] : "NT";
    const parsedTime = parseSportsysTimeToMs(rawTime);

    result.entries.push({
      governingBodyId: regNo,
      swimmerName: `${firstName} ${lastName}`.trim(),
      eventNumber: eventNum,
      seedTimeMs: parsedTime.timeMs,
      isNoTime: parsedTime.isNoTime,
    });
  }

  result.events = Array.from(eventMap.values()).sort((a, b) => a.eventNumber - b.eventNumber);
  result.swimmers = Array.from(swimmerMap.values());
}

/**
 * Detects PKZip magic header: 50 4B 03 04
 */
export function isZipBuffer(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

/**
 * Detects GZIP magic header: 1F 8B
 */
export function isGzipBuffer(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/**
 * Detects ZLIB magic header: 78 01, 78 9C, 78 DA
 */
export function isZlibBuffer(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 2 &&
    bytes[0] === 0x78 &&
    (bytes[1] === 0x01 || bytes[1] === 0x9c || bytes[1] === 0xda)
  );
}

/**
 * Extracts files from a PKZip buffer using native Web Streams DecompressionStream.
 * Works natively in both Node.js (18+) and modern browsers without external dependencies.
 */
export async function extractZipFiles(
  buffer: Uint8Array | ArrayBuffer,
): Promise<Array<{ filename: string; content: string }>> {
  const files: Array<{ filename: string; content: string }> = [];
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let offset = 0;

  while (offset + 30 <= bytes.length) {
    const sig =
      (bytes[offset] |
        (bytes[offset + 1] << 8) |
        (bytes[offset + 2] << 16) |
        (bytes[offset + 3] << 24)) >>>
      0;
    if (sig !== 0x04034b50) break;

    const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compSize =
      (bytes[offset + 18] |
        (bytes[offset + 19] << 8) |
        (bytes[offset + 20] << 16) |
        (bytes[offset + 21] << 24)) >>>
      0;
    const fnLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);

    const fnStart = offset + 30;
    const fnBytes = bytes.slice(fnStart, fnStart + fnLen);
    const filename = new TextDecoder("utf-8").decode(fnBytes);

    const dataStart = fnStart + fnLen + extraLen;
    const dataBytes = bytes.slice(dataStart, dataStart + compSize);

    let decompressed: Uint8Array;
    if (compressionMethod === 0) {
      decompressed = dataBytes;
    } else if (compressionMethod === 8) {
      const ds = new DecompressionStream("deflate-raw");
      const response = new Response(new Blob([dataBytes as unknown as BlobPart]));
      const decompressedStream = response.body?.pipeThrough(ds);
      if (!decompressedStream) {
        offset = dataStart + compSize;
        continue;
      }
      decompressed = new Uint8Array(
        await new Response(decompressedStream).arrayBuffer(),
      );
    } else {
      offset = dataStart + compSize;
      continue;
    }

    files.push({
      filename,
      content: new TextDecoder("utf-8").decode(decompressed),
    });

    offset = dataStart + compSize;
  }

  return files;
}

/**
 * Extracts printable ASCII/UTF-8 strings from binary buffers.
 */
export function extractPrintableStrings(bytes: Uint8Array): string[] {
  const strings: string[] = [];
  let start = -1;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const isPrintable = (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13;
    if (isPrintable) {
      if (start === -1) start = i;
    } else {
      if (start !== -1 && i - start >= 1) {
        strings.push(new TextDecoder("utf-8").decode(bytes.slice(start, i)).trim());
      }
      start = -1;
    }
  }

  if (start !== -1 && bytes.length - start >= 1) {
    strings.push(new TextDecoder("utf-8").decode(bytes.slice(start)).trim());
  }

  return strings.filter((s) => s.length > 0);
}

const BINARY_STROKE_MAP: Record<number, SwimStroke> = {
  1: "FREESTYLE",
  2: "BACKSTROKE",
  3: "BREASTSTROKE",
  4: "BUTTERFLY",
  5: "INDIVIDUAL_MEDLEY",
};

const BINARY_COURSE_MAP: Record<number, PoolCourse> = {
  1: "SHORT_COURSE_METERS",
  2: "LONG_COURSE_METERS",
  3: "SHORT_COURSE_YARDS",
};

/**
 * Parses raw proprietary binary Sportsystems file records (.sef, .sed).
 */
export function parseSportsysRawBinary(bytes: Uint8Array): SportsysParseResult {
  const result: SportsysParseResult = {
    meet: {},
    events: [],
    swimmers: [],
    entries: [],
    rawLineCount: 0,
    warnings: [],
  };

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 0;

  // Check for binary Sportsystems record tags: 'SEF\0' or binary opcodes
  const hasSefSignature =
    bytes.length >= 3 &&
    bytes[0] === 0x53 &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x46; // 'SEF'

  if (hasSefSignature) {
    pos = 4; // Skip signature + version byte
  }

  let structuredParsed = false;

  // Scan for structured binary record blocks:
  // Record header: [Opcode: 1 byte] [Record Length: 2 bytes]
  while (pos + 3 <= bytes.length) {
    const opcode = bytes[pos];
    const recLen = view.getUint16(pos + 1, true);

    if (recLen > 0 && recLen < 2048 && pos + 3 + recLen <= bytes.length) {
      const recStart = pos + 3;
      const recBytes = bytes.slice(recStart, recStart + recLen);
      const recView = new DataView(recBytes.buffer, recBytes.byteOffset, recBytes.byteLength);

      if (opcode === 0x01 || opcode === 0x4d) {
        // Meet Record: course(1 byte), date(YYYYMMDD 8 bytes string or uint32), name(Pascal/null-term string)
        const courseByte = recBytes[0];
        result.meet.course = BINARY_COURSE_MAP[courseByte] || "SHORT_COURSE_METERS";
        const strings = extractPrintableStrings(recBytes.slice(1));
        if (strings[0]) result.meet.meetName = strings[0];
        if (strings[1]) result.meet.meetDate = normalizeDate(strings[1]);
        if (strings[2]) result.meet.venue = strings[2];
        structuredParsed = true;
      } else if (opcode === 0x02 || opcode === 0x45) {
        // Event Record: eventNum(u16), session(u16), distance(u16), stroke(u8), gender(u8), cutTime(u32 hundredths)
        if (recLen >= 8) {
          const eventNum = recView.getUint16(0, true);
          const session = recView.getUint16(2, true) || 1;
          const dist = recView.getUint16(4, true) || 50;
          const strokeByte = recBytes[6];
          const genderByte = recBytes[7];
          const stroke = BINARY_STROKE_MAP[strokeByte] || "FREESTYLE";
          const gender =
            genderByte === 1 || genderByte === 0x4d
              ? "MALE"
              : genderByte === 2 || genderByte === 0x46
              ? "FEMALE"
              : "OPEN";

          let cutTimeMs: number | null = null;
          if (recLen >= 12) {
            const cutHundredths = recView.getUint32(8, true);
            if (cutHundredths > 0) cutTimeMs = cutHundredths * 10;
          }

          result.events.push({
            eventNumber: eventNum,
            sessionNumber: session,
            distance: dist,
            stroke,
            gender,
            name: `${gender === "MALE" ? "Boys" : gender === "FEMALE" ? "Girls" : "Open"} ${dist}m ${stroke}`,
            ageGroup: "Open",
            qualifyingTimeMs: cutTimeMs,
          });
          structuredParsed = true;
        }
      } else if (opcode === 0x03 || opcode === 0x53) {
        // Swimmer Record: regNo(string), lastName(string), firstName(string), dob, gender
        const strings = extractPrintableStrings(recBytes);
        if (strings.length >= 2) {
          let regNo: string | undefined;
          let last = "";
          let first = "";
          let dob: string | undefined;
          let g: Gender = "OPEN";

          for (const token of strings) {
            if (/^\d{5,9}$/.test(token) && !regNo) {
              regNo = token;
            } else if (!last) {
              last = token;
            } else if (!first) {
              first = token;
            } else if (/^\d{4}[-/]\d{2}[-/]\d{2}$|^\d{8}$/.test(token) && !dob) {
              dob = normalizeDate(token);
            } else if (token === "M" || token === "F" || token === "MALE" || token === "FEMALE") {
              g = normalizeGender(token);
            }
          }

          result.swimmers.push({
            governingBodyId: regNo,
            lastName: last || "Swimmer",
            firstName: first || "",
            dateOfBirth: dob,
            gender: g,
          });
          structuredParsed = true;
        }
      } else if (opcode === 0x04 || opcode === 0x54 || opcode === 0x4e) {
        // Entry Record: eventNum(u16), seedTime(u32 hundredths), regNo(string)
        if (recLen >= 6) {
          const eventNum = recView.getUint16(0, true);
          const timeHundredths = recView.getUint32(2, true);
          const strings = extractPrintableStrings(recBytes.slice(6));
          const regNo = strings.find((s) => /^\d{5,9}$/.test(s));

          result.entries.push({
            governingBodyId: regNo,
            eventNumber: eventNum,
            seedTimeMs: timeHundredths > 0 ? timeHundredths * 10 : null,
            isNoTime: timeHundredths === 0,
          });
          structuredParsed = true;
        }
      }

      pos = recStart + recLen;
      continue;
    }

    pos++;
  }

  // If structured opcodes didn't match, extract printable token lines
  if (!structuredParsed || (result.events.length === 0 && result.entries.length === 0)) {
    const printableStrings = extractPrintableStrings(bytes);
    if (printableStrings.length > 0) {
      // Reconstruct pseudo-lines from tokens and pass to text parser
      const textBlock = printableStrings.join("\n");
      const textResult = parseSportsysEntryFile(textBlock);

      if (textResult.events.length > 0 || textResult.entries.length > 0) {
        return textResult;
      }
    }
  }

  return result;
}

/**
 * Universal binary decoder for SPORTSYSTEMS files.
 * Handles PKZip archives, GZIP streams, ZLIB streams, and proprietary binary files.
 */
export async function parseSportsysBinary(
  buffer: Uint8Array | ArrayBuffer | Buffer,
): Promise<SportsysParseResult> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 1. Check for PKZip container: 50 4B 03 04
  if (isZipBuffer(bytes)) {
    const zipFiles = await extractZipFiles(bytes);
    if (zipFiles.length > 0) {
      const merged: SportsysParseResult = {
        meet: {},
        events: [],
        swimmers: [],
        entries: [],
        rawLineCount: 0,
        warnings: [],
      };

      for (const file of zipFiles) {
        const fileResult = parseSportsysEntryFile(file.content);
        if (!merged.meet.meetName && fileResult.meet.meetName) {
          merged.meet = fileResult.meet;
        }
        merged.events.push(...fileResult.events);
        merged.swimmers.push(...fileResult.swimmers);
        merged.entries.push(...fileResult.entries);
        merged.rawLineCount += fileResult.rawLineCount;
      }

      // De-duplicate events and swimmers by key
      const eventMap = new Map<number, ParsedSportsysEvent>();
      for (const ev of merged.events) eventMap.set(ev.eventNumber, ev);
      merged.events = Array.from(eventMap.values()).sort((a, b) => a.eventNumber - b.eventNumber);

      const swimmerMap = new Map<string, ParsedSportsysSwimmer>();
      for (const s of merged.swimmers) {
        const k = s.governingBodyId || `${s.firstName}_${s.lastName}`;
        swimmerMap.set(k, s);
      }
      merged.swimmers = Array.from(swimmerMap.values());

      return merged;
    }
  }

  // 2. Check for GZIP: 1F 8B
  if (isGzipBuffer(bytes)) {
    try {
      const ds = new DecompressionStream("gzip");
      const response = new Response(new Blob([bytes as unknown as BlobPart]));
      const decompressedStream = response.body?.pipeThrough(ds);
      if (decompressedStream) {
        const buf = await new Response(decompressedStream).arrayBuffer();
        const text = new TextDecoder("utf-8").decode(buf);
        return parseSportsysEntryFile(text);
      }
    } catch {
      // Fall through to raw binary
    }
  }

  // 3. Check for ZLIB: 78 01 / 78 9C / 78 DA
  if (isZlibBuffer(bytes)) {
    try {
      const ds = new DecompressionStream("deflate");
      const response = new Response(new Blob([bytes as unknown as BlobPart]));
      const decompressedStream = response.body?.pipeThrough(ds);
      if (decompressedStream) {
        const buf = await new Response(decompressedStream).arrayBuffer();
        const text = new TextDecoder("utf-8").decode(buf);
        return parseSportsysEntryFile(text);
      }
    } catch {
      // Fall through to raw binary
    }
  }

  // 4. Check if predominantly plain text
  let printableCount = 0;
  const sampleSize = Math.min(bytes.length, 512);
  for (let i = 0; i < sampleSize; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) {
      printableCount++;
    }
  }

  if (sampleSize > 0 && printableCount / sampleSize > 0.85) {
    const text = new TextDecoder("utf-8").decode(bytes);
    return parseSportsysEntryFile(text);
  }

  // 5. Proprietary binary stream
  return parseSportsysRawBinary(bytes);
}

/**
 * Universal asynchronous parser accepting strings, Buffer, Uint8Array, or ArrayBuffer.
 */
export async function parseSportsysInput(
  input: string | Uint8Array | ArrayBuffer | Buffer,
): Promise<SportsysParseResult> {
  if (typeof input === "string") {
    return parseSportsysEntryFile(input);
  }
  return parseSportsysBinary(input);
}

