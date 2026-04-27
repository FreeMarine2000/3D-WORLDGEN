import { STUDIO_NOTES } from './pageData.js'

function StudioNotesPage() {
  return (
    <section className="content-page">
      <div className="content-page__hero">
        <p className="section-kicker">Studio notes</p>
        <h2>How the interface now flows</h2>
        <p>
          The studio is split into a cinematic builder, a prompt atlas, and a notes page so the experience feels
          more like a tool suite than a single stacked panel.
        </p>
      </div>

      <div className="notes-grid">
        {STUDIO_NOTES.map((note) => (
          <article key={note.title} className="note-card">
            <h3>{note.title}</h3>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default StudioNotesPage
