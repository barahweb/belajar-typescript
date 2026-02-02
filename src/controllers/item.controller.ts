import 'dotenv/config';
import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { drizzle } from 'drizzle-orm/node-postgres';
import { desc, eq, asc } from 'drizzle-orm';
import { productsTable, usersTable } from '../db/schema';

const db = drizzle(process.env.DATABASE_URL!);

import {
    itemSchema,
    Item,
    CreateItemDto,
    UpdateItemDto,
} from '../models/item.model';

export class ItemController {
    // GET /items - Get all items
    static async getAllItems(req: Request, res: Response): Promise<Response> {

        try {
            const allItems = await db.select()
                .from(productsTable)
                .orderBy(desc(productsTable.id));

            return res.json({
                success: true,
                count: allItems.length,
                data: allItems
            });

        } catch (error) {
            console.error('Get items error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch items'
            });
        }
    }

    // GET /items/:id - Get single item
    static async getItemById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const getItem = await db.select()
                .from(productsTable)
                .where(eq(productsTable.id, Number(id)))
                .limit(1);

            if (getItem.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: `Item with id ${id} not found`
                });
            }

            return res.json({
                success: true,
                data: getItem
            });

        } catch (error) {
            console.error('Get item error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch item'
            });
        }
    }

    // POST /items - Create new item
    static async createItem(req: Request, res: Response): Promise<Response> {
        try {
            // Validate request body
            const validatedData: CreateItemDto = itemSchema.parse(req.body);

            // Create new item
            const newItem = await db.insert(productsTable).values({
                ...validatedData
            }).returning();

            return res.status(201).json({
                success: true,
                message: 'Item created successfully',
                data: newItem
            });

        } catch (error) {
            if (error instanceof ZodError) {
                // Validation error
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }

            console.error('Create item error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create item'
            });
        }
    }

    // PUT /items/:id - Update item
    static async updateItem(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const updateData: UpdateItemDto = req.body;
            // Validate update data (partial validation)

            const updateSchema = itemSchema.partial();
            const validatedData = updateSchema.parse(updateData);

            // Find item index
            const [updatedItem] = await db.update(productsTable)
                .set({
                    ...validatedData,
                })
                .where(eq(productsTable.id, Number(id)))
                .returning();

            if (!updatedItem) {
                return res.status(404).json({
                    success: false,
                    error: `Item with id ${id} not found`
                });
            }

            return res.json({
                success: true,
                message: 'Item updated successfully',
                data: updatedItem
            });

        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues
                });
            }

            console.error('Update item error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update item'
            });
        }
    }

    // // DELETE /items/:id - Delete item
    // static deleteItem(req: Request, res: Response): Response {
    //     try {
    //         const { id } = req.params;

    //         const itemIndex = items.findIndex(i => i.id === id);

    //         if (itemIndex === -1) {
    //             return res.status(404).json({
    //                 success: false,
    //                 error: `Item with id ${id} not found`
    //             });
    //         }

    //         // Remove item from array
    //         const [deletedItem] = items.splice(itemIndex, 1);

    //         return res.json({
    //             success: true,
    //             message: 'Item deleted successfully',
    //             data: deletedItem
    //         });

    //     } catch (error) {
    //         console.error('Delete item error:', error);
    //         return res.status(500).json({
    //             success: false,
    //             error: 'Failed to delete item'
    //         });
    //     }
    // }

    // // GET /items/search?q= - Search items
    // static searchItems(req: Request, res: Response): Response {
    //     try {
    //         const { q } = req.query;

    //         if (!q || typeof q !== 'string') {
    //             return res.status(400).json({
    //                 success: false,
    //                 error: 'Search query is required'
    //             });
    //         }

    //         const searchTerm = q.toLowerCase();
    //         const results = items.filter(item =>
    //             item.name.toLowerCase().includes(searchTerm) ||
    //             item.description?.toLowerCase().includes(searchTerm)
    //         );

    //         return res.json({
    //             success: true,
    //             count: results.length,
    //             query: searchTerm,
    //             data: results
    //         });
    //     } catch (error) {
    //         console.error('Search error:', error);
    //         return res.status(500).json({
    //             success: false,
    //             error: 'Search failed'
    //         });
    //     }
    // }

    // // GET /items/stats - Get statistics
    // static getStats(req: Request, res: Response): Response {
    //     try {
    //         const totalItems = items.length;
    //         const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    //         const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    //         // Group by category
    //         const byCategory = items.reduce((acc, item) => {
    //             acc[item.category] = (acc[item.category] || 0) + 1;
    //             return acc;
    //         }, {} as Record<string, number>);

    //         // Most expensive item
    //         const mostExpensive = items.reduce((max, item) =>
    //             item.price > max.price ? item : max
    //             , items[0]);

    //         // Cheapest item
    //         const cheapest = items.reduce((min, item) =>
    //             item.price < min.price ? item : min
    //             , items[0]);

    //         return res.json({
    //             success: true,
    //             data: {
    //                 totalItems,
    //                 totalValue: parseFloat(totalValue.toFixed(2)),
    //                 totalQuantity,
    //                 averagePrice: parseFloat((totalValue / totalItems).toFixed(2)),
    //                 byCategory,
    //                 mostExpensive: {
    //                     name: mostExpensive.name,
    //                     price: mostExpensive.price
    //                 },
    //                 cheapest: {
    //                     name: cheapest.name,
    //                     price: cheapest.price
    //                 }
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Stats error:', error);
    //         return res.status(500).json({
    //             success: false,
    //             error: 'Failed to get statistics'
    //         });
    //     }
    // }
}