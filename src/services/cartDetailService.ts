import { sequelize } from "../config/database";
import { QueryTypes } from "sequelize";

export interface CartDetail {
  IdCartDetail?: number;
  CartId: number;
  RecordId: number;
  Amount: number;
  Price: number;
}

export async function getCartDetailsByCartId(cartId: number): Promise<CartDetail[]> {
  try {
    console.log(`[getCartDetailsByCartId] Fetching cart details for cart ID: ${cartId}`);
    const results = await sequelize.query<CartDetail>(
      'SELECT * FROM "CartDetails" WHERE "CartId" = :cartId',
      {
        replacements: { cartId },
        type: QueryTypes.SELECT,
        plain: false
      }
    );
    
    // Ensure we always return an array, even if empty
    const cartDetails = Array.isArray(results) ? results : [];
    console.log(`[getCartDetailsByCartId] Found ${cartDetails.length} items for cart ${cartId}`, cartDetails);
    return cartDetails;
  } catch (error) {
    console.error(`[getCartDetailsByCartId] Error fetching cart details for cart ${cartId}:`, error);
    // Return empty array on error to prevent breaking the calling code
    return [];
  }
}

export async function getCartDetail(cartId: number, recordId: number): Promise<CartDetail | null> {
  const [results] = await sequelize.query(
    'SELECT * FROM "CartDetails" WHERE "CartId" = :cartId AND "RecordId" = :recordId',
    {
      replacements: { cartId, recordId },
      type: 'SELECT' as const
    }
  );
  return (results as CartDetail[])[0] || null;
}

export async function addCartDetail(cartDetail: Omit<CartDetail, 'IdCartDetail'>): Promise<CartDetail> {
  const { CartId, RecordId, Amount, Price } = cartDetail;
  
  const [results] = await sequelize.query(
    'INSERT INTO "CartDetails" ("CartId", "RecordId", "Amount", "Price") VALUES (:cartId, :recordId, :amount, :price) RETURNING "IdCartDetail"',
    {
      replacements: {
        cartId: CartId,
        recordId: RecordId,
        amount: Amount,
        price: Price
      },
      type: 'INSERT' as const
    }
  );
  
  const insertedId = (results as any)[0].IdCartDetail;
  return { IdCartDetail: insertedId, ...cartDetail };
}

export async function updateCartDetail(cartDetail: { IdCartDetail: number; Amount: number }): Promise<void> {
  await sequelize.query(
    'UPDATE "CartDetails" SET "Amount" = :amount WHERE "IdCartDetail" = :id',
    {
      replacements: {
        amount: cartDetail.Amount,
        id: cartDetail.IdCartDetail
      },
      type: 'UPDATE' as const
    }
  );
}

export async function removeFromCartDetail(cartDetail: { IdCartDetail: number }): Promise<void> {
  await sequelize.query(
    'DELETE FROM "CartDetails" WHERE "IdCartDetail" = :id',
    {
      replacements: { id: cartDetail.IdCartDetail },
      type: 'DELETE' as const
    }
  );
}

export async function removeAllDetailsFromCart(cartId: number): Promise<void> {
  await sequelize.query(
    'DELETE FROM "CartDetails" WHERE "CartId" = :cartId',
    {
      replacements: { cartId },
      type: 'DELETE' as const
    }
  );
}

export default {
  getCartDetailsByCartId,
  getCartDetail,
  addCartDetail,
  updateCartDetail,
  removeFromCartDetail,
  removeAllDetailsFromCart,
};
