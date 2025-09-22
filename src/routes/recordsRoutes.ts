import express from "express";
const router = express.Router();
import recordsController from "../controllers/recordsController";
import authMiddleware from "../middleware/authMiddleware";
// Upload middleware is no longer needed as we'll use URL strings

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Disk management
 */

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Gets all records
 *     tags: [Records]
 *     responses:
 *       200:
 *         description: List of records
 */
router.get('/', recordsController.getRecords); 

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Gets a record by ID
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Record details
 */
router.get('/:id', recordsController.getRecordById); 

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Deletes a record by ID
 *     tags: [Records]
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
 *         description: Record deleted successfully
 */
router.delete('/:id', authMiddleware('Admin'), recordsController.deleteRecord); 

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Creates a new record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               TitleRecord:
 *                 type: string
 *               YearOfPublication:
 *                 type: integer
 *               Price:
 *                 type: number
 *               Stock:
 *                 type: integer
 *               Discontinued:
 *                 type: boolean
 *               GroupId:
 *                 type: integer
 *               ImageRecord:
 *                 type: string
 *                 description: URL of the record's image (optional)
 *     responses:
 *       201:
 *         description: Record created successfully
 */
router.post('/', authMiddleware('Admin'), recordsController.createRecord);

/**
 * @swagger
 * /records/{id}:
 *   put:
 *     summary: Updates an existing record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               TitleRecord:
 *                 type: string
 *               YearOfPublication:
 *                 type: integer
 *               Price:
 *                 type: number
 *               Stock:
 *                 type: integer
 *               Discontinued:
 *                 type: boolean
 *               GroupId:
 *                 type: integer
 *               ImageRecord:
 *                 type: string
 *                 description: URL of the record's image (optional)
 *     responses:
 *       200:
 *         description: Record updated successfully
 */
router.put('/:id', authMiddleware('Admin'), recordsController.updateRecord);

/**
 * @swagger
 * /records/{id}/updateStock/{amount}:
 *   put:
 *     summary: Updates the stock of a record
 *     tags: [Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: amount
 *         required: true
 *         description: Amount to add or subtract from the stock
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid amount
 */
router.put('/:id/updateStock/:amount', recordsController.updateStock);

export default router ;