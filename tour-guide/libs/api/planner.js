import data from './data/tours.json'

export const TIERS = ['budget', 'standard', 'comfort']
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Estimated round trip cost to Dhaka per tier, used when a tour has no fare for the city.
const toDhaka = {
  Dhaka: [0, 0, 0],
  Chattogram: [1000, 1800, 6000],
  Sylhet: [1300, 2600, 7000],
  Khulna: [1800, 3000, 8500],
  Rajshahi: [1400, 2400, 4500],
  Rangpur: [2000, 3200, 6000],
  Barishal: [1100, 2000, 4000],
}
export const CITIES = Object.keys(toDhaka)
const local = { 'sylhet-classic': { Sylhet: [300, 600, 1500] } }

export const tours = data.tours
export const getTour = (id) => tours.find((t) => t.id === id)
export const money = (n) => 'BDT ' + Math.round(n).toLocaleString('en-IN')

function fare(t, city, i) {
  const o = t.origins[city]
  if (o) return { v: o.transportRoundTripPerPerson[TIERS[i]], est: false, info: o }
  const l = local[t.id]?.[city]
  if (l) return { v: l[i], est: false, info: null }
  const d = t.origins.Dhaka
  return { v: d.transportRoundTripPerPerson[TIERS[i]] + toDhaka[city][i], est: true, info: d }
}

export function cost(t, p, i, days) {
  const c = t.costPerPerson[TIERS[i]]
  const f = fare(t, p.city, i)
  const nights = days - 1
  const rooms = Math.ceil(p.people / c.roomCapacity)
  const parts = {
    Transport: f.v * p.people,
    Stay: rooms * c.stayRoomPerNight * nights,
    Food: c.foodPerDay * days * p.people,
    'Local travel': c.localTransportPerDay * days * p.people,
    Activities: c.activitiesTotal * p.people,
  }
  const total = Object.values(parts).reduce((a, b) => a + b, 0)
  return { tier: TIERS[i], parts, total, perPerson: total / p.people, rooms, nights, est: f.est, info: f.info }
}

export function plan(p) {
  const out = []
  for (const t of tours) {
    if (p.people < t.groupSize.min || p.people > t.groupSize.max) continue
    const days = Math.min(Math.max(p.days, t.duration.minDays), t.duration.maxDays)
    const s = t.season
    const season = s.bestMonths.includes(p.month) ? 'best' : s.avoidMonths.includes(p.month) ? 'avoid' : 'ok'
    const tiers = [0, 1, 2].map((i) => cost(t, p, i, days))
    const fitting = tiers.filter((x) => x.total <= p.budget)
    const pick = fitting.length ? fitting[fitting.length - 1] : tiers[0]
    const status = fitting.length ? 'fits' : tiers[0].total <= p.budget * 1.25 ? 'stretch' : 'over'
    if (status === 'over') continue
    out.push({ tour: t, days, season, tiers, pick, status })
  }
  const rank = (x) => (x.status === 'fits' ? 0 : 2) + (x.season === 'avoid' ? 1 : 0)
  const sr = { best: 0, ok: 1, avoid: 2 }
  return out.sort((a, b) => rank(a) - rank(b) || sr[a.season] - sr[b.season] || b.pick.total - a.pick.total)
}
