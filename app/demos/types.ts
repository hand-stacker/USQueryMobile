import type { ComponentType } from 'react';
import type { ImageSourcePropType } from 'react-native';

export interface DemoFeature {
  /** Unique key, matches the folder name in app/demos/. */
  key: string;
  /** Title shown above the description in the carousel. */
  title: string;
  /** Theme-aware screenshots: `{name}_li.jpg` (light) and `{name}_dk.jpg` (dark). */
  image: {
    light: ImageSourcePropType;
    dark: ImageSourcePropType;
  };
  /** Bundled .txt asset: `require('./description.txt')`. */
  description: number;
  /**
   * CTA button that takes the user to the feature's page.
   * Call `onDone` before navigating so the modal closes first.
   */
  Button: ComponentType<{ onDone: () => void }>;
}
