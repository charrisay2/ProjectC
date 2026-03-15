import express from 'express';
import { getResources, createResource, deleteResource, updateResource } from '../controllers/resourceController.ts';

const router = express.Router();

router.get('/', getResources);
router.post('/', createResource);
router.put('/:id', updateResource);
router.delete('/:id', deleteResource);

export default router;
