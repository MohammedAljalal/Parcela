import api from './client';

// Product create/update needs multipart/form-data because of image uploads.
// Nested fields (name, vendorInfo, ...) are sent as JSON strings — the backend
// parses them back via the parseMultipartJson middleware.
const JSON_FIELDS = ['name', 'description', 'specifications', 'deliveryInfo', 'tags', 'availableIslands', 'vendorInfo'];

const buildFormData = (payload, newImageFiles = []) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (JSON_FIELDS.includes(key)) {
      formData.append(key, JSON.stringify(value ?? (Array.isArray(value) ? [] : {})));
    } else if (value !== null) {
      formData.append(key, value);
    }
  });

  newImageFiles.forEach((file) => formData.append('images', file));

  return formData;
};

export const listProductsAdmin = (params) => api.get('/products/admin/all', { params }).then((r) => r.data);

export const getProductBySlug = (slug) => api.get(`/products/${slug}`).then((r) => r.data.data.product);

export const createProduct = (payload, newImageFiles) =>
  api
    .post('/products', buildFormData(payload, newImageFiles), { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.data.product);

export const updateProduct = (id, payload, newImageFiles) =>
  api
    .put(`/products/${id}`, buildFormData(payload, newImageFiles), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.data.product);

export const deleteProductImage = (id, imageId) =>
  api.delete(`/products/${id}/images/${imageId}`).then((r) => r.data.data.product);

export const deleteProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);
