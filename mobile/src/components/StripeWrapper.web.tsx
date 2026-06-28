import React from 'react';

// Stripe React Native causes Metro to crash on Web due to native-only imports.
// This mock allows the Web bundle to compile successfully.
export const StripeAppProvider = ({ children, publishableKey }) => {
  return <>{children}</>;
};

export const useStripeApp = () => {
  return {
    initPaymentSheet: async () => ({
      error: { message: 'O Stripe Native Payment Sheet funciona apenas no Android/iOS. Para testar o fluxo de pagamento, por favor, use um emulador ou dispositivo físico com Expo Go.' }
    }),
    presentPaymentSheet: async () => ({
      error: { message: 'Pagamento não suportado na Web.' }
    }),
  };
};
