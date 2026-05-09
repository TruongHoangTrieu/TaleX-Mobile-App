import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FeedScreen } from '../../features/Feed/screens/FeedScreen';

const Tab = createBottomTabNavigator();

export const MainStack: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Feed" component={FeedScreen} />
    </Tab.Navigator>
  );
};
