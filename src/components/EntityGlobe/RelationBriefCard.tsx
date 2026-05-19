import type { CSSProperties } from 'react';

import { RELATION_LABEL } from './relation-config';
import type { EntityRelation } from './types';
import styles from './RelationBriefCard.module.css';

export interface RelationBriefCardProps {
  relation: EntityRelation;
  onViewGraph?: (relation: EntityRelation) => void;
  className?: string;
  style?: CSSProperties;
}

// Badge: CSS module ships Direct/Indirect; anything else (e.g. "No
// Evidence") falls back to a neutral zinc chip via inline style.
const BADGE_CLASS: Record<string, string | undefined> = {
  Direct: styles.badgeDirect,
  Indirect: styles.badgeIndirect,
};
const NEUTRAL_BADGE: CSSProperties = {
  background: '#f4f4f5',
  color: '#71717a',
};

// Only show a secondary line when there's a distinct native name.
// English-only entities (e.g. "University of Toronto") get no subline.
function secondaryLine(e: EntityRelation['source']) {
  return e.localName && e.localName !== e.name ? e.localName : null;
}

export function RelationBriefCard({
  relation,
  onViewGraph,
  className,
  style,
}: RelationBriefCardProps) {
  const badgeClass = BADGE_CLASS[relation.type];
  // Card shows only a short brief; the full analysis spans 8 dimensions.
  const ANALYSIS_DIMENSIONS = 8;
  const description = `${relation.source.name} and ${relation.target.name} have a ${relation.type.toLowerCase()} relationship${
    relation.detail ? ` — ${relation.detail}` : ''
  }.`;

  const languages = relation.sourceLanguages ?? [];

  return (
    <div
      className={className ? `${styles.card} ${className}` : styles.card}
      style={style}
    >
      <div className={styles.header}>
        <span
          className={`${styles.badge} ${badgeClass ?? ''}`}
          style={badgeClass ? undefined : NEUTRAL_BADGE}
        >
          {RELATION_LABEL[relation.type].toUpperCase()}
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.entities}>
        <div className={styles.entity}>
          <p className={styles.entityNamePrimary}>{relation.source.name}</p>
          {secondaryLine(relation.source) && (
            <p className={styles.entityNameSecondary}>
              {secondaryLine(relation.source)}
            </p>
          )}
        </div>

        <div className={styles.relationIndicator}>
          <span className={styles.relationLine} />
          <span className={styles.relationGlyph}>↓</span>
          <span className={styles.relationLine} />
        </div>

        <div className={styles.entity}>
          <p className={styles.entityNamePrimary}>{relation.target.name}</p>
          {secondaryLine(relation.target) && (
            <p className={styles.entityNameSecondary}>
              {secondaryLine(relation.target)}
            </p>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <span className={styles.label}>Description</span>
        <p className={styles.body}>{description}</p>
        <span
          style={{
            marginTop: 4,
            paddingTop: 10,
            borderTop: '1px solid #f4f4f5',
            fontFamily:
              "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)",
            fontSize: 11,
            letterSpacing: '0.06em',
            color: '#a1a1aa',
          }}
        >
          Full analysis spans {ANALYSIS_DIMENSIONS} dimensions
        </span>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <span className={styles.label}>Original Language of Sources</span>
        <p className={styles.languageList}>
          {languages.length ? languages.join('  /  ') : '—'}
        </p>
      </div>
    </div>
  );
}
