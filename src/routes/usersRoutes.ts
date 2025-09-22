import express from "express";
const router = express.Router();
import usersController from "../controllers/usersController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User Management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Gets a list of all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Access denied
 */
router.get('/', authMiddleware('Admin'), usersController.getUsers);

/**
 * @swagger
 * /users/{email}:
 *   delete:
 *     summary: Delete a user by email
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User successfully deleted
 *       404:
 *         description: User not found
 */
router.delete('/:email', authMiddleware('Admin'), usersController.deleteUser);

export default router;