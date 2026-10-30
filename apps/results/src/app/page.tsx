"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  webSocketEventSchema,
  type WebSocketEvent,
} from "@aquateamhub/api-types";
import { apiBaseUrl, formatMeetDate, formatRaceTime } from "../lib/results";

interface PublicRaceResult {
  id: string;
  swimmerName: string;
  heat: number | null;
  lane: number | null;
  timeMs: number | null;
  status: "OFFICIAL" | "UNOFFICIAL" | "DISQUALIFIED" | "DID_NOT_FINISH" | "DID_NOT_START";
  infractionCode: string | null;
  recordedAt: string;
  splits: Array<{ splitNumber: number; distance: number | null; timeMs: number }>;
}

interface PublicEvent {
  id: string;
  eventNumber: number;
  name: string;
  distance: number;
  stroke: string;
  gender: string | null;
  ageGroup: string | null;
  results: PublicRaceResult[];
}

interface PublicGala {
  id: string;
  name: string;
  venue: string | null;
  course: string;
  startsAt: string;
  endsAt: string | null;
  club: { name: string };
  events: PublicEvent[];
}

interface GalaSummary extends Omit<PublicGala, "events"> {
  _count: { events: number };
}

interface ApiEnvelope<T> {
  data: T;
}

interface LiveLane {
  lane: number;
  elapsedMs?: number;
  status: "touch" | "disqualified";
  infractionCode?: string;
}

type ConnectionState = "connecting" | "live" | "reconnecting" | "offline";

const courseLabel: Record<string, string> = {
  SHORT_COURSE_METERS: "25m",
  LONG_COURSE_METERS: "50m",
  SHORT_COURSE_YARDS: "Yards",
};

const strokeLabel: Record<string, string> = {
  FREESTYLE: "Freestyle",
  BACKSTROKE: "Backstroke",
  BREASTSTROKE: "Breaststroke",
  BUTTERFLY: "Butterfly",
  INDIVIDUAL_MEDLEY: "Individual medley",
};

function resultStatusLabel(result: PublicRaceResult): string {
  if (result.status === "DISQUALIFIED") {
    return result.infractionCode ? `DQ · ${result.infractionCode}` : "Disqualified";
  }
  if (result.status === "DID_NOT_FINISH") return "Did not finish";
  if (result.status === "DID_NOT_START") return "Did not start";
  return result.status === "OFFICIAL" ? "Official" : "Unofficial";
}

