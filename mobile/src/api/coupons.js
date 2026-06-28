import client from './client';

// POST /coupons/preview - validate & preview coupon discount
export const previewCoupon = (code) => client.post('/coupons/preview', { code });
