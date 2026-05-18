import {
  EntityCountryGlobe,
  sampleEntries,
} from './components/EntityCountryGlobe';

// Standalone preview for the entity → country globe (multi-entry).
export function CountryRiskPreview() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          Entity → Country Risk
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            display: 'flex',
            gap: 18,
            justifyContent: 'center',
            fontSize: 13,
            color: '#64748b',
          }}
        >
          {sampleEntries.map((e) => (
            <span
              key={e.origin.id}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: e.color,
                }}
              />
              {e.origin.name} → {e.country}
            </span>
          ))}
        </p>
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: 1040,
          height: 640,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -12px rgba(15,23,42,0.18)',
        }}
      >
        <EntityCountryGlobe
          entries={sampleEntries}
          height={640}
          style={{
            background:
              'radial-gradient(ellipse at center, #ffffff 0%, #eef2f7 72%)',
          }}
        />
      </div>
    </div>
  );
}
