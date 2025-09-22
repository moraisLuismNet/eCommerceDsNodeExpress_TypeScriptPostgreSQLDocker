import express from "express";
const router = express.Router();
import { getCartDetails, addToCart, removeFromCart } from "../controllers/cartDetailsController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: CartDetails
 *   description: Cart Detail Operations
 */

/**
 * @swagger
 * /cart-details/{email}:
 *   get:
 *     summary: Gets the details of a user's cart
 *     tags: [CartDetails]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart Details
 */
router.get('/:email', getCartDetails);

/**
 * @swagger
 * /cart-details/add/{email}:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [CartDetails]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recordId:
 *                 type: integer
 *               amount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/add/:email', authMiddleware(), addToCart);

/**
 * @swagger
 * /cart-details/remove/{email}:
 *   post:
 *     summary: Remove an item from the cart
 *     tags: [CartDetails]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recordId:
 *                 type: integer
 *               amount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.post('/remove/:email', authMiddleware(), removeFromCart);

export default router;