import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { plan, costFor, seasonOf, tours, TIERS, CITIES, MONTHS } from './lib/planner'

const money = (n) => '৳' + Math.round(n).toLocaleString('en-BD')
const SEASON = { best: 'Best season', ok: 'Fair season', avoid: 'Off season' }
const TIER_NAME = { budget: 'Budget', standard: 'Standard', comfort: 'Comfort' }
const SCENE = {
  'coxs-bazar': ['#0b5d73', '#e9c88d'],
  'sajek-valley': ['#1f6b4a', '#b9d6c2'],
  'sylhet-classic': ['#2c6b3d', '#c7da8c'],
  'saint-martin': ['#0a7a8c', '#7fdcd0'],
  sundarbans: ['#0c3b2e', '#4f8a5b'],
  srimangal: ['#4a6b21', '#d6dd96'],
}
const scene = (id) => {
  const [a, b] = SCENE[id] || ['#0b3b3c', '#9cc']
  return { '--a': a, '--b': b }
}

export default function App() {
  const [form, setForm] = useState({ people: 4, days: 3, budget: 40000, origin: 'Dhaka', month: new Date().getMonth() + 1 })
  const [view, setView] = useState({ name: 'home' })

  useEffect(() => {
    const onPop = (e) => setView(e.state || { name: 'home' })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = (v) => {
    history.pushState(v, '')
    setView(v)
    window.scrollTo(0, 0)
  }

  const results = useMemo(() => plan(form), [form])
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'origin' ? e.target.value : Number(e.target.value) || 0 })

  if (view.name === 'detail') {
    const r = results.find((x) => x.tour.id === view.id)
    if (r) return <Detail r={r} form={form} back={() => history.back()} />
  }

  if (view.name === 'results') {
    return <Results results={results} form={form} go={go} back={() => history.back()} />
  }

  return (
    <>
      <header className="hero">
        <div className="sun" />
        <div className="hero-copy">
          <p className="brand">Bhromon Bangla</p>
          <h1>
            We are{' '}
            <input className="fill" style={{ width: '2.2ch' }} type="number" min="1" value={form.people || ''} onChange={set('people')} aria-label="People" />{' '}
            people leaving from{' '}
            <select className="fill" value={form.origin} onChange={set('origin')} aria-label="Starting city">
              {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
            </select>{' '}
            in{' '}
            <select className="fill" value={form.month} onChange={set('month')} aria-label="Month">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            . We have{' '}
            <input className="fill" style={{ width: '2.2ch' }} type="number" min="1" value={form.days || ''} onChange={set('days')} aria-label="Days" />{' '}
            days and{' '}
            <input className="fill" style={{ width: '6.2ch' }} type="number" min="0" step="1000" value={form.budget || ''} onChange={set('budget')} aria-label="Total budget in taka" />{' '}
            taka in total.
          </h1>
          <div className="hero-foot">
            <button className="go" onClick={() => go({ name: 'results' })}>Show my trips</button>
            <p>Every trip comes with the route, the stay, the food and the full cost for your group.</p>
          </div>
        </div>
        <svg className="land" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 200C180 120 300 170 480 130S820 90 1000 150 1300 120 1440 160V320H0Z" fill="#1b6670" />
          <path d="M0 240C200 190 380 250 600 210S1000 180 1200 230 1380 220 1440 240V320H0Z" fill="#0f4a4f" />
          <path d="M0 285C240 258 480 300 720 280S1200 262 1440 288V320H0Z" fill="#e9f0ea" />
        </svg>
      </header>

      <main className="band">
        <h2>When each place is at its best</h2>
        <p className="lede">Pick a trip to see the plan for your group. The highlighted column is the month you chose.</p>
        <div className="calendar" role="table">
          {tours.map((t) => (
            <button key={t.id} className="cal-row" onClick={() => go({ name: 'detail', id: t.id })} disabled={!results.find((r) => r.tour.id === t.id)} style={scene(t.id)}>
              <span className="cal-name">{t.region}</span>
              {MONTHS.map((m, i) => (
                <span key={m} className={`cell ${seasonOf(t, i + 1)} ${i + 1 === form.month ? 'now' : ''}`} title={`${m}: ${SEASON[seasonOf(t, i + 1)]}`}>
                  {m.slice(0, 3)}
                </span>
              ))}
            </button>
          ))}
        </div>
        <ul className="legend">
          <li><i className="cell best" />Best</li>
          <li><i className="cell ok" />Fair</li>
          <li><i className="cell avoid" />Avoid</li>
        </ul>
      </main>
    </>
  )
}

function Results({ results, form, go, back }) {
  const fits = results.filter((r) => r.affordable)
  const over = results.filter((r) => !r.affordable)
  return (
    <div className="page">
      <nav className="bar"><button className="link" onClick={back}>Change plan</button></nav>
      <header className="page-head">
        <h1>{results.length ? `${results.length} ${results.length === 1 ? 'trip fits' : 'trips fit'} your group` : 'No trips match yet'}</h1>
        <p>{form.people} people from {form.origin}, {form.days} days in {MONTHS[form.month - 1]}, with {money(form.budget)} in total.</p>
      </header>
      {!results.length && <p className="empty">No trip covers {form.people} {form.people === 1 ? 'person' : 'people'} for {form.days} {form.days === 1 ? 'day' : 'days'}. Try a group between 2 and 15 and at least 3 days.</p>}
      {fits.length > 0 && <div className="list">{fits.map((r) => <Row key={r.tour.id} r={r} form={form} go={go} />)}</div>}
      {over.length > 0 && (
        <>
          <h2 className="split">Above your budget</h2>
          <div className="list">{over.map((r) => <Row key={r.tour.id} r={r} form={form} go={go} />)}</div>
        </>
      )}
    </div>
  )
}

function Row({ r, form, go }) {
  const { tour, chosen } = r
  const pct = Math.min(100, (chosen.total / form.budget) * 100)
  return (
    <article className={`trip ${r.affordable ? '' : 'dim'}`}>
      <div className="trip-art" style={scene(tour.id)}>
        <span className={`pill ${r.season}`}>{SEASON[r.season]}</span>
        <h2>{tour.name}</h2>
      </div>
      <div className="trip-body">
        <p className="sum">{tour.summary}</p>
        <dl className="facts">
          <div><dt>Journey</dt><dd>{chosen.route.travelHours} hours{chosen.viaDhaka ? ' from Dhaka' : ''}</dd></div>
          <div><dt>Trip length</dt><dd>{r.usedDays} days</dd></div>
          <div><dt>Style</dt><dd>{TIER_NAME[chosen.tier]}</dd></div>
          <div><dt>By</dt><dd>{chosen.route.modes[chosen.tier]}</dd></div>
        </dl>
        <div className="cost">
          <div>
            <strong className="big">{money(chosen.total)}</strong>
            <span>{money(chosen.total / form.people)} per person</span>
          </div>
          <div className="meter">
            <div className="track"><i style={{ width: pct + '%' }} className={r.affordable ? '' : 'hot'} /></div>
            <span>{r.affordable ? `${money(form.budget - chosen.total)} left` : `${money(r.over)} over`}</span>
          </div>
          <button className="go dark" onClick={() => go({ name: 'detail', id: tour.id })}>See the plan</button>
        </div>
      </div>
    </article>
  )
}

function Detail({ r, form, back }) {
  const { tour } = r
  const [tier, setTier] = useState(r.chosen.tier)
  const c = useMemo(() => costFor(tour, tier, form.origin, form.people, r.usedDays), [tour, tier, form, r.usedDays])
  const stay = tour.stay.options.find((o) => o.tier === tier)
  const lines = [
    ['Travel', c.parts.travel],
    [`Stay, ${c.rooms} ${c.rooms === 1 ? 'room' : 'rooms'} for ${c.nights} ${c.nights === 1 ? 'night' : 'nights'}`, c.parts.stay],
    ['Food', c.parts.food],
    ['Local transport', c.parts.local],
    ['Activities', c.parts.activities],
  ]
  return (
    <div className="page detail">
      <header className="d-hero" style={scene(tour.id)}>
        <nav className="bar"><button className="link light" onClick={back}>Back to trips</button></nav>
        <span className={`pill ${r.season}`}>{SEASON[r.season]}</span>
        <h1>{tour.name}</h1>
        <p>{tour.summary}</p>
      </header>

      <div className="d-grid">
        <aside className="d-cost">
          <h2>Cost for {form.people} {form.people === 1 ? 'person' : 'people'}</h2>
          <div className="tabs" role="tablist">
            {TIERS.map((t) => (
              <button key={t} role="tab" aria-selected={t === tier} className={t === tier ? 'on' : ''} onClick={() => setTier(t)}>{TIER_NAME[t]}</button>
            ))}
          </div>
          <ul className="lines">
            {lines.map(([k, v]) => <li key={k}><span>{k}</span><b>{money(v)}</b></li>)}
          </ul>
          <div className="total"><span>Total</span><strong>{money(c.total)}</strong></div>
          <p className={c.total <= form.budget ? 'ok-note' : 'hot-note'}>
            {c.total <= form.budget ? `${money(form.budget - c.total)} under your budget` : `${money(c.total - form.budget)} over your budget`}
          </p>
          <p className="fine">Prices are estimates. Check fares and room rates before you book.</p>
        </aside>

        <div className="d-main">
          <section>
            <h2>Getting there</h2>
            {c.viaDhaka && <p className="notice">There is no direct route listed from {form.origin}. Costs include about {money(c.extra)} per person to reach Dhaka and back, and the plan starts from Dhaka.</p>}
            <dl className="info">
              <div><dt>Go by</dt><dd>{c.route.modes[tier]}, about {c.route.travelHours} hours</dd></div>
              <div><dt>Start from</dt><dd>{c.route.startJourney.from}</dd></div>
              <div><dt>Leave at</dt><dd>{c.route.startJourney.departureTime}</dd></div>
              <div><dt>Know this</dt><dd>{c.route.startJourney.notes}</dd></div>
            </dl>
          </section>

          <section>
            <h2>Where to stay</h2>
            <dl className="info">
              <div><dt>Area</dt><dd>{tour.stay.area}</dd></div>
              {stay && <div><dt>{TIER_NAME[tier]}</dt><dd>{stay.type}</dd></div>}
              <div><dt>Booking</dt><dd>{tour.stay.bookingTip}</dd></div>
            </dl>
          </section>

          <section>
            <h2>Day by day</h2>
            {r.usedDays !== tour.itinerary.length && <p className="notice">This plan covers {tour.itinerary.length} days. It works best for {tour.duration.minDays} to {tour.duration.maxDays} days.</p>}
            <ol className="days">
              {tour.itinerary.map((d) => (
                <li key={d.day}>
                  <h3><span>Day {d.day}</span>{d.title}</h3>
                  <ul>{d.activities.map((a) => <li key={a}>{a}</li>)}</ul>
                  {d.meals.length > 0 && (
                    <div className="meals">
                      {d.meals.map((m) => <p key={m.type}><b>{m.type[0].toUpperCase() + m.type.slice(1)}</b> {m.suggestion}</p>)}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section className="two">
            <div>
              <h2>Good to know</h2>
              <ul className="plain">{tour.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div>
              <h2>Be careful</h2>
              <ul className="plain warn">{tour.warnings.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </section>
          <p className="fine">{tour.season.note}</p>
        </div>
      </div>
    </div>
  )
}
