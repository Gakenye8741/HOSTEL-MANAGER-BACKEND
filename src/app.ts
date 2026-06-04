import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import helmet from "helmet";
import compression from 'compression'; 
import hpp from 'hpp';
import AuthRouter from './Auth/Auth.routes';
import { logger } from './middlewares/logger';
import { authLimiter, globalLimiter } from './middlewares/RateLimiter';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Enable if running behind a reverse proxy (Nginx, Render, Railway, etc.)
app.set('trust proxy', 1);

// ==========================================
// 1. SECURITY & CORE MIDDLEWARE
// ==========================================

// Security: Helmet with explicit CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

// Security: Prevents HTTP Parameter Pollution attacks
app.use(hpp());

// Performance: Gzip compression
app.use(compression());

// Logging: Custom Logger
app.use(logger); 

// CORS: Strict configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
})); 

// Request Parsing with strict size limits
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security: Rate Limiting
app.use('/api/', globalLimiter); 
app.use('/api/auth', authLimiter);

// ==========================================
// 2. API ENDPOINTS
// ==========================================

// Pro Health Check
app.get('/health', async (req: Request, res: Response) => {
    // You can add a DB check here if desired
    const health = {
        service: "Hostel Manager 2026 API",
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };
    res.status(200).json(health);
});

app.use('/api/auth', AuthRouter);

// ==========================================
// 3. EXCEPTION HANDLING
// ==========================================

// Handle 404
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[Global-Error] ${err.stack}`);
    }
    
    res.status(500).json({ 
        success: false,
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'production' ? "An unexpected error occurred" : err.message
    });
});

// ==========================================
// 4. SERVER INITIALIZATION & SHUTDOWN
// ==========================================

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
    
    // Force close after 10s
    setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;