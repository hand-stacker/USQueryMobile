import React from 'react';
import { Text, TextProps } from 'react-native';

export const UnscalableText = (props: TextProps) => {
  return <Text allowFontScaling={false} {...props} />;
};