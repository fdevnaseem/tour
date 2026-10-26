import { useEffect, useState } from 'react'
import { CITIES, MONTHS, TIERS, cost, getTour, money, plan, tours } from '../libs/api/planner'

const DEFAULT = { city: 'Dhaka', people: 4, days: 3, month: new Date().getMonth() + 1, budget: 40000 }

const PALETTE = {
  'coxs-bazar': ['#eaf3f6', '#f3d9a4', '#bcd9e0', '#7fb3c2', '#3f8199', 'wave'],
  'sajek-valley': ['#eef1f4', '#f6e6c8', '#d5dde3', '#a9bcc6', '#6f8b99', 'peak'],
  'sylhet-classic': ['#eef4ee', '#f4e8c0', '#cfe0cf', '#97bf9a', '#4e8a5a', 'hill'],
  'saint-martin': ['#e9f6f4', '#f7dfb0', '#b8e3dc', '#6fc2b6', '#2f9a8c', 'wave'],
  sundarbans: ['#eef2ee', '#e9e2bd', '#b9cdb9', '#6f9272', '#2f5a3c', 'tree'],
  srimangal: ['#f1f5ea', '#f2e7b8', '#d3e2b8', '#a2c46b', '#5e8f2f', 'hill'],
}

function ridge(kind, seed, base, amp) {
  let d = `M0 500 L0 ${base}`
  for (let x = 0; x <= 400; x += 8) {
    const s = Math.sin(x / 40 + seed) + Math.sin(x / 17 + seed * 2) * 0.5
    const y = kind === 'wave' ? base + Math.sin(x / 28 + seed) * amp * 0.5
      : kind === 'peak' ? base - Math.abs(s) * amp
      : kind === 'tree' ? base - Math.abs(Math.sin(x / 9 + seed)) * amp * 0.7 - Math.abs(s) * amp * 0.3
      : base - (s + 1.5) * amp * 0.4
    d += ` L${x} ${y.toFixed(1)}`
  }
  return d + ' L400 500 Z'
}

function Scene({ id, tilt = true, className = '' }) {
  const [sky, sun, c1, c2, c3, kind] = PALETTE[id]
  const [r, setR] = useState([0, 0])
  const move = (e) => {
    if (!tilt) return
    const b = e.currentTarget.getBoundingClientRect()
    setR([((e.clientY - b.top) / b.height - 0.5) * -10, ((e.clientX - b.left) / b.width - 0.5) * 14])
  }
  const layers = [[c1, 260, 60, 1, -40], [c2, 340, 55, 2, 20], [c3, 420, 45, 3, 80]]
  return (
    <div className={'scene ' + className} onMouseMove={move} onMouseLeave={() => setR([0, 0])}>
      <div className="stack" style={{ transform: `rotateX(${r[0]}deg) rotateY(${r[1]}deg)`, background: sky }}>
        <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="layer" style={{ transform: 'translateZ(-60px) scale(1.2)' }}>
          <circle cx="290" cy="150" r="42" fill={sun} />
        </svg>
        {layers.map(([c, base, amp, seed, z], i) => (
          <svg key={i} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="layer" style={{ transform: `translateZ(${z}px) scale(${1 - z / 1200})` }}>
            <path d={ridge(kind, seed, base, amp)} fill={c} />
          </svg>
        ))}
      </div>
    </div>
  )
}

const Btn = ({ children, silver, ...p }) => <button className={'btn ' + (silver ? 'silver' : 'gold')} {...p}>{children}</button>

