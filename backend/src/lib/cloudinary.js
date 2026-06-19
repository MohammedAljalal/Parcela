// Cloudinary setup and image upload/delete helpers.
'use strict';

const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Uploads a buffer (from multer memoryStorage) directly to Cloudinary.
const uploadImage = (fileBuffer, folder = 'products') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `parcela/${folder}`,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const deleteImage = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadImage, deleteImage };
