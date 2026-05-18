import { useEffect, useState } from 'react';
import {
  EntityGlobe,
  RELATION_BG,
  RELATION_COLOR,
  RELATION_LABEL,
  sampleEntityList,
  sampleRelations,
} from './components/EntityGlobe';

const CYCLE_MS = 5000;

// Landing-page Hero preview — light theme aligned to the real Index.tsx.
// The relation detail is ALWAYS shown, in a slim bottom caption bar that
// doesn't cover the globe (replaces the old right-side sidebar). It tracks
// the 5s auto-cycle; clicking an arc pins that relation and pauses the
// cycle until "resume" is pressed.
export function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId) return; // paused while a relation is pinned
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % sampleRelations.length);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, [selectedId]);

  const selected = selectedId
    ? sampleRelations.find((r) => r.id === selectedId) ?? null
    : null;
  // Only ONE arc is ever on screen: the pinned one, else the cycled one.
  const shownRelation = selected ?? sampleRelations[activeIndex];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
        background: '#ffffff',
        color: '#1e293b',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <header style={{ textAlign: 'center', maxWidth: 640 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0 }}>
          ChainReactions
        </h1>
        <p style={{ color: '#64748b', marginTop: 8 }}>
          Track entity relationships across languages and borders.
        </p>
      </header>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1240,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
        }}
      >
        <EntityGlobe
          entities={sampleEntityList}
          relations={[shownRelation]}
          height={760}
          autoRotate
          rotateSpeed={0.28}
          highlightedRelationId={shownRelation.id}
          initialPOV={{ lat: 25, lng: 10, altitude: 1.75 }}
          style={{
            background:
              'radial-gradient(ellipse at center, #ffffff 0%, #eef2f7 72%)',
          }}
          onArcClick={(r) => setSelectedId(r.id)}
        />

        <RelationCaption
          relation={shownRelation}
          pinned={!!selected}
          onResume={() => setSelectedId(null)}
        />
      </div>

      <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
        {selected
          ? 'Pinned — press resume to continue the tour'
          : `Touring relations every ${CYCLE_MS / 1000}s · click an arc to pin`}{' '}
        · {sampleRelations.length} relations · {sampleEntityList.length} entities
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slim bottom caption — always visible, horizontal, low-profile.
// The inner content is keyed by relation id so it cross-fades on change.
// ---------------------------------------------------------------------------

function RelationCaption({
  relation,
  pinned,
  onResume,
}: {
  relation: (typeof sampleRelations)[number];
  pinned: boolean;
  onResume: () => void;
}) {
  const color = RELATION_COLOR[relation.type];
  const bg = RELATION_BG[relation.type];

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        width: 'min(760px, calc(100% - 48px))',
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(226, 232, 240, 0.85)',
        borderRadius: 14,
        boxShadow: '0 14px 34px -16px rgba(15, 23, 42, 0.28)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <style>{`
        @keyframes captionIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
      `}</style>

      {/* Type pill */}
      <span
        style={{
          flexShrink: 0,
          alignSelf: 'flex-start',
          display: 'inline-block',
          padding: '5px 11px',
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          background: bg,
        }}
      >
        {RELATION_LABEL[relation.type]}
      </span>

      {/* Endpoints + detail — cross-fades on every relation change */}
      <div
        key={relation.id}
        style={{
          flex: 1,
          minWidth: 0,
          animation: 'captionIn 380ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Endpoint entity={relation.source} />
          <span style={{ color: color, fontSize: 16, fontWeight: 700 }}>→</span>
          <Endpoint entity={relation.target} />
        </div>
      </div>

      {/* State control: live indicator OR resume button */}
      {pinned ? (
        <button
          onClick={onResume}
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            background: '#ffffff',
            color: '#475569',
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#1e293b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <span style={{ fontSize: 10 }}>▶</span> Resume
        </button>
      ) : (
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#94a3b8',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'livePulse 1.6s ease-in-out infinite',
            }}
          />
          Live
        </span>
      )}
    </div>
  );
}

function Endpoint({
  entity,
}: {
  entity: (typeof sampleRelations)[number]['source'];
}) {
  const primary = entity.localName ?? entity.name;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#0f172a',
          whiteSpace: 'nowrap',
        }}
      >
        {primary}
      </span>
      <span
        style={{
          fontSize: 11,
          color: '#94a3b8',
          whiteSpace: 'nowrap',
        }}
      >
        {entity.country}
      </span>
    </span>
  );
}
