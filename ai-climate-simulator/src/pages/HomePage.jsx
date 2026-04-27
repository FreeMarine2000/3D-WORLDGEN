import { LANDING_FEATURES, LANDING_METRICS, PROMPT_COLLECTION } from './pageData.js'

function HomePage({ navigateToPage }) {
  return (
    <section className="landing-page">
      <div className="landing-hero">
        <div className="landing-copy">
          <p className="section-kicker">Climate worlds, composed quietly</p>
          <h2>Design atmospheric landscapes with AI, then tune every variable by hand.</h2>
          <p className="landing-description">
            AI Climate Simulator turns short prompts into low-poly environments with terrain, water, vegetation,
            weather, and time-of-day already in harmony.
          </p>

          <div className="landing-actions">
            <button type="button" className="landing-button landing-button--primary" onClick={() => navigateToPage?.('builder')}>
              Open World Builder
            </button>
            <button type="button" className="landing-button landing-button--secondary" onClick={() => navigateToPage?.('atlas')}>
              Explore Prompt Atlas
            </button>
          </div>

          <div className="landing-metrics">
            {LANDING_METRICS.map((metric) => (
              <div key={metric.label} className="landing-metric">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-visual">
          <div className="device-card">
            <div className="device-card__header">
              <span />
              <span />
              <span />
            </div>
            <div className="device-card__canvas">
              <div className="device-card__sky" />
              <div className="device-card__ridge device-card__ridge--back" />
              <div className="device-card__ridge device-card__ridge--front" />
              <div className="device-card__water" />
              <div className="device-card__tile device-card__tile--one" />
              <div className="device-card__tile device-card__tile--two" />
              <div className="device-card__tile device-card__tile--three" />
            </div>
          </div>
        </div>
      </div>

      <div className="landing-grid">
        {LANDING_FEATURES.map((feature) => (
          <article key={feature.title} className="landing-card">
            <p className="landing-card__eyebrow">{feature.kicker}</p>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </div>

      <div className="landing-atlas-preview">
        <div className="content-page__hero">
          <p className="section-kicker">Prompt collection</p>
          <h2>Built for mood-first exploration</h2>
        </div>
        <div className="atlas-grid">
          {PROMPT_COLLECTION.map((entry) => (
            <article key={entry.prompt} className="atlas-card atlas-card--landing">
              <p className="atlas-card__terrain">{entry.terrain}</p>
              <h3>{entry.title}</h3>
              <p className="atlas-card__prompt">{entry.prompt}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomePage
