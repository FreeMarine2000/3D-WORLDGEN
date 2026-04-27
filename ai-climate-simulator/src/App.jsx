import { useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage.jsx'
import WorldBuilderPage from './pages/WorldBuilderPage.jsx'
import WorldAtlasPage from './pages/WorldAtlasPage.jsx'
import StudioNotesPage from './pages/StudioNotesPage.jsx'

const PAGES = [
  {
    id: 'home',
    label: 'Home',
    kicker: 'Product overview',
    description: 'A calm, cinematic front door for the climate worldbuilding studio.',
    component: HomePage,
  },
  {
    id: 'builder',
    label: 'World Builder',
    kicker: 'Live scene composer',
    description: 'Prompt, tune, and watch the climate world reform in real time.',
    component: WorldBuilderPage,
  },
  {
    id: 'atlas',
    label: 'World Atlas',
    kicker: 'Curated inspirations',
    description: 'Browse scene directions and mood references for your next prompt.',
    component: WorldAtlasPage,
  },
  {
    id: 'notes',
    label: 'Studio Notes',
    kicker: 'System overview',
    description: 'See how prompts, sliders, terrain, and weather work together.',
    component: StudioNotesPage,
  },
]

function App() {
  const [activePageId, setActivePageId] = useState('home')
  const activePage = PAGES.find((page) => page.id === activePageId) ?? PAGES[0]
  const ActivePageComponent = activePage.component
  const isBuilderPage = activePage.id === 'builder'
  const isHomePage = activePage.id === 'home'

  return (
    <div className={`app-shell${isBuilderPage ? ' app-shell--builder' : ''}`}>
      {!isBuilderPage && <div className="ambient-orb ambient-orb--one" />}
      {!isBuilderPage && <div className="ambient-orb ambient-orb--two" />}

      {!isBuilderPage && (
        <header className="app-header">
          <div>
            <p className="app-kicker">AI Climate Simulator</p>
            <h1 className="app-title">Landscape-first worldbuilding studio</h1>
          </div>

          <nav className="page-nav" aria-label="Pages">
            {PAGES.map((page) => (
              <button
                key={page.id}
                type="button"
                className={`page-nav__button${page.id === activePage.id ? ' is-active' : ''}`}
                onClick={() => setActivePageId(page.id)}
              >
                <span>{page.label}</span>
                <small>{page.kicker}</small>
              </button>
            ))}
          </nav>
        </header>
      )}

      {!isBuilderPage && !isHomePage && (
        <section className="page-intro">
          <p className="page-intro__eyebrow">{activePage.kicker}</p>
          <p className="page-intro__description">{activePage.description}</p>
        </section>
      )}

      <main className={`app-content${isBuilderPage ? ' app-content--builder' : ''}`}>
        <ActivePageComponent navigateToPage={setActivePageId} />
      </main>
    </div>
  )
}

export default App