function useRoute() {
  const [h, setH] = useState(location.hash || '#/')
  useEffect(() => {
    const f = () => { setH(location.hash || '#/'); window.scrollTo(0, 0) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return h.slice(1).split('/').filter(Boolean)
}
const go = (p) => { location.hash = p }

function Home() {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % tours.length), 4500); return () => clearInterval(t) }, [])
  const t = tours[i]
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Bangladesh, planned in a minute</p>
          <h1>Tell us your budget. We will tell you where to go.</h1>
          <p className="lead">Pick your city, your days and your month. You get real trips with the start time, the hotel area, the meals and the full cost for your group.</p>
          <div className="row"><Btn onClick={() => go('/plan')}>Plan my trip</Btn><Btn silver onClick={() => document.getElementById('places').scrollIntoView({ behavior: 'smooth' })}>See destinations</Btn></div>
        </div>
        <div className="hero-art">
          <Scene key={t.id} id={t.id} className="big" />
          <div className="caption"><span>{String(i + 1).padStart(2, '0')} / 06</span><strong>{t.name}</strong><em>{t.region}</em></div>
        </div>
      </section>

      <section className="steps">
        <h2>Three answers, one clear plan</h2>
        <div className="grid3">
          {[['01', 'Your trip', 'City, number of people, days, month and total budget.'], ['02', 'Your matches', 'Trips ranked by season and price, with the comfort level your budget allows.'], ['03', 'Your day plan', 'When to leave, where to sleep, what to eat and what each day costs.']].map(([n, h, p]) => (
            <div key={n}><span className="num">{n}</span><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
      </section>

      <section id="places" className="places">
        <h2>Six places to start with</h2>
        <div className="cards">
          {tours.map((x) => (
            <a key={x.id} className="card" href={`#/tour/${x.id}`}>
              <Scene id={x.id} tilt={false} />
              <h3>{x.name}</h3>
              <p>{x.summary}</p>
              <span className="meta">{x.duration.idealDays} days · Best {x.season.bestMonths.map((m) => MONTHS[m - 1]).slice(0, 1)} to {MONTHS[x.season.bestMonths.at(-1) - 1]}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="closing"><h2>Ready when you are</h2><Btn onClick={() => go('/plan')}>Plan my trip</Btn></section>
    </>
  )
}

function Stepper({ value, set, min, max, step = 1, unit }) {
  return (
    <div className="stepper">
      <button onClick={() => set(Math.max(min, value - step))} aria-label="less">−</button>
      <div><span>{value}</span><small>{unit}</small></div>
      <button onClick={() => set(Math.min(max, value + step))} aria-label="more">+</button>
    </div>
  )
}

function Planner({ plan: p, setPlan }) {
  const up = (k) => (v) => setPlan({ ...p, [k]: v })
  return (
    <section className="planner">
      <h1>Plan your trip</h1>
      <div className="form">
        <div className="field wide">
          <label>Starting from</label>
          <div className="chips">{CITIES.map((c) => <button key={c} className={p.city === c ? 'on' : ''} onClick={() => up('city')(c)}>{c}</button>)}</div>
        </div>
        <div className="field"><label>Travellers</label><Stepper value={p.people} set={up('people')} min={1} max={25} unit="people" /></div>
        <div className="field"><label>Duration</label><Stepper value={p.days} set={up('days')} min={2} max={5} unit={`days, ${p.days - 1} nights`} /></div>
        <div className="field wide">
          <label>Month of travel</label>
          <div className="months">{MONTHS.map((m, i) => <button key={m} className={p.month === i + 1 ? 'on' : ''} onClick={() => up('month')(i + 1)}>{m}</button>)}</div>
        </div>
        <div className="field wide">
          <label>Total budget for the group</label>
          <div className="budget"><span>{money(p.budget)}</span><small>{money(p.budget / p.people)} per person</small></div>
          <input type="range" min="5000" max="300000" step="1000" value={p.budget} onChange={(e) => up('budget')(+e.target.value)} />
        </div>
      </div>
      <Btn onClick={() => go('/results')}>Show my trips</Btn>
    </section>
  )
}

const seasonText = { best: 'Best time to go', ok: 'Possible this month', avoid: 'Not a good month' }

function Results({ plan: p }) {
  const list = plan(p)
  const good = list.filter((x) => x.status === 'fits' && x.season !== 'avoid')
  const rest = list.filter((x) => !good.includes(x))
  const Row = ({ x }) => (
    <a className="row-card" href={`#/tour/${x.tour.id}`}>
      <Scene id={x.tour.id} tilt={false} />
      <div>
        <span className={'tag ' + x.season}>{seasonText[x.season]}</span>
        <h3>{x.tour.name}</h3>
        <p>{x.tour.summary}</p>
        <span className="meta">{x.days} days · {x.pick.tier} level · {x.status === 'stretch' ? 'A little over budget' : 'Within budget'}</span>
      </div>
      <div className="price"><span>{money(x.pick.total)}</span><small>{money(x.pick.perPerson)} per person</small></div>
    </a>
  )
  return (
    <section className="results">
      <div className="results-head">
        <h1>{good.length ? `${good.length} trip${good.length > 1 ? 's' : ''} for your plan` : 'No exact match'}</h1>
        <p>{p.people} people from {p.city}, {MONTHS[p.month - 1]}, {money(p.budget)} total</p>
        <Btn silver onClick={() => go('/plan')}>Change plan</Btn>
      </div>
      {good.map((x) => <Row key={x.tour.id} x={x} />)}
      {rest.length > 0 && <h2 className="sub">Worth a look</h2>}
      {rest.map((x) => <Row key={x.tour.id} x={x} />)}
      {!list.length && <p className="empty">Nothing fits this budget yet. Try more money or fewer days.</p>}
    </section>
  )
}

function Tour({ id, plan: p }) {
  const t = getTour(id)
  const [ti, setTi] = useState(1)
  if (!t) return <section className="planner"><h1>Trip not found</h1></section>
  const days = Math.min(Math.max(p.days, t.duration.minDays), t.duration.maxDays)
  const c = cost(t, p, ti, days)
  const info = c?.info
  const total = c?.total ?? 0
  return (
    <article className="tour">
      <header className="tour-hero">
        <div>
          <a className="back" href="#/results">Back to results</a>
          <p className="eyebrow">{t.region}, {t.division}</p>
          <h1>{t.name}</h1>
          <p className="lead">{t.summary}</p>
          <div className="months small">{MONTHS.map((m, i) => <span key={m} className={t.season.bestMonths.includes(i + 1) ? 'best' : t.season.avoidMonths.includes(i + 1) ? 'avoid' : ''}>{m}</span>)}</div>
          <p className="note">{t.season.note}</p>
        </div>
        <Scene id={t.id} className="big" />
      </header>

      <section className="block">
        <h2>What it costs</h2>
        <div className="chips">{TIERS.map((x, i) => <button key={x} className={ti === i ? 'on' : ''} onClick={() => setTi(i)}>{x}</button>)}</div>
        {c ? (
          <div className="cost">
            <div className="total"><span>{money(total)}</span><small>{p.people} people, {days} days · {money(c.perPerson)} each</small></div>
            <div className="bars">
              {Object.entries(c.parts).map(([k, v]) => (
                <div key={k}><label>{k}</label><i style={{ width: (v / total) * 100 + '%' }} /><b>{money(v)}</b></div>
              ))}
            </div>
            {c.est && <p className="note">Transport from {p.city} is an estimate through Dhaka.</p>}
          </div>
        ) : null}
      </section>

      {info && (
        <section className="block two">
          <h2>How to start</h2>
          <dl>
            <dt>Leave from</dt><dd>{info.startJourney.from}</dd>
            <dt>Time</dt><dd>{info.startJourney.departureTime}</dd>
            <dt>Travel</dt><dd>About {info.travelHours} hours, {info.modes[TIERS[ti]]}</dd>
            <dt>Good to know</dt><dd>{info.startJourney.notes}</dd>
          </dl>
        </section>
      )}

      <section className="block two">
        <h2>Where to stay</h2>
        <dl>
          <dt>Area</dt><dd>{t.stay.area}</dd>
          <dt>Your level</dt><dd>{t.stay.options[ti].type}</dd>
          <dt>Booking</dt><dd>{t.stay.bookingTip}</dd>
        </dl>
      </section>

      <section className="block">
        <h2>Day by day</h2>
        <div className="days">
          {t.itinerary.map((d) => (
            <div key={d.day} className="day">
              <span className="num">{String(d.day).padStart(2, '0')}</span>
              <div>
                <h3>{d.title}</h3>
                <ul>{d.activities.map((a) => <li key={a}>{a}</li>)}</ul>
                <p className="eat">{d.meals.map((m) => `${m.type}: ${m.suggestion}`).join('. ')}.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="block two">
        <h2>Before you go</h2>
        <ul className="tips">{t.tips.map((x) => <li key={x}>{x}</li>)}{t.warnings.map((x) => <li key={x} className="warn">{x}</li>)}</ul>
      </section>
    </article>
  )
}

export default function App() {
  const [p, setP] = useState(() => { try { return JSON.parse(sessionStorage.getItem('plan')) || DEFAULT } catch { return DEFAULT } })
  useEffect(() => { try { sessionStorage.setItem('plan', JSON.stringify(p)) } catch {} }, [p])
  const [a, b] = useRoute()
  return (
    <>
      <nav className="nav">
        <a href="#/" className="logo">Bhromon</a>
        <div><a href="#/">Home</a><Btn onClick={() => go('/plan')}>Plan a trip</Btn></div>
      </nav>
      <main>
        {a === 'plan' ? <Planner plan={p} setPlan={setP} /> : a === 'results' ? <Results plan={p} /> : a === 'tour' ? <Tour id={b} plan={p} /> : <Home />}
      </main>
      <footer className="foot">Prices are estimates. Check fares and rooms before you book.</footer>
    </>
  )
}
