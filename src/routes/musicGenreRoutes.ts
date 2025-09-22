import express from "express";
const router = express.Router();
import musicGenresController from "../controllers/musicGenresController";
import authMiddleware from "../middleware/authMiddleware";

/**
 * @swagger
 * tags:
 *   name: MusicGenres
 *   description: Music genre management
 */

/**
 * @swagger
 * /music-genres:
 *   get:
 *     summary: Gets all music genres
 *     tags: [MusicGenres]
 *     responses:
 *       200:
 *         description: List of music genres
 */
router.get('/', musicGenresController.getMusicGenres);

/**
 * @swagger
 * /music-genres/withTotalGroups:
 *   get:
 *     summary: Gets music genres with total groups
 *     tags: [MusicGenres]
 *     responses:
 *       200:
 *         description: List of music genres with total groups
 */
router.get('/withTotalGroups', musicGenresController.getWithTotalGroups);

/**
 * @swagger
 * /music-genres/searchByName/{text}:
 *   get:
 *     summary: Searches music genres by name
 *     tags: [MusicGenres]
 *     parameters:
 *       - in: path
 *         name: text
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of music genres matching the search text
 */
router.get('/searchByName/:text', musicGenresController.searchByName);

/**
 * @swagger
 * /music-genres/sortedByName/{ascen}:
 *   get:
 *     summary: Gets music genres sorted by name
 *     tags: [MusicGenres]
 *     parameters:
 *       - in: path
 *         name: ascen
 *         required: true
 *         description: true for ascending, false for descending
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of music genres sorted by name
 */
router.get('/sortedByName/:ascen', musicGenresController.getSortedByName);

/**
 * @swagger
 * /music-genres/{id}:
 *   get:
 *     summary: Gets a music genre by ID
 *     tags: [MusicGenres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Music genre details
 */
router.get('/:id', musicGenresController.getMusicGenreById);

/**
 * @swagger
 * /music-genres:
 *   post:
 *     summary: Creates a new music genre
 *     tags: [MusicGenres]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameMusicGenre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Music genre created
 */
router.post('/', authMiddleware('Admin'), musicGenresController.addMusicGenre);

/**
 * @swagger
 * /music-genres/{id}:
 *   put:
 *     summary: Updates an existing music genre
 *     tags: [MusicGenres]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameMusicGenre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Music genre updated
 */
router.put('/:id', authMiddleware('Admin'), musicGenresController.updateMusicGenre);

/**
 * @swagger
 * /music-genres/{id}:
 *   delete:
 *     summary: Deletes a music genre
 *     tags: [MusicGenres]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gender eliminated
 */
router.delete('/:id', authMiddleware('Admin'), musicGenresController.deleteMusicGenre);

export default router;