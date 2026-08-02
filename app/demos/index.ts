/**
 * What's New demo content.
 *
 * For each release that ships user-facing features:
 *  1. Create a folder per feature: app/demos/<feature_key>/ containing
 *     - <feature_key>_li.jpg  (light-theme screenshot)
 *     - <feature_key>_dk.jpg  (dark-theme screenshot)
 *     - description.txt       (short description shown under the title)
 *     - index.tsx             (DemoFeature manifest + CTA button)
 *  2. List the features below (order = carousel order).
 *  3. Delete or keep old folders — only features listed here are shown.
 *
 * The modal itself (app/misc/WhatsNewModal.tsx) is generic and shows whatever
 * is in DEMO_FEATURES whenever the stored last-seen version is older than the
 * version returned by the app-version API.
 */
import { billVisualsFeature } from './bill_visuals';
import { keywordSearchFeature } from './keyword_search';
import type { DemoFeature } from './types';

export const DEMO_FEATURES: DemoFeature[] = [
  keywordSearchFeature,
  billVisualsFeature,
];
