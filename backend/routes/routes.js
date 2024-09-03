const express = require('express');
const paymentMethod = require('../controllers/paymentMethod');
const { getUserData,paymentMethodHandler } = require('../controllers/extraController');


const router = express.Router();
//not in use
router.post('/webhook', paymentMethodHandler);
router.get('/getAllUserData', getUserData);

//in use
router.post('/create-order',paymentMethod.createPayment)
router.post('/verify-payment',paymentMethod.verifyPayment)
router.post('/refund',paymentMethod.paymentRefund)
router.get('/getAllOrders',paymentMethod.getAllOrders)

module.exports = router;
