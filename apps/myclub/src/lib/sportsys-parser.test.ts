import assert from "node:assert/strict";
import { describe, it } from "node:test";
import zlib from "node:zlib";
import {
  normalizeCourse,
  normalizeDate,
  normalizeGender,
  normalizeStroke,
  parseSportsysBinary,
  parseSportsysEntryFile,
  parseSportsysInput,
  parseSportsysTimeToMs,
} from "./sportsys-parser";

describe("sportsys-parser > normalization & utilities", () => {
  it("normalizes swimming strokes accurately", () => {
    assert.equal(normalizeStroke("50m Freestyle"), "FREESTYLE");
    assert.equal(normalizeStroke("Free"), "FREESTYLE");
    assert.equal(normalizeStroke("FR"), "FREESTYLE");
    assert.equal(normalizeStroke("Backstroke"), "BACKSTROKE");
    assert.equal(normalizeStroke("BK"), "BACKSTROKE");
    assert.equal(normalizeStroke("Breast"), "BREASTSTROKE");
    assert.equal(normalizeStroke("BR"), "BREASTSTROKE");
    assert.equal(normalizeStroke("Butterfly"), "BUTTERFLY");
    assert.equal(normalizeStroke("Fly"), "BUTTERFLY");
    assert.equal(normalizeStroke("Individual Medley"), "INDIVIDUAL_MEDLEY");
    assert.equal(normalizeStroke("IM"), "INDIVIDUAL_MEDLEY");
  });

  it("normalizes pool course accurately", () => {
    assert.equal(normalizeCourse("25m"), "SHORT_COURSE_METERS");
    assert.equal(normalizeCourse("S"), "SHORT_COURSE_METERS");
    assert.equal(normalizeCourse("Short Course"), "SHORT_COURSE_METERS");
    assert.equal(normalizeCourse("50m"), "LONG_COURSE_METERS");
    assert.equal(normalizeCourse("L"), "LONG_COURSE_METERS");
    assert.equal(normalizeCourse("Long Course"), "LONG_COURSE_METERS");
    assert.equal(normalizeCourse("Yards"), "SHORT_COURSE_YARDS");
    assert.equal(normalizeCourse("SCY"), "SHORT_COURSE_YARDS");
  });

  it("normalizes gender strings accurately", () => {
    assert.equal(normalizeGender("M"), "MALE");
    assert.equal(normalizeGender("Male"), "MALE");
    assert.equal(normalizeGender("Boys"), "MALE");
    assert.equal(normalizeGender("F"), "FEMALE");
    assert.equal(normalizeGender("Female"), "FEMALE");
    assert.equal(normalizeGender("Girls"), "FEMALE");
    assert.equal(normalizeGender("Mixed"), "OPEN");
    assert.equal(normalizeGender("Open"), "OPEN");
  });

  it("parses diverse swim time formats into milliseconds", () => {
    // mm:ss.hh
    const t1 = parseSportsysTimeToMs("1:04.25");
    assert.equal(t1.isNoTime, false);
    assert.equal(t1.timeMs, 64250);

    // ss.hh
    const t2 = parseSportsysTimeToMs("29.40");
    assert.equal(t2.isNoTime, false);
    assert.equal(t2.timeMs, 29400);

    // dot notation mm.ss.hh
    const t3 = parseSportsysTimeToMs("2.15.80");
    assert.equal(t3.isNoTime, false);
    assert.equal(t3.timeMs, 135800);

    // No time representations
    assert.equal(parseSportsysTimeToMs("NT").isNoTime, true);
    assert.equal(parseSportsysTimeToMs("N.T.").isNoTime, true);
    assert.equal(parseSportsysTimeToMs("").isNoTime, true);
    assert.equal(parseSportsysTimeToMs("0").isNoTime, true);
    assert.equal(parseSportsysTimeToMs(null).isNoTime, true);
  });

  it("normalizes dates in varied formats", () => {
    assert.equal(normalizeDate("2014-05-12"), "2014-05-12");
    assert.equal(normalizeDate("20140512"), "2014-05-12");
    assert.equal(normalizeDate("12/05/2014"), "2014-05-12");
    assert.equal(normalizeDate("12-05-2014"), "2014-05-12");
  });
});

