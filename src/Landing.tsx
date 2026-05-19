import { useEffect, useRef, useState } from 'react';
import {
  EntityGlobe,
  RelationBriefCard,
  sampleEntityList,
  sampleRelations,
} from './components/EntityGlobe';
import {
  EntityCountryGlobe,
  EntityBriefCard,
  sampleEntries,
  useStaggeredReveal,
  LINK_SETTLE_MS,
} from './components/EntityCountryGlobe';
import type { LinkedEntry } from './components/EntityCountryGlobe';
import { BackgroundGlobe } from './components/BackgroundGlobe';

// ---------------------------------------------------------------------------
// Landing sample. Scroll-pinned hero: the globe stays centered while the
// wordmark scrolls up & fades; once gone, a relation caption fades in so the
// globe becomes the page's focus, surfacing the relationship type / A → B.
// Light theme, blue brand accent (#2563eb), real ChainReactions copy.
// ---------------------------------------------------------------------------

const BLUE = '#2563eb';
const INK = '#0f172a';
const MUTED = '#64748b';
const CYCLE_MS = 5000;

// Scroll progress (0..1 of the pinned Hero) where the Entity Relations view
// is fully composed: nodes faded in (nodesIn=1 @ 0.62), the section title +
// RelationBriefCard at full opacity (capIn=1 @ 0.7), and still before the
// hero's exit fade begins (exit @ 0.78). The scroll hint jumps here.
const ENTITY_RELATIONS_PROGRESS = 0.72;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

// Eased scroll progress: the displayed value glides toward the real scroll
// position (lerp) instead of snapping to it — makes the hero feel silky
// even with chunky wheel / trackpad scrolling.
function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    let current = 0;
    let target = 0;

    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      target = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      current += (target - current) * 0.12; // easing factor
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        raf = 0;
      } else {
        raf = requestAnimationFrame(tick);
      }
      setP(current);
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [ref]);
  return p;
}

// Reveal-on-scroll: flips to true once the element enters the viewport,
// then stays true (one-shot). Drives the section entrance animation.
function useInView<T extends HTMLElement>(threshold = 0.05) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      // fire a touch BEFORE the top edge reaches the viewport, so the
      // stagger is already running as the section slides in
      { threshold, rootMargin: '0px 0px 12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

const FEATURES = [
  {
    title: 'Zero Data Retention Policy',
    desc: 'All user data and output is automatically and permanently deleted from our servers every 24 hours.',
  },
  {
    title: 'Real-time Intelligence Search',
    desc: 'The most advanced AI searching across multilingual sources in real time — raw signal to structured intelligence, in seconds.',
  },
  {
    title: 'No AI Training on User Data',
    desc: 'User-input entities and AI-generated summaries are never used for machine-learning or AI model training.',
  },
  {
    title: '100% Canadian-Hosted & Developed',
    desc: 'From front-end design to back-end logic, our entire codebase and data stay on Canadian soil.',
  },
  {
    title: 'Regulatory Compliance',
    desc: 'We adhere to PIPEDA and FIPPA, the governing federal privacy laws for commercial organizations in Canada.',
  },
];

export function Landing() {
  return (
    <div
      style={{
        background: '#ffffff',
        color: INK,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        // `clip` (not `hidden`) — `hidden` turns this into a scroll
        // container and breaks the hero's position: sticky.
        overflowX: 'clip',
      }}
    >
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(44px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        /* Built on Trust — bento grid: 3 cards then 2 wider cards */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 18px;
        }
        .features-grid > * { grid-column: span 2; }
        .features-grid > *:nth-child(4),
        .features-grid > *:nth-child(5) { grid-column: span 3; }
        @media (max-width: 1024px) {
          .features-grid { grid-template-columns: 1fr 1fr; }
          .features-grid > *,
          .features-grid > *:nth-child(4),
          .features-grid > *:nth-child(5) { grid-column: auto; }
        }
        @media (max-width: 640px) {
          .features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Nav />
      <Hero />
      <CountryReach />
      <Features />
      <CTA />
      <FooterBar />
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────

function Nav() {
  const links = ['Features', 'Demo', 'Pricing', 'About'];
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px clamp(20px, 5vw, 64px)',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          fontWeight: 700,
          fontSize: 17,
        }}
      >
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: BLUE,
          }}
        />
        Chainreactions
      </div>

      <nav
        style={{
          display: 'flex',
          gap: 4,
          padding: '7px 10px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 999,
          boxShadow: '0 4px 14px -8px rgba(15,23,42,0.18)',
        }}
      >
        {links.map((l) => (
          <a
            key={l}
            href="#"
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              color: '#475569',
              textDecoration: 'none',
            }}
          >
            {l}
          </a>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <a
          href="#"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#475569',
            textDecoration: 'none',
          }}
        >
          Login
        </a>
        <a
          href="#"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '10px 18px',
            borderRadius: 999,
            background: BLUE,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Get Demo <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

