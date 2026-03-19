const validatePaymentDetails = [
    body('cardNumber')
      .notEmpty().withMessage('Card number is required')
      .isLength({ min: 12, max: 19 }).withMessage('Invalid card number length'),
    body('cardHolderName').notEmpty().withMessage('Card holder name is required'),
    body('expirationDate').notEmpty().withMessage('Expiration date is required'),
    body('cvv')
      .notEmpty().withMessage('CVV is required')
      .isLength({ min: 3, max: 4 }).withMessage('Invalid CVV length'),
    body('billingAddress').notEmpty().withMessage('Billing address is required'),
  ];
  