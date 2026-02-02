import { integer, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { getWIBTime } from '../utils/dateUtils';

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    age: integer().notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
});

export const productsTable = pgTable("products", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    price: integer().notNull(),
    quantity: integer().notNull(),
    category: varchar({ length: 100 }).notNull(),
    createdAt: timestamp('created_at')
        .$defaultFn(() => getWIBTime()),

    updatedAt: timestamp('updated_at')
        .$defaultFn(() => getWIBTime())
        .$onUpdate(() => getWIBTime()),
});