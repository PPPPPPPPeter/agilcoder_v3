import { useState, useRef } from 'react'
import type { RenderDescriptor } from '@/types'

// ─── Content shape ────────────────────────────────────────────────────────────

interface AcademicContent {
  name: string
  title: string
  affiliation: string
  bio: string
  stats: { label: string; value: string }[]
  navigation: string[]
  news: { date: string; text: string }[]
  publications: { title: string; venue: string; year: number; tags: string[]; abstract: string }[]
  projects: { title: string; description: string; status: string }[]
  skills: string[]
  links: { label: string; url: string }[]
}

// ─── Base CSS (default styles — overridden by manifest scopedCSS) ─────────────

const BASE_CSS = `
/* ── Academic Homepage — Base Styles ───────────────────────────────────────── */

.page-root {
  background: #ffffff;
  color: #111827;
  font-size: 0.875rem;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* Navigation */
.nav-bar { background: #ffffff; border-bottom: 1px solid #f3f4f6; }
.nav-bar.nav-alt { background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
.nav-bar.nav-dark { background: #111827; border-bottom: 1px solid #374151; }
.nav-name { font-size: 0.75rem; font-weight: 600; color: #111827; }
.nav-item { font-size: 0.75rem; color: #9ca3af; transition: color 0.15s; }
.nav-item:hover { color: #4b5563; }
.nav-item.active { color: #111827; font-weight: 600; border-bottom: 1px solid #111827; }
.nav-item.nav-dark-item { color: #9ca3af; }
.nav-item.nav-dark-item:hover { color: #e5e7eb; }
.nav-item.nav-dark-item.active { color: #ffffff; font-weight: 600; border-bottom-color: #ffffff; }

/* Avatar */
.avatar {
  background: #f3f4f6;
  color: #9ca3af;
  font-weight: 700;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Profile */
.name { font-size: 1.5rem; font-weight: 700; color: #111827; line-height: 1.2; }
.name-lg { font-size: 1.875rem; font-weight: 700; color: #111827; line-height: 1.1; }
.name-xl { font-size: 2.25rem; font-weight: 700; color: #111827; line-height: 1.1; }
.name-dark { color: #ffffff; }
.title-text { font-size: 0.875rem; color: #6b7280; }
.title-text.dark { color: #9ca3af; }
.affiliation { font-size: 0.75rem; color: #9ca3af; }
.affiliation.dark { color: #6b7280; }

/* Links */
.link-item {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  color: #4b5563;
  text-decoration: none;
  transition: border-color 0.15s;
}
.link-item:hover { border-color: #9ca3af; }
.link-item.dark { border-color: #4b5563; color: #d1d5db; }
.link-item.dark:hover { border-color: #9ca3af; }
.link-item.underline-style {
  border: none;
  text-decoration: underline;
  text-underline-offset: 2px;
  color: #6b7280;
  padding: 0;
}
.link-item.underline-style:hover { color: #374151; }

/* Stats */
.stat-item { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 0.375rem; }
.stat-value { font-size: 1.125rem; font-weight: 700; color: #1f2937; }
.stat-value-lg { font-size: 1.25rem; font-weight: 700; color: #1f2937; }
.stat-label { font-size: 0.75rem; color: #9ca3af; }
.stat-label-upper { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }

/* Sections */
.section-heading {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.25rem;
}

/* Bio */
.bio { font-size: 0.875rem; line-height: 1.625; color: #374151; }

/* News */
.news-date { font-size: 0.75rem; color: #9ca3af; }
.news-text { color: #374151; }

/* Publications */
.publication-card {
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: border-color 0.15s;
}
.publication-card:hover { border-color: #e5e7eb; }
.publication-card.border-left {
  background: transparent;
  border: none;
  border-left: 2px solid #e5e7eb;
  border-radius: 0;
  padding-left: 1rem;
  transition: border-left-color 0.15s;
}
.publication-card.border-left:hover { border-left-color: #9ca3af; }
.publication-title { font-size: 0.875rem; font-weight: 500; color: #1f2937; line-height: 1.375; }
.publication-title-sm { font-size: 0.75rem; font-weight: 600; color: #1f2937; line-height: 1.375; }
.publication-venue { font-size: 0.75rem; color: #9ca3af; }
.publication-venue.italic { font-style: italic; color: #6b7280; }
.publication-abstract { font-size: 0.75rem; color: #4b5563; line-height: 1.5; border-top: 1px solid #e5e7eb; padding-top: 0.5rem; margin-top: 0.5rem; }
.publication-tag {
  font-size: 0.625rem;
  padding: 0.0625rem 0.375rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  color: #6b7280;
}
.publication-tag.filled { background: #f3f4f6; border: none; color: #6b7280; }
.publication-index { font-size: 0.75rem; color: #d1d5db; }

/* Projects */
.project-card { border: 1px solid #f3f4f6; border-radius: 0.375rem; }
.project-card.with-bg { background: #ffffff; border-color: #e5e7eb; transition: border-color 0.15s; }
.project-card.with-bg:hover { border-color: #d1d5db; }
.project-title { font-size: 0.75rem; font-weight: 600; color: #1f2937; }
.project-desc { font-size: 0.75rem; color: #6b7280; }
.project-status {
  font-size: 0.5625rem;
  padding: 0.0625rem 0.25rem;
  border-radius: 0.25rem;
  background: #f3f4f6;
  color: #6b7280;
}
.project-status[data-status="active"] { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }

/* Skills */
.skill-tag {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  color: #4b5563;
}
.skill-tag.filled { background: #f3f4f6; border: none; }
.skill-tag.pill { border-radius: 9999px; }

/* Sidebar label */
.sidebar-label { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }

/* Hero header (hero-banner layout) */
.hero-header { background: #111827; color: #ffffff; }
.stats-band { background: #ffffff; border-bottom: 1px solid #e5e7eb; }
.stats-band-cell { border-right: 1px solid #f3f4f6; }
.stats-band-cell:last-child { border-right: none; }
`