describe("sportsys-parser > parsing Sportsystems file structures", () => {
  it("parses tagged section-based .sef files", () => {
    const sefContent = `
[MEET]
MeetName=Deckgala Spring Festival 2026
Course=25m
MeetDate=2026-05-18
Venue=Deckgala Aquatics Centre

[EVENTS]
1,1,Girls,50,Free,9/10,38.50,32.00,6.50
2,1,Boys,50,Free,9/10,37.50,31.00,6.50
3,1,Girls,100,Breast,11/12,1:28.00,,7.00

[SWIMMERS]
1234567,Smith,John,2015-03-14,M,DECK
7654321,Taylor,Alice,2014-08-22,F,DECK

[ENTRIES]
1234567,2,34.80
7654321,1,36.15
7654321,3,1:24.50
`;

    const result = parseSportsysEntryFile(sefContent);

    assert.equal(result.meet.meetName, "Deckgala Spring Festival 2026");
    assert.equal(result.meet.course, "SHORT_COURSE_METERS");
    assert.equal(result.meet.meetDate, "2026-05-18");
    assert.equal(result.meet.venue, "Deckgala Aquatics Centre");

    assert.equal(result.events.length, 3);
    assert.equal(result.events[0].eventNumber, 1);
    assert.equal(result.events[0].gender, "FEMALE");
    assert.equal(result.events[0].distance, 50);
    assert.equal(result.events[0].stroke, "FREESTYLE");
    assert.equal(result.events[0].qualifyingTimeMs, 38500);
    assert.equal(result.events[0].cutoffTimeMs, 32000);
    assert.equal(result.events[0].feePence, 650);

    assert.equal(result.swimmers.length, 2);
    const john = result.swimmers.find((s) => s.governingBodyId === "1234567");
    assert.ok(john);
    assert.equal(john.firstName, "John");
    assert.equal(john.lastName, "Smith");
    assert.equal(john.gender, "MALE");
    assert.equal(john.dateOfBirth, "2015-03-14");

    assert.equal(result.entries.length, 3);
    const johnEntry = result.entries.find((e) => e.governingBodyId === "1234567");
    assert.ok(johnEntry);
    assert.equal(johnEntry.eventNumber, 2);
    assert.equal(johnEntry.seedTimeMs, 34800);
    assert.equal(johnEntry.isNoTime, false);
  });

  it("parses standard hierarchical tagged line Sportsystems files", () => {
    const rawFile = `
MEET,North West Summer Gala,50m,2026-06-20,Manchester Aquatics
EVENT,101,1,M,100,Free,Open,1:02.00
EVENT,102,1,F,100,Free,Open,1:04.00
SWIMMER,998877,Williams,Jack,20120610,M,NWAC
ENTRY,101,58.40
SWIMMER,445566,Davies,Sophia,20130915,F,NWAC
ENTRY,102,NT
`;

    const result = parseSportsysEntryFile(rawFile);

    assert.equal(result.meet.meetName, "North West Summer Gala");
    assert.equal(result.meet.course, "LONG_COURSE_METERS");
    assert.equal(result.events.length, 2);
    assert.equal(result.swimmers.length, 2);
    assert.equal(result.entries.length, 2);

    const jackEntry = result.entries.find((e) => e.governingBodyId === "998877");
    assert.ok(jackEntry);
    assert.equal(jackEntry.eventNumber, 101);
    assert.equal(jackEntry.seedTimeMs, 58400);

    const sophiaEntry = result.entries.find((e) => e.governingBodyId === "445566");
    assert.ok(sophiaEntry);
    assert.equal(sophiaEntry.eventNumber, 102);
    assert.equal(sophiaEntry.isNoTime, true);
    assert.equal(sophiaEntry.seedTimeMs, null);
  });

  it("parses delimited CSV / TSV meet entry export formats", () => {
    const csvData = `
Event,Session,Stroke,Distance,Gender,AgeGroup,FirstName,LastName,SENumber,DOB,SeedTime
201,2,Backstroke,50,M,11-12,Leo,Davies,1122334,2014-02-18,36.50
202,2,Butterfly,50,F,11-12,Mia,Wilson,5566778,2014-07-29,34.20
203,2,Breaststroke,100,M,13-14,Harry,Evans,9988112,2012-11-04,1:22.45
`;

    const result = parseSportsysEntryFile(csvData);

    assert.equal(result.events.length, 3);
    assert.equal(result.swimmers.length, 3);
    assert.equal(result.entries.length, 3);

    const leoEvent = result.events.find((e) => e.eventNumber === 201);
    assert.ok(leoEvent);
    assert.equal(leoEvent.stroke, "BACKSTROKE");
    assert.equal(leoEvent.distance, 50);

    const leoSwimmer = result.swimmers.find((s) => s.governingBodyId === "1122334");
    assert.ok(leoSwimmer);
    assert.equal(leoSwimmer.firstName, "Leo");
    assert.equal(leoSwimmer.lastName, "Davies");

    const harryEntry = result.entries.find((e) => e.governingBodyId === "9988112");
    assert.ok(harryEntry);
    assert.equal(harryEntry.eventNumber, 203);
    assert.equal(harryEntry.seedTimeMs, 82450);
  });
});

