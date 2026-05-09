import React from 'react';
import { Pressable, Text } from 'react-native';

export const Button: React.FC<{
  title: string;
  onPress?: () => void;
}> = ({ title, onPress }) => (
  <Pressable onPress={onPress}>
    <Text>{title}</Text>
  </Pressable>
);
