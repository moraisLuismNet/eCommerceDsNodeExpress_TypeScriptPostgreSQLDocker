import express from "express";
const router = express.Router();
import groupsController from "../controllers/groupsController"; 
import authMiddleware from "../middleware/authMiddleware";
// Upload middleware is no longer needed as we'll use URL strings

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Management of musical groups
 */

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Gets all musical groups
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
router.get('/', groupsController.getGroups);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Gets a group by ID with its records
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group with records
 */
router.get('/:id', groupsController.getGroupWithRecords);

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Creates a new group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NameGroup:
 *                 type: string
 *                 description: Group name
 *               MusicGenreId:
 *                 type: integer
 *                 description: ID of the musical genre to which it belongs
 *               ImageGroup:
 *                 type: string
 *                 description: URL of the group's image
 *     responses:
 *       201:
 *         description: Group created successfully
 */
router.post('/', authMiddleware('Admin'), groupsController.createGroup);

/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Updates an existing group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NameGroup:
 *                 type: string
 *               MusicGenreId:
 *                 type: integer
 *               ImageGroup:
 *                 type: string
 *                 description: URL of the group's image (can be null)
 *     responses:
 *       200:
 *         description: Group updated successfully
 */
router.put('/:id', authMiddleware('Admin'), groupsController.updateGroup);

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Deletes a group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Group deleted successfully
 */
router.delete('/:id', authMiddleware('Admin'), groupsController.deleteGroup);

export default router;