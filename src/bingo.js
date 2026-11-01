// Card building, bingo-line checks and local save. No React in here.
const KEY = 'pokebingo:v1'

export function loadSave() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
export function writeSave(save) {
  try { localStorage.setItem(KEY, JSON.stringify(save)) } catch { /* private mode: progress lives in memory only */ }
}

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const spriteUrl = (dex) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`

// Pokémon board: 4x4. If the episode has fewer than 16 Pokémon, the rest are "moment" squares.
export function makePokemonCard(episode, events) {
  const size = 4
  const mons = shuffle(episode.pokemon).slice(0, size * size)
  const cells = mons.map((p) => ({ kind: 'pokemon', label: p.name, dex: p.dex }))
  const fill = shuffle(events).slice(0, size * size - cells.length)
  fill.forEach((e) => cells.push({ kind: 'event', label: e }))
  return { size, cells: shuffle(cells), marked: cells.map(() => false) }
}

// Moves board: 5x5 with a free centre, or 4x4 if the episode has few moves.
export function makeMovesCard(episode) {
  const size = episode.moves.length >= 24 ? 5 : 4
  const free = size === 5
  const need = size * size - (free ? 1 : 0)
  const cells = shuffle(episode.moves).slice(0, need).map((m) => ({ kind: 'move', label: m }))
  if (free) cells.splice(12, 0, { kind: 'free', label: 'FREE' })
  return { size, cells, marked: cells.map((c) => c.kind === 'free') }
}

// Returns the indexes of every square that sits in a completed row, column or diagonal,
// plus how many lines are complete.
export function findBingos({ size, marked }) {
  const lines = []
  for (let r = 0; r < size; r++) lines.push([...Array(size)].map((_, c) => r * size + c))
  for (let c = 0; c < size; c++) lines.push([...Array(size)].map((_, r) => r * size + c))
  lines.push([...Array(size)].map((_, i) => i * size + i))
  lines.push([...Array(size)].map((_, i) => i * size + (size - 1 - i)))
  const done = lines.filter((l) => l.every((i) => marked[i]))
  return { count: done.length, cells: new Set(done.flat()) }
}
