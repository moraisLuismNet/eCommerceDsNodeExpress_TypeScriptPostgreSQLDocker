import express from "express";
const router = express.Router();
import ordersController from "../controllers/ordersController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /orders/create/{email}:
 *   post:
 *     summary: Creates an order from the user's cart
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post(
  "/create/:email",
  authMiddleware(),
  ordersController.createOrderFromCart
);

/**
 * @swagger
 * /orders/{email}:
 *   get:
 *     summary: Gets all orders for a user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order history for the user
 */
router.get("/:email", authMiddleware(), ordersController.getOrders);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Gets all orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all orders
 */
router.get('/', authMiddleware('Admin'), ordersController.getAllOrders);

export default router;
