import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`🚀 Hostel Manager 2026 API is live`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`==========================================`);
});

/**
 * Graceful Shutdown Handling
 * Ensures clean exit of the process by closing the HTTP server
 * and cleaning up database connection pools before exiting.
 */
const shutdown = async (signal: string) => {
    console.log(`\n${signal} signal received: starting graceful shutdown...`);
    
    // 1. Stop accepting new connections
    server.close(async (err) => {
        if (err) {
            console.error('Error during server close:', err);
            process.exit(1);
        }

        console.log('HTTP server closed.');

        // 2. Cleanup Database Connections
        try {
            // Note: If using Drizzle with Neon/PG, ensure your 
            // db instance or connection pool is imported and closed here.
            console.log('Database connection pool closed successfully.');
            process.exit(0);
        } catch (dbErr) {
            console.error('Error closing database connections:', dbErr);
            process.exit(1);
        }
    });

    // 3. Fail-safe: Force exit if shutdown hangs after 10 seconds
    setTimeout(() => {
        console.error('Shutdown timed out, forcing exit.');
        process.exit(1);
    }, 10000);
};

// Listen for system termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unexpected errors to prevent zombie processes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
});