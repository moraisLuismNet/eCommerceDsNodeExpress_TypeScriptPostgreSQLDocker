import { sequelize } from "../config/database";
import bcrypt from "bcryptjs";
import * as cartService from "./cartService";
import User, { IUserAttributes } from "../models/User";
import { Transaction } from "sequelize";

export interface UserInsertDTO {
  email: string;
  password: string;
  role?: "Admin" | "User";
}

/**
 * Finds a user by their email address, including sensitive data like the password.
 * @param email The email of the user to find.
 * @returns A Promise that resolves to the user attributes or undefined if not found.
 */
export async function findUserByEmail(
  email: string
): Promise<IUserAttributes | undefined> {
  try {
    // Use unscoped to bypass the default scope that excludes the password.
    const user = await User.unscoped().findOne({ where: { email } });
    return user?.get({ plain: true });
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw new Error("Failed to find user by email.");
  }
}

/**
 * Creates a new user and their associated cart within a transaction.
 * @param userInsertDTO The data for the new user.
 * @returns A Promise that resolves to the newly created user's attributes.
 */
export async function createUser(
  userInsertDTO: UserInsertDTO
): Promise<IUserAttributes> {
  if (!userInsertDTO.email || !userInsertDTO.password) {
    throw new Error("Email and password are required");
  }

  const t = await sequelize.transaction();

  try {
    const { email, password, role = 'User' } = userInsertDTO;
    const normalizedEmail = email.trim().toLowerCase();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await User.create(
      {
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
      { transaction: t }
    );

    // Create a cart for the new user
    const cart = await cartService.createCart(normalizedEmail, true, t);
    if (!cart || !cart.IdCart) {
      throw new Error("Failed to create a cart for the user.");
    }

    // Update the user with the new cartId
    newUser.cartId = cart.IdCart;
    await newUser.save({ transaction: t });

    // Commit the transaction
    await t.commit();

    // Return a plain object, excluding the password by default
    return newUser.get({ plain: true });

  } catch (error) {
    // Rollback the transaction in case of any error
    await t.rollback();
    console.error('Error in createUser:', error);
    // Re-throw the original error to be handled by the controller
    throw error;
  }
}

/**
 * Retrieves all users from the database.
 * @returns A Promise that resolves to an array of user objects.
 */
export async function getAllUsers(): Promise<IUserAttributes[]> {
  try {
    // The default scope on the User model excludes the password, which is correct here.
    const users = await User.findAll();
    return users.map(user => user.get({ plain: true }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch users");
  }
}

/**
 * Deletes a user and their associated orders.
 * @param email The email of the user to delete.
 * @returns A Promise that resolves to true if the user was deleted, false otherwise.
 */
export async function deleteUser(email: string): Promise<boolean> {
  if (!email) {
    throw new Error("Email is required");
  }

  const t = await sequelize.transaction();

  try {
    const user = await User.findOne({ where: { email }, transaction: t });

    if (!user) {
      await t.rollback();
      return false;
    }

    // It's better to handle this with proper associations and hooks in the long run,
    // but for now, we keep the raw query to delete related orders.
    await sequelize.query('DELETE FROM "Orders" WHERE "UserEmail" = :email', {
      replacements: { email },
      type: "DELETE",
      transaction: t,
    });

    // Delete the user using the model instance
    await user.destroy({ transaction: t });

    await t.commit();
    return true;

  } catch (error) {
    await t.rollback();
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
}

export default {
  findUserByEmail,
  createUser,
  getAllUsers,
  deleteUser,
};