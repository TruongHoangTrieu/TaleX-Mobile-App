import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStack } from './stacks/MainStack';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainStack} />
    </Stack.Navigator>
  );
};
