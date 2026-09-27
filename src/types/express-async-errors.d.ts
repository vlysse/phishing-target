// express-async-errors ships no types; it patches Express's Router at import
// time so async route handlers that throw/reject are forwarded to Express's
// error-handling middleware instead of hanging the request.
declare module "express-async-errors";
