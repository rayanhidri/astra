import { useEffect, useMemo, useState } from 'react'
import { computeAvailability } from './availability'
import { UNI_COLORS } from './graphShared'
import { SIGLE_CATEGORY } from './categoryMap'

const API = '/api'

const CATEGORY_LABELS = {
  programming:          'Programmation',
  algorithms_theory:    'Algorithmique et théorie',
  systems:              'Systèmes',
  math:                 'Mathématiques',
  ai:                   'Intelligence artificielle',
  software_engineering: 'Génie logiciel',
  data:                 'Données',
  networks:             'Réseaux',
  web:                  'Web et interfaces',
}

const CATEGORY_ORDER = [
  'programming', 'algorithms_theory', 'systems', 'math',
  'ai', 'software_engineering', 'data', 'networks', 'web',
]

// ── Union-Find for equivalence bubbles ────────────────────────────────────────

function buildEquivBubbles(programSigles, edges) {
  const parent = {}
  programSigles.forEach(s => { parent[s] = s })
  const find = s => {
    while (parent[s] !== s) { parent[s] = parent[parent[s]]; s = parent[s] }
    return s
  }
  edges.forEach(e => {
    if (e.relation_type !== 'equivalent') return
    if (!(e.source in parent) || !(e.target in parent)) return
    parent[find(e.source)] = find(e.target)
  })
  const components = {}
  programSigles.forEach(s => {
    const root = find(s)
    ;(components[root] ??= []).push(s)
  })
  return Object.values(components)
}

// ── Confidence bar ────────────────────────────────────────────────────────────

