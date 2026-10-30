import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">404 Error</p>
          <h1>Page Not Found</h1>
          <p className="muted">
            The fixture, swimmer, squad, or resource you were looking for could not be found.
          </p>
          <div style={{ marginTop: "20px" }}>
            <Link href="/" className="button-secondary" style={{ textDecoration: "none", display: "inline-block" }}>
              ← Return to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

