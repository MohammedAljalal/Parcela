// Multer reads multipart/form-data fields as flat strings — it has no concept
// of nested objects or arrays. Endpoints that accept both a file upload AND
// nested fields (Product's name/vendorInfo, Banner's title/subtitle, ...) need
// the client to send those fields as JSON strings; this middleware restores
// them to real objects/arrays before Joi validation runs.
'use strict';

const parseMultipartJson = (fields) => (req, res, next) => {
  for (const field of fields) {
    const value = req.body[field];
    if (typeof value === 'string' && value.length > 0) {
      try {
        req.body[field] = JSON.parse(value);
      } catch {
        // Leave the raw string in place; Joi will reject it with a clear message.
      }
    }
  }
  next();
};

module.exports = parseMultipartJson;
