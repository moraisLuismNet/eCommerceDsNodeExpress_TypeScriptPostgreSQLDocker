import { sequelize } from "../config/database";
import { Transaction, Op } from "sequelize";
import Cart, { ICartAttributes } from "../models/Cart";
import User from "../models/User";
import cartDetailService from "./cartDetailService";
import recordService from "./recordService";

// Re-exporting the model interface for external use
export { ICartAttributes };

export interface CartStatusDTO {
  Enabled: boolean;
}

/**
 * Gets the status of a user's most relevant cart.
 * @param email The user's email.
 * @returns The status of the cart.
 */
export async function getCartStatus(email: string): Promise<CartStatusDTO> {
  if (!email) throw new Error('Email is required');
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const cart = await Cart.findOne({ 
      where: { UserEmail: normalizedEmail },
      attributes: ['Enabled'],
    });
    return { Enabled: cart?.Enabled ?? false };
  } catch (error) {
    console.error('Error in getCartStatus:', error);
    throw new Error('Failed to get cart status');
  }
}

/**
 * Finds the active cart for a given user email.
 * @param email The user's email.
 * @param transaction The Sequelize transaction.
 * @returns The active cart instance or null.
 */
export async function getActiveCartByEmail(
  email: string,
  transaction?: Transaction
): Promise<Cart | null> {
  if (!email) throw new Error('Email is required');
  const normalizedEmail = email.trim().toLowerCase();

  try {
    return await Cart.findOne({
      where: {
        UserEmail: normalizedEmail,
        Enabled: true,
      },
      transaction,
    });
  } catch (error) {
    console.error(`[getActiveCartByEmail] Error getting cart for ${normalizedEmail}:`, error);
    throw error;
  }
}

/**
 * Finds a cart by its primary key.
 * @param id The cart ID.
 * @returns The cart instance or null.
 */
export async function getCartById(id: number): Promise<Cart | null> {
  try {
    return await Cart.findByPk(id);
  } catch (error) {
    console.error(`[getCartById] Error fetching cart with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new cart for a user if they don't already have an active one.
 * @param userEmail The user's email.
 * @param enabled The enabled state of the cart.
 * @param transaction The Sequelize transaction.
 * @returns The created or found cart instance.
 */
export async function createCart(
  userEmail: string,
  enabled = true,
  transaction?: Transaction
): Promise<Cart> {
  const normalizedEmail = userEmail.trim().toLowerCase();

  try {
    const [cart] = await Cart.findOrCreate({
      where: { 
        UserEmail: normalizedEmail,
        Enabled: true 
      },
      defaults: {
        UserEmail: normalizedEmail,
        TotalPrice: 0,
        Enabled: enabled,
      },
      transaction,
    });
    return cart;
  } catch (error) {
    console.error('Error creating or finding cart:', error);
    throw error;
  }
}

/**
 * Updates the total price of a cart by adding a given amount.
 * @param cartId The ID of the cart to update.
 * @param priceToAdd The amount to add to the total price.
 */
export async function updateCartTotalPrice(
  cartId: number,
  priceToAdd: number
): Promise<void> {
  try {
    const cart = await Cart.findByPk(cartId);
    if (!cart) throw new Error("Cart not found");

    await cart.increment('TotalPrice', { by: priceToAdd });
  } catch (error) {
    console.error(`Error updating total price for cart ${cartId}:`, error);
    throw error;
  }
}

/**
 * Disables a user's cart and returns stock for all items within it.
 * @param email The user's email.
 * @returns The ID of the disabled cart.
 */
export async function disableCart(email: string): Promise<number> {
  const cart = await getActiveCartByEmail(email);
  if (!cart) throw new Error("No active cart found for this user to disable");

  const t = await sequelize.transaction();
  try {
    const cartDetails = await cartDetailService.getCartDetailsByCartId(cart.IdCart, t);

    // Return stock for all items in the cart
    for (const detail of cartDetails) {
      await recordService.updateStock(detail.RecordId, detail.Amount, t);
    }

    // Disable the cart
    cart.Enabled = false;
    await cart.save({ transaction: t });

    await t.commit();
    return cart.IdCart;
  } catch (error) {
    await t.rollback();
    console.error(`Error disabling cart for ${email}:`, error);
    throw error;
  }
}

/**
 * Enables a previously disabled cart for a user.
 * @param email The user's email.
 * @returns The re-enabled cart instance.
 */
export async function enableCart(email: string): Promise<Cart> {
  const [affectedCount, affectedRows] = await Cart.update(
    { Enabled: true },
    {
      where: { UserEmail: email, Enabled: false },
      returning: true,
    }
  );

  if (affectedCount === 0 || !affectedRows[0]) {
    throw new Error("No disabled cart found for this user to enable");
  }

  return affectedRows[0];
}

/**
 * Retrieves all carts from the database.
 * @returns A promise that resolves to an array of carts.
 */
export async function getAllCarts(): Promise<Cart[]> {
  return Cart.findAll({ where: { Enabled: true }, order: [['IdCart', 'DESC']] });
}

export default {
  getActiveCartByEmail,
  getCartById,
  getCartStatus,
  createCart,
  getAllCarts,
  updateCartTotalPrice,
  disableCart,
  enableCart,
};