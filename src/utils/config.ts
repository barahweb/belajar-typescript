import 'dotenv/config';

const config = {
    jwtSecret: process.env.JWT_SECRET || 'secrettttt',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb',
}

export default config;