export default function ResultsPage() {
  const [galas, setGalas] = useState<GalaSummary[]>([]);
  const [selectedGalaId, setSelectedGalaId] = useState("");
  const [gala, setGala] = useState<PublicGala | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [liveEvent, setLiveEvent] = useState<WebSocketEvent | null>(null);
  const [liveLanes, setLiveLanes] = useState<Record<number, LiveLane>>({});
  const activeStartRef = useRef<Extract<WebSocketEvent, { type: "start_gun" }> | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [loadingGalas, setLoadingGalas] = useState(true);
  const [loadingGala, setLoadingGala] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = useMemo(apiBaseUrl, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/api/v1/public/galas`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load public meets");
        return response.json() as Promise<ApiEnvelope<GalaSummary[]>>;
      })
      .then(({ data }) => {
        setGalas(data);
        setSelectedGalaId(data[0]?.id ?? "");
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to load public meets");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingGalas(false);
      });
    return () => controller.abort();
  }, [apiUrl]);

  useEffect(() => {
    if (!selectedGalaId) {
      setGala(null);
      return;
    }

    const controller = new AbortController();
    setLoadingGala(true);
    setLiveEvent(null);
    setLiveLanes({});
    activeStartRef.current = null;
    fetch(`${apiUrl}/api/v1/public/galas/${encodeURIComponent(selectedGalaId)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("This meet is no longer public");
        return response.json() as Promise<ApiEnvelope<PublicGala>>;
      })
      .then(({ data }) => {
        setGala(data);
        setSelectedEventId((current) =>
          data.events.some((event) => event.id === current) ? current : data.events[0]?.id ?? "",
        );
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setGala(null);
          setError(cause instanceof Error ? cause.message : "Unable to load this meet");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingGala(false);
      });
    return () => controller.abort();
  }, [apiUrl, selectedGalaId]);

  useEffect(() => {
    if (!gala) {
      setConnection("offline");
      return;
    }
    setConnection("connecting");
    const source = new EventSource(
      `${apiUrl}/api/v1/public/galas/${encodeURIComponent(gala.id)}/stream`,
    );
    source.onopen = () => setConnection("live");
    source.onerror = () => setConnection(source.readyState === EventSource.CLOSED ? "offline" : "reconnecting");
    source.addEventListener("gala-event", (message) => {
      let rawEvent: unknown;
      try {
        rawEvent = JSON.parse((message as MessageEvent<string>).data);
      } catch {
        return;
      }
      const parsed = webSocketEventSchema.safeParse(rawEvent);
      if (!parsed.success || parsed.data.galaId !== gala.id) return;
      const event = parsed.data;
      if (event.type === "start_gun") {
        activeStartRef.current = event;
        setLiveEvent(event);
        setLiveLanes({});
      } else {
        if (!activeStartRef.current) return;
        setLiveLanes((current) => {
          if (event.type === "lane_touch") {
            return { ...current, [event.lane]: { lane: event.lane, elapsedMs: event.elapsedMs, status: "touch" } };
          }
          return {
            ...current,
            [event.lane]: {
              lane: event.lane,
              status: "disqualified",
              infractionCode: event.infractionCode,
            },
          };
        });
      }
    });
    return () => source.close();
  }, [apiUrl, gala]);

  const selectedEvent = gala?.events.find((event) => event.id === selectedEventId) ?? null;
  const liveHeat = liveEvent?.type === "start_gun" ? liveEvent.heat : null;
  const liveLanesForHeat = Object.values(liveLanes).sort((a, b) => a.lane - b.lane);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">From the pool deck, live</p>
          <h1>Meet <span>results.</span></h1>
          <p className="intro">Follow the heats, lane by lane. Official times are confirmed by meet officials.</p>
        </div>
        <div className={`connection connection-${connection}`}>
          <span className="connection-dot" />
          {connection === "live" ? "LIVE CONNECTION" : connection === "reconnecting" ? "RECONNECTING" : connection === "connecting" ? "CONNECTING" : "OFFLINE"}
        </div>
      </section>

      <section className="meet-selector panel" aria-label="Select a public meet">
        <div className="selector-icon" aria-hidden="true">◎</div>
        <label htmlFor="meet-select">Published meets</label>
        <select
          id="meet-select"
          value={selectedGalaId}
          onChange={(event) => setSelectedGalaId(event.target.value)}
          disabled={loadingGalas || galas.length === 0}
        >
          <option value="">{loadingGalas ? "Loading meets…" : "No public meets available"}</option>
          {galas.map((item) => (
            <option key={item.id} value={item.id}>{item.name} · {item.club.name}</option>
          ))}
        </select>
      </section>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      {loadingGala && <div className="panel loading-panel" role="status">Loading meet details…</div>}

      {!loadingGalas && galas.length === 0 && !error && (
        <div className="panel empty-state">
          <span aria-hidden="true">◉</span>
          <h2>No public meets right now</h2>
          <p>When a club publishes a gala, live events and results will appear here.</p>
        </div>
      )}

      {gala && !loadingGala && (
        <>
          <section className="meet-overview">
            <div className="meet-title">
              <p className="eyebrow">{gala.club.name} <span className="eyebrow-divider">/</span> {courseLabel[gala.course] ?? gala.course}</p>
              <h2>{gala.name}</h2>
              <p>{gala.venue ?? "Venue not listed"} <span className="meta-divider">·</span> {formatMeetDate(gala.startsAt)}</p>
            </div>
            <div className="meet-count"><strong>{gala.events.length.toString().padStart(2, "0")}</strong><span>EVENTS</span></div>
          </section>

          <section className="results-layout">
            <aside className="event-panel panel" aria-label="Gala events">
              <div className="panel-heading"><p className="eyebrow">Schedule</p><h2>Events</h2></div>
              <div className="event-nav">
                {gala.events.map((event) => (
                  <button
                    className={`event-option${event.id === selectedEventId ? " selected" : ""}`}
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <span className="event-number">{event.eventNumber.toString().padStart(2, "0")}</span>
                    <span className="event-name">{event.name}<small>{event.distance}{courseLabel[gala.course] === "Yards" ? "yd" : "m"} · {strokeLabel[event.stroke] ?? event.stroke}</small></span>
                    <span className="event-chevron" aria-hidden="true">›</span>
                  </button>
                ))}
                {gala.events.length === 0 && <p className="empty-note">Events have not been added yet.</p>}
              </div>
            </aside>

            <div className="event-content">
              <section className="panel live-panel" aria-live="polite">
                <div className="panel-heading live-heading">
                  <div><p className="eyebrow"><span className="live-dot" /> LIVE ON DECK</p><h2>{liveEvent?.type === "start_gun" ? `Event ${liveEvent.eventNumber} · Heat ${liveEvent.heat}` : "Waiting for the next start"}</h2></div>
                  {liveHeat !== null && <span className="heat-chip">HEAT {liveHeat.toString().padStart(2, "0")}</span>}
                </div>
                {liveLanesForHeat.length > 0 ? (
                  <div className="live-lanes">
                    {liveLanesForHeat.map((lane) => (
                      <div className="live-lane" key={lane.lane}>
                        <span className="live-lane-number">LANE {lane.lane.toString().padStart(2, "0")}</span>
                        <strong className={lane.status === "disqualified" ? "dq-time" : ""}>{lane.status === "disqualified" ? "DQ" : formatRaceTime(lane.elapsedMs ?? null)}</strong>
                        <span className={`lane-result-status${lane.status === "disqualified" ? " dq-label" : ""}`}>{lane.status === "disqualified" ? lane.infractionCode : "TOUCH RECORDED"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="waiting-state"><span className="waiting-icon">⌁</span><p>Live lane touches will appear here as officials record them.</p></div>
                )}
              </section>

              {selectedEvent && (
                <section className="panel official-panel">
                  <div className="panel-heading results-heading">
                    <div><p className="eyebrow">Meet record</p><h2>Event {selectedEvent.eventNumber} <span>·</span> {selectedEvent.name}</h2><p>{selectedEvent.distance}{courseLabel[gala.course] === "Yards" ? "yd" : "m"} {strokeLabel[selectedEvent.stroke] ?? selectedEvent.stroke}{selectedEvent.ageGroup ? ` · ${selectedEvent.ageGroup}` : ""}</p></div>
                    <span className="result-count">{selectedEvent.results.length} RESULTS</span>
                  </div>
                  {selectedEvent.results.length > 0 ? (
                    <div className="table-scroll">
                      <table>
                        <thead><tr><th>Heat / lane</th><th>Swimmer</th><th>Time</th><th>Status</th></tr></thead>
                        <tbody>
                          {selectedEvent.results.map((result) => (
                            <tr key={result.id}>
                              <td className="heat-lane">{result.heat ?? "—"} <span>/</span> {result.lane ?? "—"}</td>
                              <td className="swimmer-name">{result.swimmerName}</td>
                              <td className="result-time">{formatRaceTime(result.timeMs)}</td>
                              <td><span className={`result-badge result-${result.status.toLowerCase().replaceAll("_", "-")}`}>{resultStatusLabel(result)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="waiting-state compact"><p>No recorded results for this event yet.</p></div>
                  )}
                  {selectedEvent.results.some((result) => result.splits.length > 0) && (
                    <p className="split-note">Split details are available to officials in the club portal.</p>
                  )}
                </section>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