// ─── Live / Freeze mode toggle (sits above a globe) ─────────────────────────
// Live = the view auto-cycles; Freeze = hold the current frame.

// One capsule that toggles on click: Live (green dot, background-coloured
// base) ⇄ Freeze (filled, dark).
function ModeToggle({
  paused,
  onChange,
  style,
}: {
  paused: boolean;
  onChange: (paused: boolean) => void;
  style?: React.CSSProperties;
}) {
  const live = !paused;
  return (
    <button
      type="button"
      aria-pressed={paused}
      title={live ? 'Live — click to freeze' : 'Frozen — click to go live'}
      onClick={() => onChange(!paused)}
      style={{
        appearance: 'none',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 16px',
        borderRadius: 999,
        // Live: base = the page background (blends in). Freeze: filled dark.
        background: live ? '#ffffff' : '#0f172a',
        color: live ? '#475569' : '#ffffff',
        border: `1px solid ${live ? '#e2e8f0' : '#0f172a'}`,
        boxShadow: live ? 'none' : '0 8px 22px -14px rgba(15, 23, 42, 0.5)',
        pointerEvents: 'auto',
        transition:
          'background 160ms ease, color 160ms ease, border-color 160ms ease',
        ...style,
      }}
    >
      {live ? (
        <>
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
        </>
      ) : (
        <>
          <span style={{ fontSize: 10, letterSpacing: 0 }}>❚❚</span>
          Freeze
        </>
      )}
    </button>
  );
}

// ─── Hero (scroll-pinned) ───────────────────────────────────────────────────

