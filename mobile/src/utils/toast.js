// ─── Global Toast Utility ─────────────────────────────────────────────────────
// Usage anywhere in the app:
//   import toast from '../utils/toast';
//   toast.success('Item added!');
//   toast.error('Something went wrong');
//   toast.info('Loading...');
//   toast.cart('Sapatilhas Sport Red added to cart');

import Toast from 'react-native-toast-message';

const toast = {
  success: (message, title = 'Sucesso') =>
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    }),

  error: (message, title = 'Erro') =>
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
    }),

  info: (message, title = 'Info') =>
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 60,
    }),

  cart: (productName) =>
    Toast.show({
      type: 'success',
      text1: 'Adicionado ao Carrinho!',
      text2: productName,
      position: 'bottom',
      visibilityTime: 3000,
      autoHide: true,
      bottomOffset: 90,
    }),

  wishlist: (added) =>
    Toast.show({
      type: added ? 'success' : 'info',
      text1: added ? 'Adicionado aos Favoritos' : 'Removido dos Favoritos',
      position: 'top',
      visibilityTime: 2000,
      autoHide: true,
      topOffset: 60,
    }),

  hide: () => Toast.hide(),
};

export default toast;
