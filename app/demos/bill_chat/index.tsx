import React from 'react';
import { navigate } from '../../navigation/navigationRef';
import DemoFeatureButton from '../DemoFeatureButton';
import type { DemoFeature } from '../types';
import imageDark from './bill_chat_dk.jpg';
import imageLight from './bill_chat_li.jpg';
import description from './description.txt';

const BillChatButton = ({ onDone }: { onDone: () => void }) => (
  <DemoFeatureButton
    label="Browse Bills"
    icon="chatbubble-ellipses-outline"
    onPress={() => {
      onDone();
      navigate('Bill_FYP');
    }}
  />
);

export const billChatFeature: DemoFeature = {
  key: 'bill_chat',
  title: 'Ask AI About Bills',
  image: {
    light: imageLight,
    dark: imageDark,
  },
  description,
  Button: BillChatButton,
};
