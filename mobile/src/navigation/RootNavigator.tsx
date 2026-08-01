// Root Navigator

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '../store/AuthContext';
import { Loading } from '../components/common/Loading';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    console.log('RootNavigator - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user?.email);
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    console.log('RootNavigator - Showing loading screen');
    return <Loading fullScreen message="Loading SafeHaven..." />;
  }

  console.log('RootNavigator - Rendering:', isAuthenticated ? 'MainNavigator' : 'AuthNavigator');

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
