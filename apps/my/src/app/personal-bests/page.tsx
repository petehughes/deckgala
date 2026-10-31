import Link from "next/link";
import { BestTimeList, type PersonalBestRecord } from "@aquateamhub/controls";
import { getParentContext } from "../../lib/parent-context";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function PersonalBestsPage() {
  const { activeSwimmer } = await getParentContext();

  if (!activeSwimmer) {
    return (
      <main className="page-shell">
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <h2>No Swimmer Selected</h2>
          <Link href="/my-swimmers" className="btn-primary" style={{ display: "inline-flex", marginTop: "12px" }}>
            Select Swimmer
          </Link>
        </div>
      </main>
    );
  }

  // Fetch all personal bests for both SC and LC courses
  const pbs = await prisma.personalBest.findMany({
    where: {
      swimmerId: activeSwimmer.id,
    },
    orderBy: [{ stroke: "asc" }, { distance: "asc" }],
  });

  // Map to BestTimeList records
  const records: PersonalBestRecord[] = pbs.map((pb) => {
    return {
      id: pb.id,
      stroke: pb.stroke,
      distance: pb.distance,
      course: pb.course,
      timeMs: pb.timeMs,
      achievedAt: pb.achievedAt,
      meetName: pb.meetName,
      timingLevel: null,
    };
  });

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Official Times &amp; Rankings</p>
          <h1>Personal Bests (PBs)</h1>
          <p className="muted">
            Tracking time progression for <strong>{activeSwimmer.firstName} {activeSwimmer.lastName}</strong> ({activeSwimmer.clubName})
          </p>
        </div>
      </section>

      <BestTimeList
        records={records}
        swimmerName={`${activeSwimmer.firstName} ${activeSwimmer.lastName}`}
        defaultView="grid"
        defaultCourse="SHORT_COURSE_METERS"
        allowConversions={true}
      />
    </main>
  );
}
