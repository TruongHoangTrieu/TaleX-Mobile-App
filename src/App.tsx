import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { Providers } from './app/providers';

export default function App() {
  return (
    <Providers>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </Providers>
  );
}
