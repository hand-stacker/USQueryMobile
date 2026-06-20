import React from 'react';
import { navigate } from '../../navigation/navigationRef';
import DemoFeatureButton from '../DemoFeatureButton';
import type { DemoFeature } from '../types';
import description from './description.txt';
import imageDark from './vote_predictions_dk.jpg';
import imageLight from './vote_predictions_li.jpg';

const VotePredictionsButton = ({ onDone }: { onDone: () => void }) => (
  <DemoFeatureButton
    label="Browse Bills"
    onPress={() => {
      onDone();
      navigate('Bill_FYP');
    }}
  />
);

export const votePredictionsFeature: DemoFeature = {
  key: 'vote_predictions',
  title: 'Vote Predictions',
  image: {
    light: imageLight,
    dark: imageDark,
  },
  description,
  Button: VotePredictionsButton,
};
