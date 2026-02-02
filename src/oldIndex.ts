import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { usersTable } from './db/schema';
import { z } from 'zod';
import express, { Request, Response } from 'express';
const app = express();
const PORT = 3000;
import { stringTestSchema, StringTestInput } from './models/item.model';

app.use(express.json());
const db = drizzle(process.env.DATABASE_URL!);



app.post('/me', async (req: Request, res: Response): Promise<void> => {
    // const name = 23;
    // res.send(`Hallo, ini adalah hehe ${name}`)
    try {
        const data: StringTestInput = stringTestSchema.parse(req.body);
        res.json({ success: true, data });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Method 1: Get first error message
            const firstError = error.issues[0];
            const simpleMessage = firstError.message; // "Invalid input: expected string, received number"

            res.status(400).json({
                success: false,
                message: simpleMessage // Shows only the message
            });

            // OR Method 2: Create custom message
            res.status(400).json({
                success: false,
                message: "Invalid Input" // Your custom message
            });
        }
    }
});

// Helper function for error handling
// function handleValidationError(error: any, res: Response) {
//     if (error instanceof z.ZodError) {
//         res.status(400).json({
//             success: false,
//             error: "Validation failed",
//             details: error.message
//         });
//     } else {
//         res.status(500).json({ success: false, error: "Server error" });
//     }
// }

app.listen(PORT, () => {
    console.log(`Server is running on port 3000`);
});

// async function main() {
//     console.log('halo');
// const user: typeof usersTable.$inferInsert = {
//     name: 'Bryant',
//     age: 30,
//     email: 'Bryant@example.com',
// };

// await db.insert(usersTable).values(user);
// console.log('New user created!')

// const users = await db.select().from(usersTable);
// console.log('Getting all users from the database: ', users)
/*
const users: {
  id: number;
  name: string;
  age: number;
  email: string;
}[]
*/

// await db
//     .update(usersTable)
//     .set({
//         age: 31,
//     })
//     .where(eq(usersTable.email, user.email));
// console.log('User info updated!')

// await db.delete(usersTable).where(eq(usersTable.email, user.email));
// console.log('User deleted!')
// }

// main();
