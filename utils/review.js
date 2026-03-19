const validateReview = [
    body('rating').notEmpty().withMessage('Rating is required').isInt({ min: 1, max: 5 }),
    body('comment').notEmpty().withMessage('Comment is required'),
  ];
  