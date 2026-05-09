import React from 'react';
import { View, Text } from 'react-native';
import { useFeed } from '../hooks/useFeed';

export const FeedScreen: React.FC = () => {
  const { data, isLoading } = useFeed();

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Feed ({data?.length ?? 0})</Text>
    </View>
  );
};
