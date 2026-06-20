import React from 'react';
import { navigate } from '../../navigation/navigationRef';
import DemoFeatureButton from '../DemoFeatureButton';
import type { DemoFeature } from '../types';
import description from './description.txt';
import imageDark from './floor_notifications_dk.jpg';
import imageLight from './floor_notifications_li.jpg';

const FloorNotificationsButton = ({ onDone }: { onDone: () => void }) => (
  <DemoFeatureButton
    label="Open Notification Settings"
    onPress={() => {
      onDone();
      navigate('Notification_Settings');
    }}
  />
);

export const floorNotificationsFeature: DemoFeature = {
  key: 'floor_notifications',
  title: 'Floor Notifications',
  image: {
    light: imageLight,
    dark: imageDark,
  },
  description,
  Button: FloorNotificationsButton,
};
