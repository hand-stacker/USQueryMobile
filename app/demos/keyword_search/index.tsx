import React from 'react';
import { navigate } from '../../navigation/navigationRef';
import DemoFeatureButton from '../DemoFeatureButton';
import type { DemoFeature } from '../types';
import description from './description.txt';
import imageDark from './keyword_search_dk.jpg';
import imageLight from './keyword_search_li.jpg';

const KeywordSearchButton = ({ onDone }: { onDone: () => void }) => (
  <DemoFeatureButton
    label="Browse Bills"
    onPress={() => {
      onDone();
      navigate('Bill_FYP');
    }}
  />
);

export const keywordSearchFeature: DemoFeature = {
  key: 'keyword_search',
  title: 'Search by Keywords',
  image: {
    light: imageLight,
    dark: imageDark,
  },
  description,
  Button: KeywordSearchButton,
};
