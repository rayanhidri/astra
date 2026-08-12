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

// ── Union-Find ────────────────────────────────────────────────────────────────

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
    if (!components[root]) components[root] = []
    components[root].push(s)
  })

  return Object.values(components)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CourseCard({ sigle, node, available, completed, onToggle }) {
  const [hovered, setHovered] = useState(false)
  const uni = node?.data?.universite
  const uniColor = UNI_COLORS[uni] || '#aaa'
  const title = node?.data?.titre || ''

  const state = completed ? 'completed' : available ? 'available' : 'locked'
  const bg = completed ? '#eaf7ee' : hovered && available ? '#f7f9ff' : '#fff'
  const border = completed ? '#a8d5b5' : available ? (hovered ? '#b0c4f8' : '#e0e0e0') : '#eeeeee'
  const opacity = state === 'locked' ? 0.38 : 1

  return (
    <div
      onClick={available || completed ? () => onToggle(sigle) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity,
        cursor: available || completed ? 'pointer' : 'default',
        padding: '7px 10px',
        borderRadius: 8,
        background: bg,
        border: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background 0.12s, border-color 0.12s',
        userSelect: 'none',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: uniColor, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
          {sigle}
        </div>
        <div style={{
          fontSize: 10.5, color: '#666', lineHeight: 1.3, marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title.length > 38 ? title.slice(0, 38) + '…' : title || uni}
        </div>
      </div>
      {completed && (
        <span style={{ fontSize: 12, color: '#3a9d5c', flexShrink: 0, fontWeight: 700 }}>✓</span>
      )}
      {available && !completed && (
        <span style={{ fontSize: 10, color: '#7a9cf8', flexShrink: 0 }}>+</span>
      )}
    </div>
  )
}

function BubbleCard({ bubble, nodeById, availableSet, completedSet, onToggle }) {
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
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      minWidth: 200,
      maxWidth: 240,
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
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EtudiantLibreView() {
  const [graphData, setGraphData] = useState(null)
  const [libreCompleted, setLibreCompleted] = useState([])
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

    // 1-hop equiv expansion for availability computation
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
      bubble.forEach(s => {
        const cat = SIGLE_CATEGORY[s] || 'programming'
        freq[cat] = (freq[cat] || 0) + 1
      })
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

  const totalCourses = graphData?.program_sigles.length ?? 0
  const completedCount = libreCompleted.length
  const availableCount = availableSet.size

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', fontSize: 14 }}>
        Chargement du catalogue…
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#c62828', fontSize: 14 }}>
        Erreur : {error}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f8f9fa' }}>

      {/* Sidebar */}
      <div style={{
        width: 260, flexShrink: 0,
        borderRight: '1px solid #e8e8e8',
        background: '#fff',
        display: 'flex', flexDirection: 'column',
        padding: '24px 18px',
        gap: 0,
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          Cours libres
        </div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 20, lineHeight: 1.4 }}>
          Explorez les cours informatiques de toutes les universités montréalaises.
          Cliquez un cours pour le marquer comme complété.
        </div>

        {/* Progress */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 6 }}>
          Progression
        </div>
        <div style={{
          height: 6, borderRadius: 3, background: '#f0f0f0', marginBottom: 8, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3, background: '#4caf50',
            width: `${totalCourses ? (completedCount / totalCourses) * 100 : 0}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, color: '#2a9d4e' }}>{completedCount}</span>
          {' '}/ {totalCourses} cours complétés
        </div>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, color: '#4a6fa5' }}>{availableCount}</span>
          {' '}cours disponibles maintenant
        </div>

        {/* Completed list */}
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
                    background: '#eaf7ee', border: '1px solid #c3e6cb',
                    fontSize: 11,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: uniColor, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, color: '#1a5c32', flex: 1 }}>{sigle}</span>
                    <button
                      onClick={() => handleToggle(sigle)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#999', fontSize: 12, padding: '0 2px', lineHeight: 1,
                      }}
                    >×</button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setLibreCompleted([])}
              style={{
                background: 'none', border: '1px solid #e0e0e0', borderRadius: 6,
                padding: '6px 12px', fontSize: 11, color: '#777', cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Réinitialiser
            </button>
          </>
        )}

        {completedCount === 0 && (
          <div style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic', lineHeight: 1.5 }}>
            Aucun cours complété.{'\n'}Commencez par cliquer un cours disponible.
          </div>
        )}
      </div>

      {/* Main */}
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
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, color: '#4a6fa5',
                    background: '#e8eef8', borderRadius: 10, padding: '2px 8px',
                  }}>
                    {catAvail} disponible{catAvail > 1 ? 's' : ''}
                  </span>
                )}
                {catCompleted > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, color: '#2a9d4e',
                    background: '#eaf7ee', borderRadius: 10, padding: '2px 8px',
                  }}>
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
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
