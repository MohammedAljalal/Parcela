import React from 'react';
import { StripeProvider, useStripe as useStripeNative } from '@stripe/stripe-react-native';

export const StripeAppProvider = ({ children, publishableKey }) => {
  return (
    <StripeProvider publishableKey={publishableKey}>
      {children}
    </StripeProvider>
  );
};

export const useStripeApp = () => {
  return useStripeNative();
};
