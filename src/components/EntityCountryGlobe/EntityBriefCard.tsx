import type { CSSProperties } from 'react';

import type { OriginEntity } from './types';
import styles from './EntityBriefCard.module.css';

export interface EntityBriefCardProps {
  entity: OriginEntity;
  /** How many keywords have surfaced so far — they appear one after another
   *  (Military first, then Weapons). Defaults to all. */
  revealedKeywordCount?: number;
  /** The country this entity is being searched against (e.g. "China"),
   *  shown as "in <country>" under the name. */
  inCountry?: string;
  className?: string;
  style?: CSSProperties;
}

// Only show a native-name subline when it differs from the display name.
function secondaryLine(e: OriginEntity) {
  return e.localName && e.localName !== e.name ? e.localName : null;
}

// Relationship badge tone: Direct = green, Indirect = blue, anything else
// (e.g. "No Evidence") = neutral grey.
function badgeClass(relationship: string): string {
  const r = relationship.toLowerCase();
  if (r === 'direct') return styles.kwBadgeDirect;
  if (r === 'indirect') return styles.kwBadgeIndirect;
  return styles.kwBadgeNeutral;
}

/**
 * Single-entity brief. Mirrors RelationBriefCard, but where the relations
 * card pairs two entities (source ↓ target), this replaces the second
 * entity with the entity's own profile — only headline titles, not a full
 * dossier.
 */
export function EntityBriefCard({
  entity,
  revealedKeywordCount,
  inCountry,
  className,
  style,
}: EntityBriefCardProps) {
  const b = entity.brief ?? {};
  const subline = secondaryLine(entity);

  const allKeywords = b.keywords ?? [];
  // Keywords surface one after another (Military, then Weapons) and stay.
  const shownKeywords = allKeywords.slice(
    0,
    revealedKeywordCount ?? allKeywords.length,
  );

  const rows: { label: string; value: string }[] = [
    b.jurisdiction && { label: 'Jurisdiction', value: b.jurisdiction },
    b.type && { label: 'Entity Type', value: b.type },
  ].filter(Boolean) as { label: string; value: string }[];

  const subsidiaries = b.subsidiaries ?? [];
  const affiliated = b.affiliated ?? [];
  // Affiliated companies emerge together with the LAST keyword (e.g.
  // Sanctions). With no keywords, they show as soon as the card does.
  const affiliatedVisible =
    affiliated.length > 0 &&
    (allKeywords.length === 0 ||
      shownKeywords.length >= allKeywords.length);

  return (
    <div
      className={className ? `${styles.card} ${className}` : styles.card}
      style={style}
    >
      <div className={styles.header}>
        <span className={styles.badge}>ENTITY</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.entityBlock}>
        <p className={styles.entityNamePrimary}>{entity.name}</p>
        {inCountry && (
          <p className={styles.entityContext}>in {inCountry}</p>
        )}
        {subline && <p className={styles.entityNameSecondary}>{subline}</p>}
      </div>

      <div className={styles.divider} />

      <div className={styles.info}>
        {rows.map((r) => (
          <div className={styles.row} key={r.label}>
            <span className={styles.label}>{r.label}</span>
            <p className={styles.value}>{r.value}</p>
          </div>
        ))}
      </div>

      {subsidiaries.length > 0 && (
        <>
          <div className={styles.divider} />
          <div className={styles.info}>
            <div className={styles.row}>
              <span className={styles.label}>Corporate Structure</span>
              <span className={styles.subLabel}>Subsidiaries</span>
              <ul className={styles.subList}>
                {subsidiaries.map((s) => (
                  <li className={styles.subItem} key={s}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {shownKeywords.length > 0 && (
        <>
          <div className={styles.divider} />
          <div className={styles.info}>
            <div className={styles.row}>
              <span className={styles.label}>Keywords Analysis</span>
              <ul className={styles.kwList}>
                {shownKeywords.map((k) => {
                  const rel = k.relationship ?? 'Direct';
                  return (
                    // keyed so each surfaces (pops in) as it is revealed
                    <li className={styles.kwItem} key={k.label}>
                      <span className={styles.kwLead}>
                        <img
                          className={styles.kwIcon}
                          src={`/icons/${k.icon}.png`}
                          alt=""
                          draggable={false}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className={styles.kwName}>{k.label}</span>
                      </span>
                      <span
                        className={`${styles.kwBadge} ${badgeClass(rel)}`}
                      >
                        {rel}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <span className={styles.kwMore} aria-label="more keywords">
                …
              </span>
            </div>
          </div>
        </>
      )}

      {affiliatedVisible && (
        <div className={styles.affiliated}>
          <div className={styles.divider} />
          <div className={styles.info}>
            <div className={styles.row}>
              <span className={styles.label}>Affiliated Company</span>
              <ul className={styles.subList}>
                {affiliated.map((a) => (
                  <li className={styles.subItem} key={a}>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
