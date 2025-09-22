import { Request, Response } from "express";
import userService from "../services/userService";

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface UserRequest extends Request {
  params: {
    email?: string;
  };
}

async function getUsers(
  req: Request,
  res: Response<ApiResponse>
): Promise<Response<ApiResponse>> {
  try {
    const users = await userService.getAllUsers();
    console.log('Sending users response:', {
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

async function deleteUser(
  req: UserRequest,
  res: Response<ApiResponse>
): Promise<Response<ApiResponse>> {
  try {
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required",
      });
    }

    await userService.deleteUser(email);
    // Response idempotent: 204 even if the user doesn't exist
    return res.status(204).send();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

export default {
  getUsers,
  deleteUser,
};
