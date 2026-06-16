const sendSuccess = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

const sendPaginated = (res, data, pagination) => {
  const { total, page, limit } = pagination;

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      // Calculate total pages here instead of controller
      pages: Math.ceil(total / limit),
    },
  });
};

export { sendSuccess, sendError, sendPaginated };