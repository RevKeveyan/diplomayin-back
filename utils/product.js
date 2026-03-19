const validateProduct = [
    body('name').notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('subtitle').notEmpty().withMessage('Subtitle is required').isLength({ max: 30 }),
    body('description').notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
    body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }),
    body('discount').optional().isFloat({ min: 0, max: 100 }),
    body('category').notEmpty().withMessage('Category is required'),
    body('subCategory').notEmpty().withMessage('Subcategory is required'),
    body('stock').notEmpty().withMessage('Stock is required').isInt({ min: 0 }),
    body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
    body('tags').optional().isArray(),
  ];
  