import data from '../data/tours.json'

export const TIERS = ['budget', 'standard', 'comfort']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Estimated round trip cost per person to reach Dhaka, used when a tour has no direct route from the city.
export const CITIES = {
  Dhaka: 0,
  Chattogram: 1500,
  Khulna: 1100,
  Sylhet: 1300,
  Rajshahi: 1200,
  Rangpur: 1500,
  Barishal: 900,
  Mymensingh: 600,
  Cumilla: 500,
}

export const tours = data.tours

export function costFor(tour, tier, origin, people, days) {
  const t = tour.costPerPerson[tier]
  const direct = tour.origins[origin]
  const route = direct || tour.origins.Dhaka
  const extra = direct ? 0 : CITIES[origin] || 0
  const nights = days - 1
  const rooms = Math.ceil(people / t.roomCapacity)
  const parts = {
    travel: people * (route.transportRoundTripPerPerson[tier] + extra),
    stay: rooms * t.stayRoomPerNight * nights,
    food: people * days * t.foodPerDay,
    local: people * days * t.localTransportPerDay,
    activities: people * t.activitiesTotal,
  }
  const total = Object.values(parts).reduce((a, b) => a + b, 0)
  return { tier, parts, total, rooms, nights, route, viaDhaka: !direct, extra }
}

export function seasonOf(tour, month) {
  if (tour.season.bestMonths.includes(month)) return 'best'
  if (tour.season.avoidMonths.includes(month)) return 'avoid'
  return 'ok'
}

export function plan({ people, days, budget, origin, month }) {
  const p = Math.max(1, Math.floor(people) || 1)
  const dd = Math.max(1, Math.floor(days) || 1)

  return tours
    .map((tour) => {
      const { min, max } = tour.groupSize
      const { minDays, idealDays, maxDays } = tour.duration
      if (p < min || p > max || dd < minDays) return null

      const usedDays = Math.min(dd, maxDays)
      const season = seasonOf(tour, month)
      const costs = TIERS.map((tier) => costFor(tour, tier, origin, p, usedDays))
      const affordable = [...costs].reverse().find((c) => c.total <= budget)
      const chosen = affordable || costs[0]
      const over = chosen.total - budget

      let score = affordable ? 100 + TIERS.indexOf(chosen.tier) * 4 : Math.max(0, 60 - (over / budget) * 100)
      score += { best: 30, ok: 8, avoid: -45 }[season]
      score -= Math.abs(usedDays - idealDays) * 3

      return { tour, season, costs, chosen, affordable: !!affordable, over, usedDays, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
}
