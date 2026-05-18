import type { RelationType } from './types';

/**
 * Color per relation type — aligned with the frontend graphview
 * `BASE_RELATIONSHIP_CONFIG` (riskGraphConfig.ts) so the globe and the
 * in-app risk graph speak the same visual language.
 *
 * `arc`  — saturated stroke color for the globe arc (needs to read on a
 *          bright blue-marble globe).
 * `bg`   — soft tint for the sidebar type pill background.
 */
export const RELATION_COLOR: Record<RelationType, string> = {
  Direct: '#15803d',        // green-700  — confirmed direct link
  Indirect: '#1d4ed8',      // blue-700   — indirect / intermediated link
  'No Evidence': '#6b7280', // gray-500   — searched, nothing found
};

export const RELATION_BG: Record<RelationType, string> = {
  Direct: '#dcfce7',        // green-100
  Indirect: '#dbeafe',      // blue-100
  'No Evidence': '#f3f4f6', // gray-100
};

/**
 * Human labels. Used in tooltips, the legend, and the side panel.
 */
export const RELATION_LABEL: Record<RelationType, string> = {
  Direct: 'Direct',
  Indirect: 'Indirect',
  'No Evidence': 'No Evidence',
};