function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progress = useScrollProgress(sectionRef);

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setI((p) => (p + 1) % sampleRelations.length),
      CYCLE_MS,
    );
    return () => clearInterval(t);
  }, [paused]);
  const shown = sampleRelations[i];

  // Click the scroll hint -> glide to the Entity Relations sweet spot.
  const scrollToEntityRelations = () => {
    const el = sectionRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const top = el.offsetTop + ENTITY_RELATIONS_PROGRESS * total;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // From the Entity Relations view -> center the Entity Search globe.
  const scrollToEntitySearch = () => {
    document
      .getElementById('entity-search-globe')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // intro (badge + wordmark + tagline) scrolls up & fades out first
  const introOpacity = 1 - smoothstep(0.05, 0.38, progress);
  const introShift = -smoothstep(0, 0.5, progress) * 240;
  // globe gently grows as it becomes the focus
  const globeScale = 1 + smoothstep(0, 0.82, progress) * 0.08;
  // relation caption fades in once the intro is gone
  const capIn = smoothstep(0.42, 0.7, progress);
  // globe swap: node-less BackgroundGlobe (title backdrop) cross-fades into
  // the EntityGlobe (with nodes) as the Entity Relations section arrives.
  const nodesIn = smoothstep(0.3, 0.62, progress);
  // hint chevron only at the very top
  const hintOpacity = 1 - smoothstep(0, 0.14, progress);
  // hero "lets go" near the end — the whole scene fades & lifts so it
  // hands off continuously to Built on Trust (no dead-scroll, no hard cut)
  const exit = smoothstep(0.78, 1, progress);
  // second hint: appears once the Entity Relations view is composed (capIn),
  // then fades out together with the hero exit.
  const relHintOpacity = capIn * (1 - exit);

  return (
    <section
      ref={sectionRef}
      style={{ position: 'relative', height: '260vh' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 1 - exit * 0.9,
          transform: `translateY(${-exit * 60}px)`,
        }}
      >
        {/* blue glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'min(760px, 84vw)',
            height: 'min(760px, 84vw)',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle at center, rgba(37,99,235,0.16) 0%, rgba(37,99,235,0.05) 45%, transparent 70%)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />

        {/* globe — the persistent centerpiece. Two stacked layers that
            cross-fade on scroll: the node-less BackgroundGlobe behind the
            wordmark, swapping to the EntityGlobe (nodes + arcs) as the
            Entity Relations section comes into view. Same size / POV /
            spin so the shared dotted land appears continuous. */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'min(620px, 78vw)',
            transform: `translate(-50%, -50%) scale(${globeScale})`,
            pointerEvents: 'none',
          }}
        >
          {/* Layer 1: pure rotating dotted earth — the title backdrop. */}
          <div
            style={{
              opacity: 1 - nodesIn,
              // drop it once fully hidden so its canvas stops compositing
              visibility: nodesIn >= 1 ? 'hidden' : 'visible',
            }}
          >
            <BackgroundGlobe
              height={560}
              autoRotate
              rotateSpeed={0.26}
              initialPOV={{ lat: 22, lng: 8, altitude: 1.9 }}
              style={{ background: 'transparent' }}
            />
          </div>

          {/* Layer 2: the real EntityGlobe with nodes + relation arcs. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: nodesIn,
              visibility: nodesIn <= 0 ? 'hidden' : 'visible',
            }}
          >
            <EntityGlobe
              entities={sampleEntityList}
              relations={[shown]}
              height={560}
              autoRotate={!paused}
              rotateSpeed={0.26}
              highlightedRelationId={shown.id}
              initialPOV={{ lat: 22, lng: 8, altitude: 1.9 }}
              style={{ background: 'transparent' }}
            />
          </div>
        </div>

        {/* live / freeze toggle — above the globe, appears with the view */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - 290px)',
            left: '50%',
            transform: 'translate(-50%, -100%)',
            opacity: capIn,
            pointerEvents: capIn > 0.6 ? 'auto' : 'none',
            zIndex: 3,
          }}
        >
          <ModeToggle paused={paused} onChange={setPaused} />
        </div>

        {/* intro overlay — scrolls up and fades */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            transform: `translateY(${introShift}px)`,
            opacity: introOpacity,
            pointerEvents: introOpacity < 0.05 ? 'none' : 'auto',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 22,
            }}
          >
            <span style={{ width: 36, height: 2, background: BLUE }} />
            <span
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: BLUE,
                background: '#eff6ff',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              AI-Powered OSINT · Due Diligence
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(52px, 11vw, 156px)',
              lineHeight: 0.95,
              fontWeight: 800,
              letterSpacing: '-0.045em',
              color: INK,
              whiteSpace: 'nowrap',
              textShadow: '0 2px 28px rgba(255,255,255,0.7)',
            }}
          >
            Chainreactions<span style={{ color: BLUE }}>.</span>
          </h1>

          <p
            style={{
              margin: '22px auto 0',
              maxWidth: 440,
              fontSize: 15,
              lineHeight: 1.6,
              color: MUTED,
            }}
          >
            The OSINT platform that maps entity relationships across languages
            and borders — raw signal to structured intelligence, in seconds.
          </p>
        </div>

        {/* section title — top-left, appears once the intro scrolls away */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(84px, 12vh, 120px)',
            left: 'clamp(20px, 5vw, 64px)',
            opacity: capIn,
            transform: `translateY(${(1 - capIn) * -12}px)`,
            pointerEvents: 'none',
            maxWidth: 340,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: BLUE,
            }}
          >
            Entity Relations
          </div>
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 17,
              lineHeight: 1.5,
              fontWeight: 400,
              color: '#475569',
              letterSpacing: '-0.01em',
            }}
          >
            Name any two entities — we surface the relationship between them.
          </p>
        </div>

        {/* relation brief — right side, follows the cycled relation */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: 'clamp(20px, 5vw, 64px)',
            width: 340,
            maxWidth: '32vw',
            transform: `translateY(-50%) translateX(${(1 - capIn) * 24}px)`,
            opacity: capIn,
            pointerEvents: capIn > 0.6 ? 'auto' : 'none',
          }}
        >
          <RelationBriefCard
            key={shown.id}
            relation={shown}
            onViewGraph={(r) => console.log('view graph for', r.id)}
          />
        </div>

        {/* scroll hint — click to glide to the Entity Relations view */}
        <button
          type="button"
          onClick={scrollToEntityRelations}
          aria-label="Skip to the Entity Relations view"
          style={{
            position: 'absolute',
            bottom: 26,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: hintOpacity,
            // not clickable once it has faded out
            pointerEvents: hintOpacity < 0.05 ? 'none' : 'auto',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            padding: '6px 10px',
            fontSize: 12,
            fontFamily: 'inherit',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'color 160ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = BLUE;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Scroll
          <span style={{ fontSize: 16 }}>↓</span>
        </button>

        {/* second scroll hint — appears in the Entity Relations view,
            click to center the Entity Search globe */}
        <button
          type="button"
          onClick={scrollToEntitySearch}
          aria-label="Continue to the Entity Search view"
          style={{
            position: 'absolute',
            bottom: 26,
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: relHintOpacity,
            // not clickable until composed / once it has faded out
            pointerEvents: relHintOpacity < 0.05 ? 'none' : 'auto',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            padding: '6px 10px',
            fontSize: 12,
            fontFamily: 'inherit',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            transition: 'color 160ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = BLUE;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Entity Search
          <span style={{ fontSize: 16 }}>↓</span>
        </button>
      </div>
    </section>
  );
}

// ─── Country reach (entity → country globe) ─────────────────────────────────

function CountryReach() {
  const [ref, inView] = useInView<HTMLElement>(0.12);
  const [active, setActive] = useState<LinkedEntry>(sampleEntries[0]);
  const [paused, setPaused] = useState(false);

  // Keywords surface one after another: Military first, then Weapons 2s
  // later — and they STAY (not alternating). Each newly surfaced keyword's
  // icon pops onto the globe in sync (military → soldier, weapons → rifle).
  // Resets when the entity changes; holds while frozen.
  // Keywords emerge one-by-one (Military, then Weapons 2s later) and stay;
  // the card fades in first, so the first keyword waits ~0.8s. Resets per
  // entity, holds while frozen. Each newly shown keyword's icon also pops
  // onto the globe in sync (military → soldier, weapons → rifle).
  const keywords = active.origin.brief?.keywords ?? [];
  // For a linked entry the camera first sweeps to the searched country —
  // only after it settles there do we wait 1s, then surface Military, then
  // 2s later Sanctions. A normal entry just waits 2s after it switches.
  const revealed = useStaggeredReveal(keywords.length, active, {
    paused,
    firstDelayMs: active.link ? LINK_SETTLE_MS + 1000 : 2000,
  });
  const visibleKeywordIcons = keywords
    .slice(0, revealed)
    .map((k) => k.icon);

  const reveal = (delay: number) =>
    inView
      ? {
          animation: `revealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
        }
      : { opacity: 0 };

  // Mirror the Hero "Entity Relations" composition exactly: a full-bleed
  // stage with the globe centered, the section title absolute top-left,
  // and the brief card absolute right-center — so this card lands in the
  // same place as the Entity Relations card.
  const STAGE_H = 620;

  return (
    <section
      ref={ref}
      style={{
        background: '#fff',
        padding: 'clamp(72px, 10vw, 128px) 0',
      }}
    >
      {/* live / freeze toggle — in normal flow, ABOVE the globe stage so
          it always clears the globe disc (the stage height equals the
          globe height, leaving no room for an overlaid control) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 36,
          ...reveal(0.2),
        }}
      >
        <ModeToggle paused={paused} onChange={setPaused} />
      </div>

      <div
        id="entity-search-globe"
        style={{
          position: 'relative',
          height: STAGE_H,
          ...reveal(0.15),
        }}
      >
        {/* section title — top-left, matches Entity Relations */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(0px, 4vh, 48px)',
            left: 'clamp(20px, 5vw, 64px)',
            pointerEvents: 'none',
            maxWidth: 340,
            zIndex: 2,
            ...reveal(0),
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: BLUE,
            }}
          >
            Entity Search
          </div>
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 17,
              lineHeight: 1.5,
              fontWeight: 400,
              color: '#475569',
              letterSpacing: '-0.01em',
            }}
          >
            Name any entity — we surface its profile and risk exposure.
          </p>
        </div>

        {/* globe — centered, same sizing as the Hero globe */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'min(620px, 78vw)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          <EntityCountryGlobe
            entries={sampleEntries}
            height={STAGE_H}
            cycleMs={6000}
            style={{ background: 'transparent' }}
            onActiveChange={setActive}
            visibleKeywordIcons={visibleKeywordIcons}
            paused={paused}
          />
        </div>

        {/* entity brief — right-center, identical placement to the
            Entity Relations brief card */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: 'clamp(20px, 5vw, 64px)',
            width: 340,
            maxWidth: '32vw',
            transform: 'translateY(-50%)',
            zIndex: 2,
          }}
        >
          <EntityBriefCard
            key={active.origin.id}
            entity={active.origin}
            revealedKeywordCount={revealed}
            inCountry={active.country}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Features (dark section) ────────────────────────────────────────────────

function Features() {
  const [ref, inView] = useInView<HTMLElement>(0.12);
  // Keyframe-based reveal (animation, not transition) so it always plays
  // from the hidden state with a per-element stagger delay.
  const reveal = (delay: number) =>
    inView
      ? {
          animation: `revealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
        }
      : { opacity: 0 };

  return (
    <section
      ref={ref}
      style={{
        background: '#0b1120',
        color: '#fff',
        padding: 'clamp(72px, 10vw, 128px) 0',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 clamp(20px, 5vw, 64px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 56, ...reveal(0) }}>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(34px, 6vw, 64px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Built on{' '}
            <span
              style={{
                background: BLUE,
                color: '#fff',
                padding: '0 16px',
                borderRadius: 999,
              }}
            >
              Trust.
            </span>
          </h2>
          <p style={{ color: '#94a3b8', fontStyle: 'italic', marginTop: 16 }}>
            We are committed to:
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, idx) => (
            <div
              key={f.title}
              style={{
                background: '#111a2e',
                border: '1px solid #1e293b',
                borderRadius: 18,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                minHeight: 200,
                ...reveal(0.12 + idx * 0.1),
              }}
            >
              <span
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  color: BLUE,
                }}
              >
                /{String(idx + 1).padStart(2, '0')}
              </span>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>
                {f.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: '#94a3b8',
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA / Pricing (mirrors the real Index.tsx pricing section) ─────────────

function CTA() {
  return (
    <section
      id="pricing"
      style={{
        position: 'relative',
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        padding: 'clamp(72px, 10vw, 128px) clamp(20px, 5vw, 64px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            'linear-gradient(to right, transparent, #2563eb, transparent)',
          opacity: 0.3,
        }}
      />

      <div style={{ maxWidth: 896, margin: '0 auto', textAlign: 'center' }}>
        <h2
          style={{
            margin: '0 0 48px',
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 500,
            letterSpacing: '-0.04em',
            color: '#0f172a',
          }}
        >
          Request a <span style={{ color: BLUE }}>Free Trial Demo</span>
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 'min(100%, 460px)',
              textAlign: 'left',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              borderRadius: 16,
              padding: 32,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748b',
                background: '#e2e8f0',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              Free Trial
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                margin: '16px 0 8px',
                color: '#0f172a',
              }}
            >
              Free
            </div>
            <p
              style={{
                fontSize: 14,
                color: '#64748b',
                margin: '0 0 32px',
                paddingBottom: 32,
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              Perfect for beginners and individual researchers to try basic
              features
            </p>
            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 32px',
                padding: 0,
                display: 'grid',
                gap: 16,
              }}
            >
              {[
                'Unlimited Standard Intelligence Search',
                'Limited Dataset Search Credits',
                'Custom Relationship Mapping Canvas',
                '24 Hours Email Support',
              ].map((f) => (
                <li
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 14,
                    color: '#475569',
                  }}
                >
                  <span style={{ color: BLUE, flexShrink: 0 }}>⚡</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 999,
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '0.05em',
                cursor: 'pointer',
              }}
            >
              Start Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer (mirrors the real layout/Footer component) ──────────────────────

function FooterBar() {
  const legal = [
    ['Privacy Policy', '/docs/privacy'],
    ['Terms of Use', '/docs/terms'],
    ['Cookie Policy', '/docs/cookie'],
    ['Security', '/docs/security'],
  ];
  return (
    <footer
      style={{
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        padding: '80px clamp(20px, 5vw, 64px)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 48,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#0f172a',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              C
            </div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              Chainreactions
            </h3>
          </div>
          <p
            style={{
              maxWidth: 384,
              margin: '0 0 32px',
              fontSize: 15,
              lineHeight: 1.7,
              color: '#64748b',
            }}
          >
            An open source intelligence search tool designed for due
            diligence, enhancing risk assessment efficiency.
          </p>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              fontWeight: 500,
              color: '#94a3b8',
            }}
          >
            © 2026 Chainreactions AI Inc. ALL RIGHTS RESERVED.
          </div>
        </div>

        <div>
          <h4
            style={{
              margin: '0 0 24px',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#0f172a',
            }}
          >
            Legal
          </h4>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: 16,
            }}
          >
            {legal.map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  style={{
                    fontSize: 14,
                    color: '#64748b',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
