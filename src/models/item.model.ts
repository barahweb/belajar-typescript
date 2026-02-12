import { z } from 'zod';

// Validation schema for Item
export const itemSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters"),

    description: z.string()
        .min(5, "Description must be at least 5 characters")
        .max(500, "Description must be less than 500 characters")
        .optional(),

    price: z.coerce.number()  // Convert string to number
        .positive("Price must be positive")
        .max(1000000, "Price is too high"),

    quantity: z.coerce.number()
        .int("Quantity must be integer")
        .min(0, "Quantity cannot be negative")
        .default(0),

    category: z.enum(["electronics", "clothing", "books", "other"])
        .default("other"),

    // createdAt: z.date(),
    // updatedAt: z.date()
});

// TypeScript type from Zod schema
export type Item = z.infer<typeof itemSchema> & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
};

// Type for creating item (without id and timestamps)
export type CreateItemDto = z.infer<typeof itemSchema>;

// Type for updating item (all fields optional)
export type UpdateItemDto = Partial<CreateItemDto>;
