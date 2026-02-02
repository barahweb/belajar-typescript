import { Router } from 'express';
import { ItemController } from '../controllers/item.controller';

const router = Router();

// CRUD Routes
router.get('/', ItemController.getAllItems);        // GET /items
// router.get('/search', ItemController.searchItems);  // GET /items/search?q=query
// router.get('/stats', ItemController.getStats);      // GET /items/stats
router.get('/:id', ItemController.getItemById);     // GET /items/:id
router.post('/', ItemController.createItem);        // POST /items
router.put('/:id', ItemController.updateItem);      // PUT /items/:id
// router.delete('/:id', ItemController.deleteItem);   // DELETE /items/:id

export default router;