// ─── Shared nav-click helper ──────────────────────────────────────────────────

function useNavScroll() {
  const [activeNav, setActiveNav] = useState(0)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const handleNavClick = (i: number) => {
    setActiveNav(i)
    const filled = sectionRefs.current.filter(Boolean)
    const target = sectionRefs.current[Math.min(i, filled.length - 1)]
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return { activeNav, sectionRefs, handleNavClick }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LAYOUT: classic — single-column linear
// ═══════════════════════════════════════════════════════════════════════════════

function LayoutClassic({ c }: { c: AcademicContent }) {
  const { activeNav, sectionRefs, handleNavClick } = useNavScroll()
  const [expandedPub, setExpandedPub] = useState<number | null>(null)

  return (
    <div className="page-root w-full h-full overflow-y-auto scrollbar-thin">
      <nav className="nav-bar sticky top-0 z-10 flex items-center justify-between px-8 py-3">
        <span className="nav-name">{c.name}</span>
        <div className="flex gap-5">
          {c.navigation.map((item, i) => (
            <span
              key={item}
              onClick={() => handleNavClick(i)}
              className={`nav-item pb-0.5 cursor-pointer select-none ${i === activeNav ? 'active' : ''}`}
              data-content-path={`/navigation/${i}`}
            >
              {item}
            </span>
          ))}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-8 flex flex-col gap-8">
        {/* Profile */}
        <div className="profile-section flex items-start gap-6">
          <div className="avatar w-16 h-16 rounded-full flex-shrink-0">
            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="name mb-0.5" data-content-path="/name">{c.name}</h1>
            <p className="title-text mb-0.5" data-content-path="/title">{c.title}</p>
            <p className="affiliation mb-3" data-content-path="/affiliation">{c.affiliation}</p>
            <div className="links-row flex gap-2 flex-wrap">
              {c.links.map((link, i) => (
                <a key={link.label} href={link.url} onClick={e => e.preventDefault()}
                  className="link-item" data-content-path={`/links/${i}`}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar flex gap-4">
          {c.stats.map((s, i) => (
            <div key={s.label} className="stat-item px-4 py-2 text-center" data-content-path={`/stats/${i}`}>
              <div className="stat-value" data-content-path={`/stats/${i}/value`}>{s.value}</div>
              <div className="stat-label" data-content-path={`/stats/${i}/label`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* About */}
        <section className="about-section" ref={el => { sectionRefs.current[0] = el }}>
          <h2 className="section-heading mb-2">About</h2>
          <p className="bio" data-content-path="/bio">{c.bio}</p>
        </section>

        {/* News */}
        {c.news.length > 0 && (
          <section className="news-section" ref={el => { sectionRefs.current[1] = el }}>
            <h2 className="section-heading mb-2">News</h2>
            <div className="flex flex-col gap-1.5">
              {c.news.map((item, i) => (
                <div key={i} className="news-item flex gap-3" data-content-path={`/news/${i}`}>
                  <span className="news-date flex-shrink-0 w-20" data-content-path={`/news/${i}/date`}>{item.date}</span>
                  <span className="news-text" data-content-path={`/news/${i}/text`}>{item.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Publications */}
        <section className="publications-section" ref={el => { sectionRefs.current[2] = el }}>
          <h2 className="section-heading mb-2">Selected Publications</h2>
          <div className="flex flex-col gap-2">
            {c.publications.map((pub, i) => (
              <div
                key={i}
                className="publication-card p-3"
                data-content-path={`/publications/${i}`}
                onClick={() => setExpandedPub(expandedPub === i ? null : i)}
              >
                <p className="publication-title leading-snug" data-content-path={`/publications/${i}/title`}>{pub.title}</p>
                <p className="publication-venue mt-0.5 mb-1" data-content-path={`/publications/${i}/venue`}>
                  {pub.venue} · {pub.year}
                </p>
                <div className="flex gap-1 flex-wrap">
                  {pub.tags.map((tag, j) => (
                    <span key={tag} className="publication-tag" data-content-path={`/publications/${i}/tags/${j}`}>{tag}</span>
                  ))}
                </div>
                {expandedPub === i && pub.abstract && (
                  <p className="publication-abstract" data-content-path={`/publications/${i}/abstract`}>{pub.abstract}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="skills-section" ref={el => { sectionRefs.current[3] = el }}>
          <h2 className="section-heading mb-2">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {c.skills.map((skill, i) => (
              <span key={skill} className="skill-tag" data-content-path={`/skills/${i}`}>{skill}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LAYOUT: sidebar-left — two-column, sidebar on left
// ═══════════════════════════════════════════════════════════════════════════════

function LayoutSidebarLeft({ c }: { c: AcademicContent }) {
  const { activeNav, sectionRefs, handleNavClick } = useNavScroll()
  const [expandedPub, setExpandedPub] = useState<number | null>(null)

  return (
    <div className="page-root w-full h-full overflow-hidden flex flex-col">
      <nav className="nav-bar nav-alt flex items-center gap-6 px-6 py-2.5 flex-shrink-0">
        {c.navigation.map((item, i) => (
          <span
            key={item}
            onClick={() => handleNavClick(i)}
            className={`nav-item pb-0.5 uppercase tracking-wide cursor-pointer select-none ${i === activeNav ? 'active' : ''}`}
            data-content-path={`/navigation/${i}`}
          >
            {item}
          </span>
        ))}
      </nav>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 border-r border-gray-100 overflow-y-auto px-5 py-6 flex flex-col gap-5">
          <div className="profile-section flex flex-col items-center gap-2 pb-4 border-b border-gray-100">
            <div className="avatar w-20 h-20 rounded-full">
              {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="text-center">
              <p className="name" style={{ fontSize: '0.875rem' }} data-content-path="/name">{c.name}</p>
              <p className="title-text mt-0.5 leading-snug" data-content-path="/title">{c.title}</p>
              <p className="affiliation mt-0.5" data-content-path="/affiliation">{c.affiliation}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-bar flex flex-col gap-1.5">
            {c.stats.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0" data-content-path={`/stats/${i}`}>
                <span className="stat-label" data-content-path={`/stats/${i}/label`}>{s.label}</span>
                <span className="stat-value" style={{ fontSize: '0.875rem' }} data-content-path={`/stats/${i}/value`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="links-row flex flex-col gap-0.5">
            {c.links.map((link, i) => (
              <a key={link.label} href={link.url} onClick={e => e.preventDefault()}
                className="link-item" style={{ border: 'none', padding: '0.25rem 0.5rem' }}
                data-content-path={`/links/${i}`}>
                → {link.label}
              </a>
            ))}
          </div>

          {/* Skills */}
          <div className="skills-section">
            <p className="sidebar-label mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {c.skills.map((skill, i) => (
                <span key={skill} className="skill-tag filled" style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }} data-content-path={`/skills/${i}`}>{skill}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          <section className="about-section" ref={el => { sectionRefs.current[0] = el }}>
            <h2 className="section-heading mb-3">About</h2>
            <p className="bio" data-content-path="/bio">{c.bio}</p>
          </section>

          {c.news.length > 0 && (
            <section className="news-section" ref={el => { sectionRefs.current[1] = el }}>
              <h2 className="section-heading mb-3">Recent News</h2>
              <div className="flex flex-col">
                {c.news.map((item, i) => (
                  <div key={i} className="news-item flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0" data-content-path={`/news/${i}`}>
                    <span className="news-date w-16 flex-shrink-0 pt-px" data-content-path={`/news/${i}/date`}>{item.date}</span>
                    <span className="news-text flex-1" data-content-path={`/news/${i}/text`}>{item.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="publications-section" ref={el => { sectionRefs.current[2] = el }}>
            <h2 className="section-heading mb-3">Selected Publications</h2>
            <div className="flex flex-col gap-3">
              {c.publications.map((pub, i) => (
                <div
                  key={i}
                  className="publication-card border-left cursor-pointer"
                  data-content-path={`/publications/${i}`}
                  onClick={() => setExpandedPub(expandedPub === i ? null : i)}
                >
                  <p className="publication-title" data-content-path={`/publications/${i}/title`}>{pub.title}</p>
                  <p className="publication-venue italic mt-0.5 mb-1" data-content-path={`/publications/${i}/venue`}>
                    {pub.venue} · {pub.year}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {pub.tags.map((tag, j) => (
                      <span key={tag} className="publication-tag filled" data-content-path={`/publications/${i}/tags/${j}`}>{tag}</span>
                    ))}
                  </div>
                  {expandedPub === i && pub.abstract && (
                    <p className="publication-abstract" data-content-path={`/publications/${i}/abstract`}>{pub.abstract}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LAYOUT: sidebar-right — two-column, sidebar on right (mirror of sidebar-left)
// ═══════════════════════════════════════════════════════════════════════════════

function LayoutSidebarRight({ c }: { c: AcademicContent }) {
  const { activeNav, sectionRefs, handleNavClick } = useNavScroll()
  const [expandedPub, setExpandedPub] = useState<number | null>(null)

  return (
    <div className="page-root w-full h-full overflow-hidden flex flex-col">
      {/* Centered header block */}
      <div className="text-center px-12 py-6 border-b border-gray-100">
        <h1 className="name-lg mb-1" data-content-path="/name">{c.name}</h1>
        <p className="title-text mb-0.5" data-content-path="/title">{c.title}</p>
        <p className="affiliation mb-3" data-content-path="/affiliation">{c.affiliation}</p>
        <div className="links-row flex justify-center gap-4">
          {c.links.map((link, i) => (
            <a key={link.label} href={link.url} onClick={e => e.preventDefault()}
              className="link-item underline-style" data-content-path={`/links/${i}`}>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <nav className="nav-bar flex justify-center gap-8 py-2.5">
        {c.navigation.map((item, i) => (
          <span
            key={item}
            onClick={() => handleNavClick(i)}
            className={`nav-item pb-0.5 cursor-pointer select-none ${i === activeNav ? 'active' : ''}`}
            data-content-path={`/navigation/${i}`}
          >
            {item}
          </span>
        ))}
      </nav>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main */}
        <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
          <section className="about-section" ref={el => { sectionRefs.current[0] = el }}>
            <h2 className="section-heading mb-3">About</h2>
            <p className="bio" data-content-path="/bio">{c.bio}</p>
          </section>

          {c.news.length > 0 && (
            <section className="news-section" ref={el => { sectionRefs.current[1] = el }}>
              <h2 className="section-heading mb-3">News &amp; Updates</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {c.news.map((item, i) => (
                  <div key={i} className="publication-card flex-shrink-0 w-48 p-3" data-content-path={`/news/${i}`}>
                    <p className="news-date mb-1" data-content-path={`/news/${i}/date`}>{item.date}</p>
                    <p className="news-text leading-snug" data-content-path={`/news/${i}/text`}>{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="publications-section" ref={el => { sectionRefs.current[2] = el }}>
            <h2 className="section-heading mb-4">Selected Publications</h2>
            <ol className="flex flex-col gap-3">
              {c.publications.map((pub, i) => (
                <li
                  key={i}
                  className="flex gap-3 cursor-pointer hover:bg-gray-50 rounded p-1 -mx-1 transition-colors"
                  data-content-path={`/publications/${i}`}
                  onClick={() => setExpandedPub(expandedPub === i ? null : i)}
                >
                  <span className="publication-index pt-0.5 flex-shrink-0 w-4" data-content-path={`/publications/${i}/venue`}>
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="publication-title" data-content-path={`/publications/${i}/title`}>
                      <span>{pub.title}</span>
                      {'. '}
                      <span className="publication-venue italic">{pub.venue}</span>
                      {`, ${pub.year}.`}
                    </p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {pub.tags.map((tag, j) => (
                        <span key={tag} className="publication-tag" data-content-path={`/publications/${i}/tags/${j}`}>{tag}</span>
                      ))}
                    </div>
                    {expandedPub === i && pub.abstract && (
                      <p className="publication-abstract" data-content-path={`/publications/${i}/abstract`}>{pub.abstract}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </main>

        {/* Right sidebar */}
        <aside className="w-52 flex-shrink-0 border-l border-gray-100 overflow-y-auto px-5 py-6 flex flex-col gap-5">
          {/* Stats */}
          <div className="stats-bar flex flex-col gap-3">
            {c.stats.map((s, i) => (
              <div key={s.label} className="text-right" data-content-path={`/stats/${i}`}>
                <div className="stat-value-lg" data-content-path={`/stats/${i}/value`}>{s.value}</div>
                <div className="stat-label-upper" data-content-path={`/stats/${i}/label`}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">
            {/* Links */}
            <div className="links-row flex flex-col gap-0.5">
              {c.links.map((link, i) => (
                <a key={link.label} href={link.url} onClick={e => e.preventDefault()}
                  className="link-item" style={{ border: 'none', padding: '0.25rem 0.5rem' }}
                  data-content-path={`/links/${i}`}>
                  → {link.label}
                </a>
              ))}
            </div>

            {/* Skills */}
            <div className="skills-section">
              <p className="sidebar-label mb-2">Research Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((skill, i) => (
                  <span key={skill} className="skill-tag pill" data-content-path={`/skills/${i}`}>{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LAYOUT: hero-banner — dark header + split body
// ═══════════════════════════════════════════════════════════════════════════════

function LayoutHeroBanner({ c }: { c: AcademicContent }) {
  const { activeNav, sectionRefs, handleNavClick } = useNavScroll()
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  return (
    <div className="page-root w-full h-full overflow-y-auto scrollbar-thin">
      {/* Dark hero header */}
      <header className="hero-header px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="name name-dark" data-content-path="/name">{c.name}</h1>
            <p className="title-text dark mt-0.5" data-content-path="/title">{c.title}</p>
            <p className="affiliation dark mt-0.5" data-content-path="/affiliation">{c.affiliation}</p>
          </div>
          <div className="links-row flex gap-2 flex-wrap justify-end">
            {c.links.map((link, i) => (
              <a key={link.label} href={link.url} onClick={e => e.preventDefault()}
                className="link-item dark" data-content-path={`/links/${i}`}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-3 border-t border-gray-700">
          {c.navigation.map((item, i) => (
            <span
              key={item}
              onClick={() => handleNavClick(i)}
              className={`nav-item nav-dark-item pb-0.5 cursor-pointer select-none ${i === activeNav ? 'active' : ''}`}
              data-content-path={`/navigation/${i}`}
            >
              {item}
            </span>
          ))}
        </div>
      </header>

      {/* Stats band */}
      <div className="stats-band flex">
        {c.stats.map((s, i) => (
          <div key={s.label} className={`stat-item flex-1 py-3 text-center ${i < c.stats.length - 1 ? 'stats-band-cell' : ''}`}
            data-content-path={`/stats/${i}`}
            style={{ background: 'transparent', border: 'none', borderRadius: 0 }}>
            <div className="stat-value" data-content-path={`/stats/${i}/value`}>{s.value}</div>
            <div className="stat-label-upper" data-content-path={`/stats/${i}/label`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column body */}
      <div className="flex">
        {/* Left: bio + news + projects */}
        <div className="flex-1 px-8 py-6 flex flex-col gap-5">
          <section className="about-section" ref={el => { sectionRefs.current[0] = el }}>
            <h2 className="section-heading mb-2">About</h2>
            <p className="bio" data-content-path="/bio">{c.bio}</p>
          </section>

          {c.news.length > 0 && (
            <section className="news-section" ref={el => { sectionRefs.current[1] = el }}>
              <h2 className="section-heading mb-2">News</h2>
              <div className="flex flex-col gap-1">
                {c.news.map((item, i) => (
                  <div key={i} className="news-item flex gap-3" data-content-path={`/news/${i}`}>
                    <span className="news-date w-16 flex-shrink-0" data-content-path={`/news/${i}/date`}>{item.date}</span>
                    <span className="news-text" data-content-path={`/news/${i}/text`}>{item.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="projects-section" ref={el => { sectionRefs.current[2] = el }}>
            <h2 className="section-heading mb-2">Projects</h2>
            <div className="flex flex-col gap-2">
              {c.projects.map((p, i) => (
                <div
                  key={p.title}
                  className="project-card with-bg flex items-start gap-3 p-2.5 cursor-pointer"
                  data-content-path={`/projects/${i}`}
                  onClick={() => setExpandedProject(expandedProject === p.title ? null : p.title)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${p.status === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="project-title" data-content-path={`/projects/${i}/title`}>{p.title}</p>
                    <p className={`project-desc mt-0.5 ${expandedProject === p.title ? '' : 'truncate'}`}
                      data-content-path={`/projects/${i}/description`}>{p.description}</p>
                  </div>
                  <span className="project-status flex-shrink-0" data-status={p.status}
                    data-content-path={`/projects/${i}/status`}>{p.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: publications + skills */}
        <div className="w-72 flex-shrink-0 border-l border-gray-200 px-6 py-6 flex flex-col gap-4">
          <h2 className="section-heading">Publications</h2>
          {c.publications.map((pub, i) => (
            <div key={i} className="flex flex-col gap-1" data-content-path={`/publications/${i}`}>
              <p className="publication-title-sm leading-snug" data-content-path={`/publications/${i}/title`}>{pub.title}</p>
              <p className="publication-venue italic" data-content-path={`/publications/${i}/venue`}>
                {pub.venue} · {pub.year}
              </p>
              <div className="flex gap-1 flex-wrap">
                {pub.tags.map((tag, j) => (
                  <span key={tag} className="publication-tag" data-content-path={`/publications/${i}/tags/${j}`}>{tag}</span>
                ))}
              </div>
              {i < c.publications.length - 1 && <div className="border-b border-gray-100 mt-1" />}
            </div>
          ))}
          <div className="mt-1 pt-3 border-t border-gray-100">
            <h2 className="section-heading mb-2">Skills</h2>
            <div className="skills-section flex flex-wrap gap-1">
              {c.skills.map((skill, i) => (
                <span key={skill} className="skill-tag filled" style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}
                  data-content-path={`/skills/${i}`}>{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LAYOUT: compact — minimal centered
// ═══════════════════════════════════════════════════════════════════════════════

function LayoutCompact({ c }: { c: AcademicContent }) {
  const { activeNav, sectionRefs, handleNavClick } = useNavScroll()
  const [expandedPub, setExpandedPub] = useState<number | null>(null)

  return (
    <div className="page-root w-full h-full overflow-y-auto scrollbar-thin">
      <nav className="nav-bar flex justify-end gap-6 px-8 py-3">
        {c.navigation.map((item, i) => (
          <span
            key={item}
            onClick={() => handleNavClick(i)}
            className={`nav-item pb-0.5 cursor-pointer select-none ${i === activeNav ? 'active' : ''}`}
            data-content-path={`/navigation/${i}`}
          >
            {item}
          </span>
        ))}
      </nav>

      <div className="max-w-2xl mx-auto px-8 pt-10 pb-8">
        {/* Centered hero */}
        <div className="profile-section text-center mb-8">
          <h1 className="name-xl mb-1" data-content-path="/name">{c.name}</h1>
          <p className="title-text mb-0.5" data-content-path="/title">{c.title}</p>
          <p className="affiliation mb-4" data-content-path="/affiliation">{c.affiliation}</p>
          <div className="stats-bar flex justify-center gap-6 mb-3">
            {c.stats.map((s, i) => (
              <span key={s.label} className="stat-label" data-content-path={`/stats/${i}`}>
                <strong className="stat-value" style={{ fontSize: '0.875rem' }} data-content-path={`/stats/${i}/value`}>{s.value}</strong>{' '}
                <span data-content-path={`/stats/${i}/label`}>{s.label}</span>
              </span>
            ))}
          </div>
          <div className="links-row flex justify-center gap-2">
            {c.links.map((link, i) => (
              <a key={link.label} href={link.url} onClick={e => e.preventDefault()}
                className="link-item" data-content-path={`/links/${i}`}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bio */}
        <section className="about-section" ref={el => { sectionRefs.current[0] = el }}>
          <p className="bio text-center mb-8" data-content-path="/bio">{c.bio}</p>
        </section>

        {/* Projects + Publications 2-col */}
        <div ref={el => { sectionRefs.current[1] = el as HTMLDivElement }} className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="section-heading mb-3">
              Projects <span style={{ color: '#d1d5db', marginLeft: '0.25rem' }}>{c.projects.length}</span>
            </h2>
            <div className="projects-section flex flex-col gap-2">
              {c.projects.map((p, i) => (
                <div key={p.title} className="project-card p-2.5" data-content-path={`/projects/${i}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="project-title" data-content-path={`/projects/${i}/title`}>{p.title}</p>
                    <span className="project-status" data-status={p.status} data-content-path={`/projects/${i}/status`}>{p.status}</span>
                  </div>
                  <p className="project-desc" data-content-path={`/projects/${i}/description`}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="section-heading mb-3">
              Publications <span style={{ color: '#d1d5db', marginLeft: '0.25rem' }}>{c.publications.length}</span>
            </h2>
            <div className="publications-section flex flex-col gap-2">
              {c.publications.map((pub, i) => (
                <div
                  key={i}
                  className="publication-card p-2.5 cursor-pointer"
                  data-content-path={`/publications/${i}`}
                  onClick={() => setExpandedPub(expandedPub === i ? null : i)}
                >
                  <p className="publication-title-sm leading-snug mb-0.5" data-content-path={`/publications/${i}/title`}>{pub.title}</p>
                  <p className="publication-venue italic" data-content-path={`/publications/${i}/venue`}>
                    {pub.venue} · {pub.year}
                  </p>
                  {expandedPub === i && pub.abstract && (
                    <p className="publication-abstract" data-content-path={`/publications/${i}/abstract`}>{pub.abstract}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <section className="skills-section mb-6" ref={el => { sectionRefs.current[2] = el }}>
          <h2 className="section-heading mb-3">Skills &amp; Tools</h2>
          <div className="flex flex-wrap gap-2">
            {c.skills.map((skill, i) => (
              <span key={skill} className="skill-tag pill" data-content-path={`/skills/${i}`}>{skill}</span>
            ))}
          </div>
        </section>

        {/* News */}
        {c.news.length > 0 && (
          <section className="news-section pt-4 border-t border-gray-100" ref={el => { sectionRefs.current[3] = el }}>
            <h2 className="section-heading mb-2">Latest</h2>
            {c.news.map((item, i) => (
              <p key={i} className="news-text mb-1" data-content-path={`/news/${i}`}>
                <span className="news-date mr-2" data-content-path={`/news/${i}/date`}>{item.date}</span>
                <span data-content-path={`/news/${i}/text`}>{item.text}</span>
              </p>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

interface PreviewContentProps {
  descriptor: RenderDescriptor
}

export function PreviewContent({ descriptor }: PreviewContentProps) {
  const c = descriptor.content as unknown as AcademicContent

  return (
    <div id={descriptor.scopeId} className="w-full h-full overflow-hidden">
      {/* Base defaults — unscoped so they apply to all semantic classes */}
      <style>{BASE_CSS}</style>
      {/* Scoped manifest CSS — selectors prefixed with #scopeId by css-scoper.js */}
      {descriptor.scopedCSS && <style>{descriptor.scopedCSS}</style>}

      {descriptor.layout === 'classic'       && <LayoutClassic      c={c} />}
      {descriptor.layout === 'sidebar-left'  && <LayoutSidebarLeft  c={c} />}
      {descriptor.layout === 'sidebar-right' && <LayoutSidebarRight c={c} />}
      {descriptor.layout === 'hero-banner'   && <LayoutHeroBanner   c={c} />}
      {descriptor.layout === 'compact'       && <LayoutCompact      c={c} />}
    </div>
  )
}
