import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface UserPayload extends JwtPayload {
  email: string; 
  role: string; 
  cartId: number; 
  iat: number; // issue date
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

function authMiddleware(roles: string | string[] = []): RequestHandler {
  // Convert single role to array if needed
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ) => {
    try {
      // Get token from Authorization header or cookies
      let token: string | undefined;
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else {
        // Try to get token from cookies
        const cookies = req.headers.cookie;
        if (cookies) {
          const tokenCookie = cookies
            .split(";")
            .find((cookie) => cookie.trim().startsWith("token="));
          if (tokenCookie) {
            token = tokenCookie.split("=")[1];
            console.log(
              "Token from cookies:",
              token ? "[TOKEN_PRESENT]" : "NO_TOKEN"
            );
          }
        }
      }

      if (!token) {
        console.log("No valid Bearer token found in headers or cookies");
        return res.status(401).json({
          success: false,
          message:
            "No authentication token provided. Please use Bearer token in Authorization header or login first.",
        });
      }

      if (!process.env.JWT_KEY) {
        console.error("JWT_KEY is not defined in environment variables");
        return res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
      }

      // Verify token
      let decoded: UserPayload;
      try {
        decoded = jwt.verify(token, process.env.JWT_KEY!) as UserPayload;

        // Attach user to request
        req.user = decoded;

        // Check role authorization
        if (roleArray.length > 0 && !roleArray.includes(decoded.role)) {
          console.log("Access denied: Role not authorized");
          return res.status(403).json({
            success: false,
            message: "Forbidden: Insufficient permissions",
          });
        }

        next();
        return;
      } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);

      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          error: "TOKEN_EXPIRED",
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
          error: "INVALID_TOKEN",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Authentication failed",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  };
}

export default authMiddleware;
