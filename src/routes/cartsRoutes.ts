import express from "express";
const router = express.Router();    
import cartsController from "../controllers/cartsController";   
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: Shopping cart management
 */

/**
 * @swagger
 * /carts/disable/{email}:
 *   post:
 *     summary: Disable a user's cart
 *     tags: [Carts]
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
 *         description: Cart disabled
 *       404:
 *         description: Cart not found
 */
/**
 * @swagger
 * /carts/status/{email}:
 *   get:
 *     summary: Get cart status for a user
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     responses:
 *       200:
 *         description: Cart status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     Enabled:
 *                       type: boolean
 *       400:
 *         description: Email is required
 *       500:
 *         description: Failed to get cart status
 */
router.get('/status/:email', authMiddleware(), cartsController.getCartStatus);

router.post('/disable/:email', authMiddleware('Admin'), cartsController.disableCart);

/**
 * @swagger
 * /carts/enable/{email}:
 *   post:
 *     summary: Enable a user's cart
 *     tags: [Carts]
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
 *         description: Cart enabled
 *       404:
 *         description: No disabled cart found for this user
 */
router.post('/enable/:email', authMiddleware('Admin'), cartsController.enableCart);

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Get all active carts
 *     description: Returns a list of all enabled carts
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of active carts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware('Admin'), cartsController.getAllCarts);

/**
 * @swagger
 * /carts/{email}:
 *   get:
 *     summary: Get a cart by user email
 *     description: Returns the active cart for a specific user
 *     tags: [Carts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     responses:
 *       200:
 *         description: Cart found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Email is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: No active cart found for this user
 *       500:
 *         description: Server error
 */
router.get('/:email', authMiddleware('Admin'), cartsController.getCartByEmail);

export default router;