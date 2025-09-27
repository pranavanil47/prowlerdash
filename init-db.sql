-- Initialize Prowler Database
-- This script ensures the database is ready for the application

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE prowler_db TO prowler_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO prowler_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO prowler_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO prowler_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prowler_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prowler_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO prowler_user;