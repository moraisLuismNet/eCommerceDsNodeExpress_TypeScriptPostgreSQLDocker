CREATE TYPE "enum_Users_role" AS ENUM ('User', 'Admin');

CREATE TABLE IF NOT EXISTS "Users" (
    "Email" VARCHAR(255) PRIMARY KEY,
    "Password" VARCHAR(255) NOT NULL,
    "Role" "enum_Users_role" NOT NULL DEFAULT 'User',
    "CartId" INTEGER
);