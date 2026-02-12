import { integer, pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { getWIBTime } from '../utils/dateUtils';
import { relations } from "drizzle-orm";

const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar('password').notNull(),

    // Optional fields
    role: varchar('role', { length: 20 }).default('user'), // 'admin', 'user'
    isActive: boolean('is_active').default(true),
    lastLogin: timestamp('last_login'),
    refreshToken: varchar('refresh_token', { length: 500 }),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

const productsTable = pgTable("products", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    price: integer().notNull(),
    quantity: integer().notNull(),
    category: varchar({ length: 100 }).notNull(),
    isDeleted: boolean('is_deleted').default(false),

    createdAt: timestamp('created_at')
        .$defaultFn(() => getWIBTime()),

    updatedAt: timestamp('updated_at')
        .$defaultFn(() => getWIBTime())
        .$onUpdate(() => getWIBTime()),

    deletedAt: timestamp('deleted_at'),
});

const productsImagesTable = pgTable("product_images", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer().notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
    filename: varchar({ length: 255 }).notNull(),
    originalName: varchar({ length: 255 }).notNull(),
    path: varchar({ length: 500 }).notNull(),
    url: varchar({ length: 500 }).notNull(),
    size: integer().notNull(),
    mimeType: varchar({ length: 100 }).notNull(),
    createdAt: timestamp('created_at')
        .$defaultFn(() => getWIBTime()),

    updatedAt: timestamp('updated_at')
        .$defaultFn(() => getWIBTime())
        .$onUpdate(() => getWIBTime()),

    deletedAt: timestamp('deleted_at'),
});


export const productImagesRelations = relations(productsImagesTable, ({ one }) => ({
    product: one(productsTable, {
        fields: [productsImagesTable.productId],
        references: [productsTable.id],
    }),
}));


export {
    usersTable,
    productsTable,
    productsImagesTable
}