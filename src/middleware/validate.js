// Validation middleware for request body
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.context.key,
            message: detail.message
          }))
        });
      }
      
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error during validation',
        error: err.message
      });
    }
  };
};

module.exports = { validate };