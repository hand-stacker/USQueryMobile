import React from 'react';
import { navigate } from '../../navigation/navigationRef';
import DemoFeatureButton from '../DemoFeatureButton';
import type { DemoFeature } from '../types';
import description from './description.txt';
import imageDark from './bill_visuals_dk.jpg';
import imageLight from './bill_visuals_li.jpg';

const BillVisualsButton = ({ onDone }: { onDone: () => void }) => (
  <DemoFeatureButton
    label="Browse Bills"
    onPress={() => {
      onDone();
      navigate('Bill_FYP');
    }}
  />
);

export const billVisualsFeature: DemoFeature = {
  key: 'bill_visuals',
  title: 'Refreshed Bill Cards',
  image: {
    light: imageLight,
    dark: imageDark,
  },
  description,
  Button: BillVisualsButton,
};