describe("sportsys-parser > binary Sportsystems file processing", () => {
  function createTestZip(filename: string, content: string): Uint8Array {
    const contentBuf = Buffer.from(content);
    const deflated = zlib.deflateRawSync(contentBuf);
    const fnBuf = Buffer.from(filename);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // signature
    header.writeUInt16LE(20, 4); // version
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(8, 8); // compression = 8 (deflate)
    header.writeUInt16LE(0, 10); // time
    header.writeUInt16LE(0, 12); // date
    header.writeUInt32LE(0, 14); // crc
    header.writeUInt32LE(deflated.length, 18); // comp size
    header.writeUInt32LE(contentBuf.length, 22); // uncomp size
    header.writeUInt16LE(fnBuf.length, 26); // fn length
    header.writeUInt16LE(0, 28); // extra length

    return new Uint8Array(Buffer.concat([header, fnBuf, deflated]));
  }

  it("parses zipped binary .sef entry files (PKZip container)", async () => {
    const rawSefText = `
[MEET]
MeetName=Manchester Autumn Invitational 2026
Course=50m
MeetDate=2026-10-14
Venue=Manchester Aquatics Centre

[EVENTS]
10,1,Boys,100,Free,Open,59.00,,7.50
11,1,Girls,100,Free,Open,1:02.00,,7.50

[SWIMMERS]
9876543,Patel,Rohan,2013-05-10,M,NWAC

[ENTRIES]
9876543,10,57.80
`;

    const zipBytes = createTestZip("meet_EntryData.sef", rawSefText);
    const result = await parseSportsysInput(zipBytes);

    assert.equal(result.meet.meetName, "Manchester Autumn Invitational 2026");
    assert.equal(result.meet.course, "LONG_COURSE_METERS");
    assert.equal(result.events.length, 2);
    assert.equal(result.swimmers.length, 1);
    assert.equal(result.swimmers[0].governingBodyId, "9876543");
    assert.equal(result.swimmers[0].lastName, "Patel");
    assert.equal(result.swimmers[0].firstName, "Rohan");

    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].governingBodyId, "9876543");
    assert.equal(result.entries[0].eventNumber, 10);
    assert.equal(result.entries[0].seedTimeMs, 57800);
  });

  it("parses gzip and zlib compressed Sportsystems files", async () => {
    const sefText = `
MEET,Liverpool Sprint Gala,25m,2026-11-20
EVENT,1,1,F,50,Free,Open,28.00
SWIMMER,554433,Brown,Emma,2014-03-12,F
ENTRY,1,27.40
`;
    // Gzip
    const gzipBytes = new Uint8Array(zlib.gzipSync(Buffer.from(sefText)));
    const gzipResult = await parseSportsysInput(gzipBytes);
    assert.equal(gzipResult.meet.meetName, "Liverpool Sprint Gala");
    assert.equal(gzipResult.entries.length, 1);
    assert.equal(gzipResult.entries[0].seedTimeMs, 27400);

    // Zlib deflate
    const zlibBytes = new Uint8Array(zlib.deflateSync(Buffer.from(sefText)));
    const zlibResult = await parseSportsysInput(zlibBytes);
    assert.equal(zlibResult.meet.meetName, "Liverpool Sprint Gala");
    assert.equal(zlibResult.entries.length, 1);
    assert.equal(zlibResult.entries[0].seedTimeMs, 27400);
  });

  it("parses proprietary structured binary .sef files", async () => {
    const parts: Buffer[] = [];
    // 4-byte header: 'SEF\0'
    parts.push(Buffer.from([0x53, 0x45, 0x46, 0x00]));

    // Record 1: Meet (Opcode 0x01)
    const meetData = Buffer.concat([
      Buffer.from([0x01]), // 1 = 25m Short Course
      Buffer.from("Preston Binary Open 2026\0"),
      Buffer.from("2026-07-20\0"),
    ]);
    const meetHdr = Buffer.alloc(3);
    meetHdr[0] = 0x01;
    meetHdr.writeUInt16LE(meetData.length, 1);
    parts.push(meetHdr, meetData);

    // Record 2: Event (Opcode 0x02)
    const evData = Buffer.alloc(12);
    evData.writeUInt16LE(51, 0); // Event 51
    evData.writeUInt16LE(1, 2);  // Session 1
    evData.writeUInt16LE(100, 4); // 100m
    evData[6] = 1; // 1 = Freestyle
    evData[7] = 2; // 2 = Female
    evData.writeUInt32LE(6850, 8); // 1:08.50 cut
    const evHdr = Buffer.alloc(3);
    evHdr[0] = 0x02;
    evHdr.writeUInt16LE(evData.length, 1);
    parts.push(evHdr, evData);

    // Record 3: Swimmer (Opcode 0x03)
    const swimmerData = Buffer.concat([
      Buffer.from("1357924\0"),
      Buffer.from("Harrison\0"),
      Buffer.from("Chloe\0"),
      Buffer.from("2014-06-18\0"),
      Buffer.from("F\0"),
    ]);
    const swHdr = Buffer.alloc(3);
    swHdr[0] = 0x03;
    swHdr.writeUInt16LE(swimmerData.length, 1);
    parts.push(swHdr, swimmerData);

    // Record 4: Entry (Opcode 0x04)
    const entryData = Buffer.concat([
      Buffer.alloc(6),
      Buffer.from("1357924\0"),
    ]);
    entryData.writeUInt16LE(51, 0);
    entryData.writeUInt32LE(6540, 2); // 1:05.40 = 6540 hundredths
    const entHdr = Buffer.alloc(3);
    entHdr[0] = 0x04;
    entHdr.writeUInt16LE(entryData.length, 1);
    parts.push(entHdr, entryData);

    const binarySef = new Uint8Array(Buffer.concat(parts));
    const result = await parseSportsysBinary(binarySef);

    assert.equal(result.meet.meetName, "Preston Binary Open 2026");
    assert.equal(result.meet.course, "SHORT_COURSE_METERS");
    assert.equal(result.events.length, 1);
    assert.equal(result.events[0].eventNumber, 51);
    assert.equal(result.events[0].stroke, "FREESTYLE");
    assert.equal(result.events[0].distance, 100);
    assert.equal(result.events[0].gender, "FEMALE");
    assert.equal(result.events[0].qualifyingTimeMs, 68500);

    assert.equal(result.swimmers.length, 1);
    assert.equal(result.swimmers[0].governingBodyId, "1357924");
    assert.equal(result.swimmers[0].lastName, "Harrison");
    assert.equal(result.swimmers[0].firstName, "Chloe");
    assert.equal(result.swimmers[0].gender, "FEMALE");

    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].governingBodyId, "1357924");
    assert.equal(result.entries[0].eventNumber, 51);
    assert.equal(result.entries[0].seedTimeMs, 65400);
  });

  it("transparently parses raw text supplied as Uint8Array bytes", async () => {
    const rawText = `
MEET,Yorkshire Open,25m,2026-08-10
EVENT,5,1,M,50,Free,Open,26.50
SWIMMER,112233,Turner,Sam,2012-09-01,M
ENTRY,5,25.90
`;
    const bytes = new TextEncoder().encode(rawText);
    const result = await parseSportsysInput(bytes);

    assert.equal(result.meet.meetName, "Yorkshire Open");
    assert.equal(result.events.length, 1);
    assert.equal(result.swimmers.length, 1);
    assert.equal(result.entries.length, 1);
    assert.equal(result.entries[0].seedTimeMs, 25900);
  });
});


