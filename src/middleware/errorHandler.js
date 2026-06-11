// Global error handler — catches any unhandled errors in route handlers
// Spring equivalent: @ControllerAdvice + @ExceptionHandler(Exception.class)
//
// Express identifies this as an error handler because it has 4 parameters (err, req, res, next)
// Regular middleware has 3 (req, res, next). The extra 'err' parameter is the signal.
//
// This MUST be registered LAST in app.js (after all routes).
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    console.error('Stack:', err.stack);

    // MongoDB connection errors
    if (err.message === 'Storage backend unreachable') {
        return res.status(503).json({
            error: 'Storage service is currently unavailable. Please try again later.'
        });
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Everything else — generic 500
    res.status(500).json({
        error: 'Internal server error'
    });
};

module.exports = errorHandler;