function ConfBar({ value }) {
  if (value == null) return <span style={{ color: '#ccc', fontSize: 11 }}>—</span>
  const pct = Math.round(value * 100)
  const fill = pct >= 60 ? '#2a9d4e' : pct >= 40 ? '#f0a500' : '#ed1b2f'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <div style={{ width: 40, height: 4, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: fill }} />
      </div>
      <span style={{ fontSize: 10, color: '#777' }}>{pct}%</span>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function LibreDetailPanel({ sigle, node, available, completed, onToggle, onClose }) {
  const [equivs, setEquivs] = useState([])
  const [loadingEquivs, setLoadingEquivs] = useState(false)

  useEffect(() => {
    if (!sigle) { setEquivs([]); return }
    setLoadingEquivs(true)
    fetch(`${API}/equivalences?q=${encodeURIComponent(sigle)}&limit=100`)
      .then(r => r.json())
      .then(data => {
        const exact = (Array.isArray(data) ? data : [])
          .filter(r => r.sigle_a === sigle || r.sigle_b === sigle)
          .map(r => {
            const isA = r.sigle_a === sigle
            return {
              sigle:      isA ? r.sigle_b      : r.sigle_a,
              titre:      isA ? r.titre_b      : r.titre_a,
              universite: isA ? r.universite_b : r.universite_a,
              source:     r.source,
              confidence: r.confidence,
            }
          })
          .sort((a, b) => {
            if (a.source === 'official' && b.source !== 'official') return -1
            if (b.source === 'official' && a.source !== 'official') return 1
            return (b.confidence ?? 0) - (a.confidence ?? 0)
          })
        setEquivs(exact)
      })
      .catch(() => setEquivs([]))
      .finally(() => setLoadingEquivs(false))
  }, [sigle])

  if (!sigle) return null

  const uni = node?.data?.universite
  const uniColor = UNI_COLORS[uni] || '#888'
  const titre = node?.data?.titre || ''
  const credits = node?.data?.credits
  const niveau = node?.data?.niveau
  const description = node?.data?.description

  const statusLabel = completed ? 'COMPLÉTÉ' : available ? 'DISPONIBLE' : 'VERROUILLÉ'
  const statusStyle = completed
    ? { bg: '#f0faf3', color: '#2a9d4e' }
    : available
    ? { bg: '#eff6ff', color: '#2563eb' }
    : { bg: '#f3f4f6', color: '#6b7280' }

  return (
    <div style={{
      width: 320, flexShrink: 0,
      borderLeft: '1px solid #e8e8e8',
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#111' }}>
                {sigle}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                background: statusStyle.bg, color: statusStyle.color, letterSpacing: '0.05em',
              }}>
                {statusLabel}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', lineHeight: 1.35 }}>
              {titre || '(sans titre)'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#bbb', padding: '0 0 0 8px', lineHeight: 1,
              flexShrink: 0,
            }}
          >×</button>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: uniColor, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: uniColor, fontWeight: 600 }}>{uni}</span>
          {credits != null && <span style={{ fontSize: 11, color: '#888' }}>{credits} cr</span>}
          {niveau != null && <span style={{ fontSize: 11, color: '#888' }}>Niveau {niveau}</span>}
        </div>

        {/* Complete / remove button */}
        {(available || completed) && (
          <button
            onClick={() => onToggle(sigle)}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 8, marginBottom: 16,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: completed ? '#fff0f0' : '#f0faf3',
              color: completed ? '#c62828' : '#2a9d4e',
            }}
          >
            {completed ? 'Retirer des complétés' : 'Marquer comme complété'}
          </button>
        )}

        {description && (
          <p style={{ fontSize: 11, color: '#555', lineHeight: 1.55, marginBottom: 16, marginTop: 0 }}>
            {description}
          </p>
        )}

        {/* Équivalences */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#aaa',
          textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
        }}>
          Équivalences
        </div>

        {loadingEquivs && <p style={{ fontSize: 11, color: '#bbb', margin: 0 }}>Chargement…</p>}

        {!loadingEquivs && equivs.length === 0 && (
          <p style={{ fontSize: 11, color: '#ccc', margin: 0 }}>Aucune équivalence connue.</p>
        )}

        {!loadingEquivs && equivs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {equivs.map((eq, i) => {
              const eqColor = UNI_COLORS[eq.universite] || '#888'
              return (
                <div key={i} style={{
                  background: '#f9f9f9',
                  border: '1.5px solid #eee',
                  borderRadius: 8,
                  padding: '9px 11px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: eqColor, flexShrink: 0, display: 'inline-block' }} />
                        <strong style={{ fontFamily: 'monospace', fontSize: 11 }}>{eq.sigle}</strong>
                        <span style={{ color: eqColor, fontSize: 10, fontWeight: 600 }}>{eq.universite}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                          background: eq.source === 'official' ? '#e6f4ea' : '#fff8e1',
                          color: eq.source === 'official' ? '#1e7e34' : '#8a6d00',
                        }}>
                          {eq.source === 'official' ? 'OFFICIELLE' : 'SIMILAIRE'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 10.5, color: '#666',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {eq.titre}
                      </div>
                      {eq.source !== 'official' && <ConfBar value={eq.confidence} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Course card ───────────────────────────────────────────────────────────────

function CourseCard({ sigle, node, available, completed, selected, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const uni = node?.data?.universite
  const uniColor = UNI_COLORS[uni] || '#aaa'
  const title = node?.data?.titre || ''

  const bg = selected
    ? '#f0f4ff'
    : completed
    ? (hovered ? '#d6f0e0' : '#eaf7ee')
    : available
    ? (hovered ? '#f0f4ff' : '#fff')
    : '#fff'
  const border = selected
    ? '#7a9cf8'
    : completed
    ? '#a8d5b5'
    : available
    ? (hovered ? '#b0c4f8' : '#e0e0e0')
    : '#eeeeee'
  const opacity = (!available && !completed) ? 0.38 : 1

  return (
    <div
      onClick={() => onSelect(sigle)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity, cursor: 'pointer',
        padding: '7px 10px', borderRadius: 8,
        background: bg, border: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'background 0.12s, border-color 0.12s',
        userSelect: 'none',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: uniColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>{sigle}</div>
        <div style={{
          fontSize: 10.5, color: '#666', lineHeight: 1.3, marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title.length > 38 ? title.slice(0, 38) + '…' : title || uni}
        </div>
      </div>
      {completed && <span style={{ fontSize: 12, color: '#3a9d5c', flexShrink: 0, fontWeight: 700 }}>✓</span>}
    </div>
  )
}

// ── Bubble card ───────────────────────────────────────────────────────────────

function BubbleCard({ bubble, nodeById, availableSet, completedSet, selectedSigle, onSelect }) {
  const isSingleton = bubble.length === 1
  const hasAvailable = bubble.some(s => availableSet.has(s))
  const hasCompleted = bubble.some(s => completedSet.has(s))
  const borderColor = hasAvailable ? '#d4e0fb' : hasCompleted ? '#c3e6cb' : '#efefef'
  const bg = hasAvailable ? '#fafbff' : hasCompleted ? '#f5fbf6' : '#fafafa'

  return (
    <div style={{
      border: isSingleton ? 'none' : `1px solid ${borderColor}`,
      borderRadius: isSingleton ? 0 : 10,
      padding: isSingleton ? 0 : '8px 8px',
      background: isSingleton ? 'transparent' : bg,
      display: 'flex', flexDirection: 'column', gap: 5,
      minWidth: 200, maxWidth: 240,
    }}>
      {!isSingleton && (
        <div style={{ fontSize: 9.5, color: '#aaa', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 2 }}>
          ÉQUIVALENTS
        </div>
      )}
      {bubble.map(sigle => (
        <CourseCard
          key={sigle}
          sigle={sigle}
          node={nodeById[sigle]}
          available={availableSet.has(sigle)}
          completed={completedSet.has(sigle)}
          selected={selectedSigle === sigle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EtudiantLibreView() {
  const [graphData, setGraphData] = useState(null)
  const [libreCompleted, setLibreCompleted] = useState([])
  const [selectedSigle, setSelectedSigle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API}/courses/libre-graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed_sigles: [] }),
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setGraphData(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const { nodeById, categoryBubbles, availableSet, completedSet } = useMemo(() => {
    if (!graphData) return { nodeById: {}, categoryBubbles: {}, availableSet: new Set(), completedSet: new Set() }

    const nodeById = {}
    graphData.nodes.forEach(n => { if (n.node_type === 'course') nodeById[n.id] = n })

    const equivAdj = {}
    graphData.edges.forEach(e => {
      if (e.relation_type !== 'equivalent') return
      ;(equivAdj[e.source] ??= []).push(e.target)
      ;(equivAdj[e.target] ??= []).push(e.source)
    })
    const expandedCompleted = new Set(libreCompleted)
    libreCompleted.forEach(s => { (equivAdj[s] || []).forEach(eq => expandedCompleted.add(eq)) })

    const availableSigles = computeAvailability(graphData, [...expandedCompleted])
    const availableSet = new Set(availableSigles)
    const completedSet = new Set(libreCompleted)

    const bubbles = buildEquivBubbles(graphData.program_sigles, graphData.edges)

    const categoryBubbles = {}
    CATEGORY_ORDER.forEach(cat => { categoryBubbles[cat] = [] })

    bubbles.forEach(bubble => {
      const freq = {}
      bubble.forEach(s => { const cat = SIGLE_CATEGORY[s] || 'programming'; freq[cat] = (freq[cat] || 0) + 1 })
      const primaryCat = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
      if (categoryBubbles[primaryCat]) categoryBubbles[primaryCat].push(bubble)
    })

    CATEGORY_ORDER.forEach(cat => {
      categoryBubbles[cat].sort((a, b) => {
        const score = arr => arr.some(s => availableSet.has(s)) ? 2 : arr.some(s => completedSet.has(s)) ? 1 : 0
        return score(b) - score(a)
      })
    })

    return { nodeById, categoryBubbles, availableSet, completedSet }
  }, [graphData, libreCompleted])

  function handleToggle(sigle) {
    setLibreCompleted(prev =>
      prev.includes(sigle) ? prev.filter(s => s !== sigle) : [...prev, sigle]
    )
  }

  function handleSelect(sigle) {
    setSelectedSigle(prev => prev === sigle ? null : sigle)
  }

  const totalCourses = graphData?.program_sigles.length ?? 0
  const completedCount = libreCompleted.length
  const availableCount = availableSet.size
  const selectedNode = selectedSigle ? nodeById[selectedSigle] : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', fontSize: 14 }}>
      Chargement du catalogue…
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#c62828', fontSize: 14 }}>
      Erreur : {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f8f9fa' }}>

      {/* Left sidebar */}
      <div style={{
        width: 260, flexShrink: 0,
        borderRight: '1px solid #e8e8e8',
        background: '#fff',
        display: 'flex', flexDirection: 'column',
        padding: '24px 18px',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          Étudiant libre
        </div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 20, lineHeight: 1.4 }}>
          Explorez les cours informatiques de toutes les universités montréalaises.
          Cliquez un cours pour voir ses équivalences et le marquer comme complété.
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 6 }}>Progression</div>
        <div style={{ height: 6, borderRadius: 3, background: '#f0f0f0', marginBottom: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, background: '#4caf50',
            width: `${totalCourses ? (completedCount / totalCourses) * 100 : 0}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: '#2a9d4e' }}>{completedCount}</span> / {totalCourses} cours complétés
        </div>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, color: '#4a6fa5' }}>{availableCount}</span> cours disponibles maintenant
        </div>

        {completedCount > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 8 }}>
              Complétés ({completedCount})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {libreCompleted.map(sigle => {
                const n = nodeById[sigle]
                const uni = n?.data?.universite
                const uniColor = UNI_COLORS[uni] || '#aaa'
                return (
                  <div key={sigle} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px', borderRadius: 6,
                    background: '#eaf7ee', border: '1px solid #c3e6cb', fontSize: 11,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: uniColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: '#1a5c32', flex: 1 }}>{sigle}</span>
                    <button
                      onClick={() => handleToggle(sigle)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12, padding: '0 2px', lineHeight: 1 }}
                    >×</button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setLibreCompleted([])}
              style={{
                background: 'none', border: '1px solid #e0e0e0', borderRadius: 6,
                padding: '6px 12px', fontSize: 11, color: '#777', cursor: 'pointer', alignSelf: 'flex-start',
              }}
            >
              Réinitialiser
            </button>
          </>
        )}

        {completedCount === 0 && (
          <div style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic', lineHeight: 1.6 }}>
            Aucun cours complété.<br />Cliquez un cours disponible pour commencer.
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {CATEGORY_ORDER.map(cat => {
          const bubbles = categoryBubbles[cat] || []
          if (!bubbles.length) return null
          const catAvail = bubbles.reduce((sum, b) => sum + b.filter(s => availableSet.has(s)).length, 0)
          const catCompleted = bubbles.reduce((sum, b) => sum + b.filter(s => completedSet.has(s)).length, 0)
          const catTotal = bubbles.reduce((sum, b) => sum + b.length, 0)

          return (
            <div key={cat} style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#111' }}>
                  {CATEGORY_LABELS[cat]}
                </h2>
                {catAvail > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#4a6fa5', background: '#e8eef8', borderRadius: 10, padding: '2px 8px' }}>
                    {catAvail} disponible{catAvail > 1 ? 's' : ''}
                  </span>
                )}
                {catCompleted > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#2a9d4e', background: '#eaf7ee', borderRadius: 10, padding: '2px 8px' }}>
                    {catCompleted} complété{catCompleted > 1 ? 's' : ''}
                  </span>
                )}
                <span style={{ fontSize: 10.5, color: '#bbb' }}>{catTotal} cours</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {bubbles.map((bubble, i) => (
                  <BubbleCard
                    key={i}
                    bubble={bubble}
                    nodeById={nodeById}
                    availableSet={availableSet}
                    completedSet={completedSet}
                    selectedSigle={selectedSigle}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selectedSigle && (
        <LibreDetailPanel
          sigle={selectedSigle}
          node={selectedNode}
          available={availableSet.has(selectedSigle)}
          completed={completedSet.has(selectedSigle)}
          onToggle={handleToggle}
          onClose={() => setSelectedSigle(null)}
        />
      )}

    </div>
  )
}
