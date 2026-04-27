import { PROMPT_COLLECTION } from './pageData.js'

function WorldAtlasPage() {
  return (
    <section className="content-page">
      <div className="content-page__hero">
        <p className="section-kicker">Prompt atlas</p>
        <h2>Scene directions worth exploring next</h2>
        <p>
          Use these as starting points for the builder page, or remix them into more specific worlds with weather,
          time-of-day, and terrain cues.
        </p>
      </div>

      <div className="atlas-grid">
        {PROMPT_COLLECTION.map((entry) => (
          <article key={entry.prompt} className="atlas-card">
            <p className="atlas-card__terrain">{entry.terrain}</p>
            <h3>{entry.title}</h3>
            <p className="atlas-card__prompt">{entry.prompt}</p>
            <p className="atlas-card__mood">{entry.mood}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WorldAtlasPage
