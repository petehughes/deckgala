const features = [
  {
    number: "01",
    title: "Keep the deck moving",
    copy: "Launch multi-lane waves, keep interval pace, and capture every touch from the phones already in your coaches' hands.",
    icon: "↗",
  },
  {
    number: "02",
    title: "Stay ready offline",
    copy: "Timing stays on the device when pool Wi-Fi drops. Save the session poolside and sync when the connection comes back.",
    icon: "⌁",
  },
  {
    number: "03",
    title: "Bring the meet together",
    copy: "Keep member details, renewals, gala events and live spectator results connected in one club workflow.",
    icon: "◎",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero" id="platform">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> SWIM CLUB TIMING, REIMAGINED</p>
          <h1>Every lane.<br />Every split.<br /><span>In sync.</span></h1>
          <p className="hero-description">
            Offline deck timing. Seamless meet management. One reliable rhythm from training waves to gala day.
          </p>
          <div className="hero-actions">
            <a className="button" href="#workflow">See how it works <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="#clubs">Built for swimming clubs <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-proof">
            <span className="proof-icon">⌁</span>
            <span><strong>Deck first.</strong> Reliable with or without a signal.</span>
          </div>
        </div>

        <div className="deck-visual" aria-label="Illustration of an active multi-lane swim session">
          <div className="visual-topline"><span>TRAINING SESSION</span><span className="session-state"><i /> IN PROGRESS</span></div>
          <div className="visual-title"><div><span className="eyebrow">WAVE 04 <span className="separator">/</span> MAIN SET</span><h2>Freestyle · 200m</h2></div><span className="course-chip">25m POOL</span></div>
          <div className="lane-board">
            <div className="lane-row lane-row-active"><span className="lane-number">01</span><span className="lane-swimmer">A. Morgan</span><span className="lane-bar"><i style={{ width: "77%" }} /></span><strong>01:14.82</strong><span className="lane-state">TOUCH</span></div>
            <div className="lane-row"><span className="lane-number">02</span><span className="lane-swimmer">J. Patel</span><span className="lane-bar"><i style={{ width: "62%" }} /></span><strong>01:15.06</strong><span className="lane-state muted-state">SWIMMING</span></div>
            <div className="lane-row"><span className="lane-number">03</span><span className="lane-swimmer">S. Williams</span><span className="lane-bar"><i style={{ width: "48%" }} /></span><strong>01:16.31</strong><span className="lane-state muted-state">SWIMMING</span></div>
            <div className="lane-row"><span className="lane-number">04</span><span className="lane-swimmer">R. Clarke</span><span className="lane-bar"><i style={{ width: "34%" }} /></span><strong>01:18.44</strong><span className="lane-state muted-state">SWIMMING</span></div>
          </div>
          <div className="visual-footer"><span><i className="sync-dot" /> SESSION SAVED ON DEVICE</span><span>LAST SPLIT <strong>00:37.26</strong></span></div>
          <div className="visual-glow" />
        </div>
        <div className="hero-grid" aria-hidden="true" />
      </section>

      <section className="workflow-strip" id="workflow" aria-label="AquaTeamHub workflow">
        <div><span className="step-count">01</span><span>Set the pace</span><span className="step-line" /></div>
        <div><span className="step-count">02</span><span>Capture every touch</span><span className="step-line" /></div>
        <div><span className="step-count">03</span><span>Share the results</span></div>
      </section>

      <section className="features section-shell">
        <div className="section-intro">
          <p className="eyebrow">PURPOSE-BUILT FOR THE POOLSIDE</p>
          <h2>Less setup.<br /><span>More swimming.</span></h2>
          <p>Wet hands. Busy lanes. Unreliable Wi-Fi. AquaTeamHub keeps the important things clear and the session moving.</p>
        </div>
        <div className="feature-list">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <div><h3>{feature.title}</h3><p>{feature.copy}</p></div>
              <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="club-cta" id="clubs">
        <div className="cta-orbit orbit-one" /><div className="cta-orbit orbit-two" />
        <div className="cta-copy">
          <p className="eyebrow">ONE CLUB. ONE CLEAR VIEW.</p>
          <h2>From the first<br />whistle to the<br /><span>final result.</span></h2>
          <p>Give coaches, officials and families the right view of every session and every gala.</p>
          <a className="button button-light" href="#platform">Discover the platform <span aria-hidden="true">↗</span></a>
        </div>
        <div className="cta-stack" aria-hidden="true">
          <div className="stack-card stack-members"><span>CLUB ROSTER</span><strong>Swimmers, ready.</strong><i>MEMBERSHIP <b>ON TRACK</b></i></div>
          <div className="stack-card stack-gala"><span>LIVE GALA</span><strong>Northside Spring Meet</strong><i><b className="pulse" /> EVENT 12 · HEAT 03</i><div className="mini-lanes"><span>LANE 2 <b>00:58.42</b></span><span>LANE 4 <b>00:59.07</b></span><span>LANE 6 <b>01:00.11</b></span></div></div>
          <div className="stack-card stack-share"><span>ON DECK</span><strong>Split confirmed</strong><i>LANE 04 <b>00:31.08</b></i></div>
        </div>
      </section>

      <section className="closing section-shell">
        <p className="eyebrow">READY WHEN THE WHISTLE BLOWS</p>
        <h2>Make every session<br /><span>count.</span></h2>
        <a className="button" href="#platform">Meet AquaTeamHub <span aria-hidden="true">↗</span></a>
      </section>
    </main>
  );
}
