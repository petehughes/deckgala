"use client";

import { useState, useTransition, useId } from "react";
import { importSportsysGalaEntries } from "../../app/actions";
import {
  parseSportsysInput,
  type SportsysParseResult,
} from "../../lib/sportsys-parser";

interface SportsysEntryUploaderProps {
  galaId: string;
}

export function SportsysEntryUploader({ galaId }: SportsysEntryUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [preview, setPreview] = useState<SportsysParseResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFeedback(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const parsed = await parseSportsysInput(new Uint8Array(arrayBuffer));
      setPreview(parsed);
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to read or parse file content.",
      });
    }
  };

  const handleTextChange = async (text: string) => {
    setRawText(text);
    setFeedback(null);
    if (!text.trim()) {
      setPreview(null);
      return;
    }

    try {
      const parsed = await parseSportsysInput(text);
      setPreview(parsed);
    } catch {
      // Ignore intermediate parse issues while typing
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setFeedback(null);

    try {
      const arrayBuffer = await droppedFile.arrayBuffer();
      const parsed = await parseSportsysInput(new Uint8Array(arrayBuffer));
      setPreview(parsed);
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to read dropped file.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (!file && !rawText.trim()) {
      setFeedback({
        type: "error",
        message: "Please choose a Sportsystems file (.sef, .set, .sed, CSV) or paste the entry text.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("galaId", galaId);

    if (file) {
      formData.append("file", file);
    } else {
      formData.append("content", rawText);
    }

    startTransition(async () => {
      try {
        const res = await importSportsysGalaEntries(formData);
        if (res.success) {
          setFeedback({
            type: "success",
            message: res.message,
          });
          setFile(null);
          setRawText("");
          setPreview(null);
        } else {
          setFeedback({
            type: "error",
            message: res.message || "Failed to import entries.",
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Error importing entries.",
        });
      }
    });
  };

  return (
    <section className="panel" aria-labelledby="sportsys-import-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Meet Organisation & Entries</p>
          <h2 id="sportsys-import-title">Import Sportsystems Entry File</h2>
        </div>
        <div className="portal-links">
          <button
            type="button"
            className="secondary-btn"
            style={{ fontSize: "12px", padding: "6px 12px" }}
            onClick={() => setShowPasteArea(!showPasteArea)}
          >
            {showPasteArea ? "Use File Upload" : "Paste Raw Text"}
          </button>
        </div>
      </div>

      <p className="muted" style={{ marginBottom: "20px" }}>
        Ingest official SPORTSYSTEMS Meet Organisation & Entry Manager files (<code>.sef</code>, <code>.set</code>, <code>.sed</code>, or delimited CSV/text). AquaTeamHub automatically maps events, matches club swimmers by Swim England number, locks seed times, and creates verified entries.
      </p>

      {feedback && (
        <div
          role="alert"
          style={{
            padding: "14px 18px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            lineHeight: 1.5,
            border: feedback.type === "success"
              ? "1px solid var(--color-pace-green, #00E676)"
              : "1px solid var(--color-horn-coral, #FF5A36)",
            background: feedback.type === "success"
              ? "rgba(0, 230, 118, 0.08)"
              : "rgba(255, 90, 54, 0.08)",
            color: feedback.type === "success"
              ? "var(--color-pace-green, #00E676)"
              : "#ff8a73",
          }}
        >
          <strong>{feedback.type === "success" ? "✓ Import Complete: " : "✕ Import Error: "}</strong>
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!showPasteArea ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: "2px dashed var(--border-subtle, rgba(255, 255, 255, 0.15))",
              borderRadius: "12px",
              padding: "36px 20px",
              textAlign: "center",
              background: "rgba(22, 35, 59, 0.4)",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
              marginBottom: "20px",
            }}
            onClick={() => document.getElementById(fileInputId)?.click()}
          >
            <input
              id={fileInputId}
              type="file"
              accept=".sef,.set,.sed,.txt,.csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📥</div>
            <h3 style={{ fontSize: "16px", margin: "0 0 6px 0", color: "var(--text-primary)" }}>
              {file ? file.name : "Drag & drop your Sportsystems file here"}
            </h3>
            <p className="muted" style={{ margin: "0 0 12px 0", fontSize: "12px" }}>
              Accepts <code>.sef</code>, <code>.set</code>, <code>.sed</code>, <code>.txt</code>, and <code>.csv</code> entry exports
            </p>
            <button
              type="button"
              className="secondary-btn"
              style={{ pointerEvents: "none", fontSize: "12px" }}
            >
              {file ? "Change File" : "Browse Files"}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px" }}>
              Paste SPORTSYSTEMS / CSV Content
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste raw .sef content, [MEET], [EVENTS], [ENTRIES] or delimited rows here..."
              style={{
                width: "100%",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "12px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))",
                background: "var(--bg-abyss, #0B1528)",
                color: "var(--text-primary, #ffffff)",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {/* Live Parsing Preview Card */}
        {preview && (preview.events.length > 0 || preview.entries.length > 0) && (
          <div
            style={{
              padding: "18px",
              borderRadius: "10px",
              background: "rgba(0, 229, 255, 0.05)",
              border: "1px solid rgba(0, 229, 255, 0.2)",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <strong style={{ color: "var(--color-electric-cyan, #00E5FF)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ✓ Parsed File Summary
              </strong>
              {preview.meet.meetName && (
                <span className="eyebrow" style={{ margin: 0 }}>
                  Meet: {preview.meet.meetName}
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div style={{ padding: "10px", background: "rgba(22, 35, 59, 0.6)", borderRadius: "8px" }}>
                <p className="muted" style={{ margin: "0 0 4px 0", fontSize: "11px" }}>Events Detected</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {preview.events.length}
                </p>
              </div>
              <div style={{ padding: "10px", background: "rgba(22, 35, 59, 0.6)", borderRadius: "8px" }}>
                <p className="muted" style={{ margin: "0 0 4px 0", fontSize: "11px" }}>Swimmers</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {preview.swimmers.length}
                </p>
              </div>
              <div style={{ padding: "10px", background: "rgba(22, 35, 59, 0.6)", borderRadius: "8px" }}>
                <p className="muted" style={{ margin: "0 0 4px 0", fontSize: "11px" }}>Race Entries</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-electric-cyan, #00E5FF)" }}>
                  {preview.entries.length}
                </p>
              </div>
            </div>

            {/* Sample of entries */}
            {preview.entries.length > 0 && (
              <div style={{ fontSize: "12px" }}>
                <p className="muted" style={{ margin: "0 0 8px 0" }}>Sample Entries Preview:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {preview.entries.slice(0, 6).map((ent, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.07)",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      Event #{ent.eventNumber} ({ent.swimmerName || ent.governingBodyId || "Swimmer"}: {ent.isNoTime ? "NT" : `${(ent.seedTimeMs! / 1000).toFixed(2)}s`})
                    </span>
                  ))}
                  {preview.entries.length > 6 && (
                    <span className="muted" style={{ padding: "3px 8px", fontSize: "11px" }}>
                      +{preview.entries.length - 6} more entries
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          {(file || rawText.trim()) && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setFile(null);
                setRawText("");
                setPreview(null);
                setFeedback(null);
              }}
              disabled={isPending}
            >
              Clear
            </button>
          )}

          <button
            type="submit"
            disabled={isPending || (!file && !rawText.trim())}
            style={{ minWidth: "160px" }}
          >
            {isPending ? "Ingesting File..." : "Import Entries Now"}
          </button>
        </div>
      </form>
    </section>
  );
}

