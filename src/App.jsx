import { useEffect, useMemo, useState } from 'react'
import data from './data/indigo-league.json'
import { loadSave, writeSave, makePokemonCard, makeMovesCard, findBingos, spriteUrl } from './bingo.js'

export default function App() {
  const [save, setSave] = useState(loadSave)
  const [openEp, setOpenEp] = useState(() => save.lastEpisode ?? null)

  useEffect(() => writeSave(save), [save])

  const update = (fn) => setSave((s) => fn(structuredClone(s)))

  const open = (n) => {
    setOpenEp(n)
    update((s) => ({ ...s, lastEpisode: n }))
    window.scrollTo(0, 0)
  }
  const close = () => {
    setOpenEp(null)
    update((s) => ({ ...s, lastEpisode: null }))
  }

  const episode = data.episodes.find((e) => e.episode === openEp)
  return episode
    ? <EpisodeScreen episode={episode} save={save} update={update} onBack={close} />
    : <EpisodeList save={save} onOpen={open} />
}

function progressOf(epSave) {
  if (!epSave?.pokemon) return null
  const card = epSave.pokemon
  const real = card.marked.filter(Boolean).length
  return { marked: real, total: card.cells.length, bingo: findBingos(card).count > 0 || (epSave.moves && findBingos(epSave.moves).count > 0) }
}

function EpisodeList({ save, onOpen }) {
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const list = data.episodes.filter((e) =>
    !term || e.title.toLowerCase().includes(term) || e.code.toLowerCase().includes(term) || String(e.episode) === term ||
    e.pokemon.some((p) => p.name.toLowerCase().includes(term)))
  const played = data.episodes.filter((e) => save.episodes?.[e.episode]?.pokemon).length
  return (
    <div className="app">
      <header className="top">
        <div className="logo" aria-hidden="true" />
        <div>
          <h1>PokéBingo</h1>
          <p className="sub">{data.season} · {played}/{data.episodes.length} episodes played</p>
        </div>
      </header>
      <input className="search" type="search" placeholder="Search episode, title or Pokémon" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="eps">
        {list.map((e) => {
          const p = progressOf(save.episodes?.[e.episode])
          return (
            <li key={e.episode}>
              <button className="ep" onClick={() => onOpen(e.episode)}>
                <span className="code">{e.code}</span>
                <span className="title">{e.title}</span>
                <span className="meta">
                  {p ? <>{p.bingo && <b className="star">BINGO</b>} {p.marked}/{p.total}</> : <span className="muted">New</span>}
                </span>
              </button>
            </li>
          )
        })}
        {list.length === 0 && <li className="muted empty">No episode matches “{q}”.</li>}
      </ul>
      <footer className="foot">Fan-made companion. Pokémon © Nintendo / Game Freak / The Pokémon Company.</footer>
    </div>
  )
}

function EpisodeScreen({ episode, save, update, onBack }) {
  const n = episode.episode
  const epSave = save.episodes?.[n]
  const tab = epSave?.tab || 'pokemon'
  const [confirm, setConfirm] = useState(null)

  // Make cards the first time an episode is opened.
  useEffect(() => {
    if (!epSave?.pokemon || !epSave?.moves) {
      update((s) => {
        s.episodes ??= {}
        s.episodes[n] ??= {}
        s.episodes[n].pokemon ??= makePokemonCard(episode, data.events)
        s.episodes[n].moves ??= makeMovesCard(episode)
        return s
      })
    }
  }, [n])

  useEffect(() => { setConfirm(null) }, [tab, n])

  if (!epSave?.pokemon || !epSave?.moves) return null
  const card = epSave[tab]

  const setTab = (t) => update((s) => { s.episodes[n].tab = t; return s })
  const toggle = (i) => update((s) => {
    const c = s.episodes[n][tab]
    if (c.cells[i].kind === 'free') return s
    c.marked[i] = !c.marked[i]
    return s
  })
  const ask = (what, run) => {
    if (confirm === what) { run(); setConfirm(null) } else setConfirm(what)
  }
  const newCard = () => update((s) => {
    s.episodes[n][tab] = tab === 'pokemon' ? makePokemonCard(episode, data.events) : makeMovesCard(episode)
    return s
  })
  const clearMarks = () => update((s) => {
    const c = s.episodes[n][tab]
    c.marked = c.cells.map((cell) => cell.kind === 'free')
    return s
  })

  return (
    <div className="app">
      <header className="top ep-top">
        <button className="back" onClick={onBack} aria-label="Back to episodes">‹</button>
        <div className="ep-head">
          <p className="sub">{episode.code}</p>
          <h1 className="ep-title">{episode.title}</h1>
        </div>
      </header>

      <div className="tabs" role="tablist">
        <TabButton active={tab === 'pokemon'} onClick={() => setTab('pokemon')} label="Pokémon" card={epSave.pokemon} />
        <TabButton active={tab === 'moves'} onClick={() => setTab('moves')} label="Moves" card={epSave.moves} />
      </div>

      <Board card={card} onToggle={toggle} />

      <div className="actions">
        <button className={confirm === 'new' ? 'warn' : ''} onClick={() => ask('new', newCard)}>
          {confirm === 'new' ? 'Tap again for a new card' : 'New card'}
        </button>
        <button className={confirm === 'clear' ? 'warn' : ''} onClick={() => ask('clear', clearMarks)}>
          {confirm === 'clear' ? 'Tap again to clear' : 'Clear marks'}
        </button>
      </div>
      <p className="hint">Tap a square when it shows up in the episode. Get a full row, column or diagonal for BINGO.</p>
    </div>
  )
}

function TabButton({ active, onClick, label, card }) {
  const done = card.marked.filter(Boolean).length
  const bingos = findBingos(card).count
  return (
    <button role="tab" aria-selected={active} className={'tab' + (active ? ' on' : '')} onClick={onClick}>
      {label} <span className="count">{done}/{card.cells.length}</span>
      {bingos > 0 && <span className="pill">{bingos}×</span>}
    </button>
  )
}

function Board({ card, onToggle }) {
  const { count, cells: winning } = useMemo(() => findBingos(card), [card])
  return (
    <>
      <div className={'banner' + (count ? ' show' : '')} aria-live="polite">
        {count ? `BINGO${count > 1 ? ` ×${count}` : ''}!` : ' '}
      </div>
      <div className={`board s${card.size}`} style={{ gridTemplateColumns: `repeat(${card.size}, 1fr)` }}>
        {card.cells.map((cell, i) => (
          <Cell key={i} cell={cell} marked={card.marked[i]} win={winning.has(i)} onClick={() => onToggle(i)} />
        ))}
      </div>
    </>
  )
}

function Cell({ cell, marked, win, onClick }) {
  const [imgOk, setImgOk] = useState(true)
  const cls = ['cell', cell.kind, marked && 'marked', win && 'win'].filter(Boolean).join(' ')
  return (
    <button className={cls} onClick={onClick} aria-pressed={marked}>
      {cell.kind === 'pokemon' && imgOk && (
        <img src={spriteUrl(cell.dex)} alt="" loading="lazy" draggable="false" onError={() => setImgOk(false)} />
      )}
      <span className="label">{cell.label}</span>
      {marked && cell.kind !== 'free' && <span className="stamp" aria-hidden="true" />}
    </button>
  )
}
