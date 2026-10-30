import { notFound, redirect } from "next/navigation";
import { getActiveClub } from "../../../../lib/club-context";
import { prisma } from "../../../../lib/prisma";
import { calculateCompetitionAge } from "../../../../lib/age-calculator";
import {
  GalaEntryWizard,
  type WizardEvent,
  type WizardSwimmer,
} from "../../../../components/galas/gala-entry-wizard";

export const dynamic = "force-dynamic";

export default async function GalaEnterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: galaId } = await params;
  const { clubId, role, session } = await getActiveClub();

  const gala = await prisma.gala.findFirst({
    where: {
      id: galaId,
      clubId,
      ...(role === "PARENT" ? { isPublic: true } : {}),
    },
    include: {
      venueRef: true,
      events: {
        orderBy: [{ sessionNumber: "asc" }, { eventNumber: "asc" }],
      },
      entries: {
        include: {
          eventEntries: true,
        },
      },
    },
  });

  if (!gala) notFound();

  // Load swimmers accessible to this user
  // Parents see only their linked children; coaches/admins see all club swimmers
  const rawSwimmers = await prisma.swimmer.findMany({
    where: role === "PARENT" ? { clubId, member: { userId: session.user.id } } : { clubId },
    include: {
      personalBests: true,
      member: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  if (rawSwimmers.length === 0 && role === "PARENT") {
    redirect("/my-swimmers");
  }

  // Transform swimmers into WizardSwimmer format with age calculated on meet date
  const wizardSwimmers: WizardSwimmer[] = rawSwimmers.map((swimmer) => {
    const age = swimmer.dateOfBirth
      ? calculateCompetitionAge(
          swimmer.dateOfBirth,
          gala.startsAt,
          gala.ageRule === "AGE_DEC_31" ? "AGE_DEC_31" : "AGE_DAY_OF_MEET",
        )
      : 10;

    return {
      id: swimmer.id,
      firstName: swimmer.firstName,
      lastName: swimmer.lastName,
      gender: swimmer.gender,
      age,
      dateOfBirthFormatted: swimmer.dateOfBirth
        ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(
            swimmer.dateOfBirth,
          )
        : "Not set",
      personalBests: swimmer.personalBests.map((pb) => ({
        stroke: pb.stroke,
        distance: pb.distance,
        course: pb.course,
        timeMs: pb.timeMs,
      })),
    };
  });

  // Transform events into WizardEvent format
  const wizardEvents: WizardEvent[] = gala.events.map((event) => ({
    id: event.id,
    eventNumber: event.eventNumber,
    sessionNumber: event.sessionNumber,
    sessionEventNumber: event.sessionEventNumber,
    name: event.name,
    distance: event.distance,
    stroke: event.stroke,
    gender: event.gender,
    ageGroup: event.ageGroup,
    minAge: event.minAge,
    maxAge: event.maxAge,
    feePence: event.feePence ?? gala.defaultEventFeePence,
    qualifyingTimeMs: event.qualifyingTimeMs,
    cutoffTimeMs: event.cutoffTimeMs,
    allowNoTime: event.allowNoTime,
  }));

  // Map existing selections
  const existingSelections: Record<string, string[]> = {};
  for (const entry of gala.entries) {
    existingSelections[entry.swimmerId] = entry.eventEntries.map((ee) => ee.eventId);
  }

  const startsAtFormatted = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(gala.startsAt);

  return (
    <div className="page-shell">
      <GalaEntryWizard
        galaId={gala.id}
        galaName={gala.name}
        venueName={gala.venueRef?.name || gala.venue || "Competition Pool"}
        course={gala.course}
        startsAtFormatted={startsAtFormatted}
        entryFeePence={gala.entryFeePence}
        defaultEventFeePence={gala.defaultEventFeePence}
        swimmers={wizardSwimmers}
        events={wizardEvents}
        existingSelections={existingSelections}
      />
    </div>
  );
}

