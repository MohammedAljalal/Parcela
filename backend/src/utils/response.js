// Unified API response shape across the whole project.

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, message = 'Error', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

const sendPaginated = (res, data, pagination) => {
  const { total, page, limit } = pagination;
  return res.status(200).json({
    success: true,
    data,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

export { sendSuccess, sendError, sendPaginated };
