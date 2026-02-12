import express, { Request, Response, NextFunction } from 'express';

import itemRoutes from './routes/item.routes';
import authRoutes from './routes/auth.routes';
import { drizzle } from 'drizzle-orm/node-postgres';
const db = drizzle(process.env.DATABASE_URL!);
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Root route - API Documentation
app.get('/', (req: Request, res: Response) => {
    // console.log('halo');
    res.json({
        message: '🛒 Simple CRUD API',
        version: '1.0.0',
        endpoints: {
            items: {
                'GET /api/items': 'Get all items',
                'GET /api/items/search?q=query': 'Search items',
                'GET /api/items/stats': 'Get statistics',
                'GET /api/items/:id': 'Get single item',
                'POST /api/items': 'Create new item',
                'PUT /api/items/:id': 'Update item',
                'DELETE /api/items/:id': 'Delete item'
            }
        },
        examples: {
            createItem: {
                method: 'POST',
                url: '/api/items',
                body: {
                    name: 'New Product',
                    description: 'Product description',
                    price: 99.99,
                    quantity: 10,
                    category: 'electronics'
                }
            }
        }
    });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});


// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`
  🚀 CRUD API Server Started!
  
  📍 Local:    http://localhost:${PORT}
  📍 Network:  http://YOUR_IP:${PORT}
  
  📋 API Documentation: http://localhost:${PORT}
  `);
});

export default app;