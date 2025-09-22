import { Request, Response } from 'express';
import { sequelize } from '../config/database';
import cartDetailService from "../services/cartDetailService";
import * as cartService from "../services/cartService";
import recordService from "../services/recordService";
import userService from "../services/userService";
import groupService from "../services/groupService";
import { IUserAttributes } from '../models/User';
import { IRecordAttributes } from '../models/Record';
import { UserPayload } from '../middleware/authMiddleware';

interface CartItemResponse {
  idCartDetail: number;
  imageRecord: string;
  cartId: number;
  recordId: number;
  titleRecord: string;
  groupName: string;
  amount: number;
  price: number;
  total: number;
}

interface CartResponse {
  items: CartItemResponse[];
  totalPrice: number;
  message?: string;
}

interface AddToCartRequest extends Request {
  body: {
    recordId: number;
    amount: number;
  };
  params: {
    email: string;
  };
  user?: UserPayload;
}

interface RemoveFromCartRequest extends Request {
  body: {
    recordId: number;
    amount: number;
  };
  params: {
    email: string;
  };
  user?: UserPayload;
}

async function getCartDetails(req: Request, res: Response): Promise<Response> {
  console.log('[getCartDetails] Starting request processing');
  const { email } = req.params;
  console.log(`[getCartDetails] Request received for email: ${email}`);
  
  try {
    // Find user by email
    const user = await userService.findUserByEmail(email) as IUserAttributes | null;
    
    if (!user) {
      console.error(`[getCartDetails] User not found: ${email}`);
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if user is admin
    if (user.role === 'Admin') {
      return res.status(200).json({
        items: [],
        totalPrice: 0,
        message: "Administrators don't have shopping carts",
        code: 'ADMIN_NO_CART'
      });
    }

    // Get user's cart
    const cart = await cartService.getActiveCartByEmail(email);
    
    if (!cart) {
      console.log(`[getCartDetails] No cart found for: ${email}`);
      return res.status(200).json([]);
    }

    // Get cart details
    const cartDetails = await cartDetailService.getCartDetailsByCartId(cart.IdCart);

    // Prepare response with record information
    const detailsWithRecordInfo = [];
    
    for (const detail of cartDetails) {
      try {
        // Get record information for each cart item
        const record = await recordService.getById(detail.RecordId) as IRecordAttributes | null;
        
        if (!record) {
          console.warn(`[getCartDetails] Record ${detail.RecordId} not found, skipping`);
          continue;
        }
        
        // Get group name if needed
        let groupName = '';
        if (record.GroupId) {
          const group = await groupService.getById(record.GroupId);
          groupName = group?.NameGroup || '';
        }
        
        // Create cart item with record details
        detailsWithRecordInfo.push({
          idCartDetail: detail.IdCartDetail || 0,
          imageRecord: record.ImageRecord || '',
          cartId: detail.CartId,
          recordId: detail.RecordId,
          titleRecord: record.TitleRecord,
          groupName: groupName,
          amount: detail.Amount,
          price: parseFloat(detail.Price.toString()),
          total: parseFloat(detail.Price.toString()) * detail.Amount
        });
        
      } catch (error) {
        console.error(`[getCartDetails] Error processing cart detail ${detail.IdCartDetail}:`, error);
        // Continue with other items if one fails
        continue;
      }
    }
    
    // Return the array of cart items with record details
    return res.json(detailsWithRecordInfo);
    
  } catch (error) {
    console.error('[getCartDetails] Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ 
      message: 'An error occurred while processing your request',
      code: 'SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage })
    });
  }
}

async function addToCart(req: AddToCartRequest, res: Response): Promise<Response> {
  const { email } = req.params;
  const { recordId, amount } = req.body;
  const transaction = await sequelize.transaction();

  try {
    // Input validation
    if (!email || !recordId || amount === undefined) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Amount must be a number greater than 0' });
    }
    
    // Check if user is authenticated
    if (!req.user) {
      await transaction.rollback();
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    
    // Verify that the authenticated user matches the requested email
    if (req.user.email.toLowerCase() !== email.toLowerCase() && req.user.role !== 'Admin') {
      await transaction.rollback();
      return res.status(403).json({ message: 'You are not authorized to modify this cart' });
    }

    // Get record with lock to prevent race conditions
    const record = await sequelize.query(
      'SELECT * FROM "Records" WHERE "IdRecord" = :recordId FOR UPDATE',
      {
        replacements: { recordId },
        type: 'SELECT' as const,
        transaction
      }
    ) as any;
    
    const recordData = record[0] as IRecordAttributes;
    
    if (!recordData) {
      await transaction.rollback();
      return res.status(404).json({ message: "Record not found" });
    }
    
    if (recordData.Stock < parsedAmount) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "Not enough stock",
        availableStock: recordData.Stock
      });
    }

    // Check if cart exists, if not create one
    let cart;
    try {
      // First try to get existing cart
      const [cartResults] = await sequelize.query(
        'SELECT * FROM "Carts" WHERE LOWER(TRIM("UserEmail")) = :email AND "Enabled" = true FOR UPDATE',
        {
          replacements: { email: email.toLowerCase() },
          type: 'SELECT' as const,
          transaction
        }
      ) as any[];
      
      cart = cartResults;
      
      // If no cart exists, create one
      if (!cart) {
        try {
          const [createdCart] = await sequelize.query(
            'INSERT INTO "Carts" ("UserEmail", "TotalPrice", "Enabled") VALUES (:email, 0, true) ON CONFLICT ("UserEmail") DO UPDATE SET "Enabled" = true RETURNING *',
            {
              replacements: { email: email.toLowerCase() },
              type: 'INSERT' as const,
              transaction
            }
          ) as any[];
          
          cart = createdCart[0];
          console.log(`Created new cart for user ${email}:`, cart);
        } catch (error: any) {
          // If we get a unique constraint error, it means another request created the cart
          if (error.name === 'SequelizeUniqueConstraintError' || error.original?.code === '23505') {
            // Try to get the cart again
            const [existingCart] = await sequelize.query(
              'SELECT * FROM "Carts" WHERE LOWER(TRIM("UserEmail")) = :email AND "Enabled" = true FOR UPDATE',
              {
                replacements: { email: email.toLowerCase() },
                type: 'SELECT' as const,
                transaction
              }
            ) as any[];
            
            if (!existingCart) {
              throw new Error('Failed to create or find cart after unique constraint violation');
            }
            
            cart = existingCart;
          } else {
            throw error;
          }
        }
      }

    } catch (error: any) {
      console.error(`Error getting or creating cart for user ${email}:`, error);
      await transaction.rollback();
      return res.status(500).json({ 
        message: "We encountered an issue with your cart. Please try again later.",
        ...(process.env.NODE_ENV === 'development' && { 
          error: error instanceof Error ? error.message : String(error) 
        })
      });
    }

    // Check if item already in cart
    const [existingCartItem] = await sequelize.query(
      'SELECT * FROM "CartDetails" WHERE "CartId" = :cartId AND "RecordId" = :recordId FOR UPDATE',
      {
        replacements: { cartId: cart.IdCart, recordId },
        type: 'SELECT' as const,
        transaction
      }
    ) as any[];

    if (existingCartItem) {
      // Update existing cart item
      const newAmount = existingCartItem.Amount + parsedAmount;
      await sequelize.query(
        'UPDATE "CartDetails" SET "Amount" = :newAmount WHERE "IdCartDetail" = :id',
        {
          replacements: { newAmount, id: existingCartItem.IdCartDetail },
          type: 'UPDATE' as const,
          transaction
        }
      );
    } else {
      // Add new item to cart
      await sequelize.query(
        'INSERT INTO "CartDetails" ("CartId", "RecordId", "Amount", "Price") VALUES (:cartId, :recordId, :amount, :price)',
        {
          replacements: {
            cartId: cart.IdCart,
            recordId,
            amount: parsedAmount,
            price: recordData.Price
          },
          type: 'INSERT' as const,
          transaction
        }
      );
    }
    
    // Update stock
    await sequelize.query(
      'UPDATE "Records" SET "Stock" = "Stock" - :amount WHERE "IdRecord" = :recordId',
      {
        replacements: { amount: parsedAmount, recordId },
        type: 'UPDATE' as const,
        transaction
      }
    );

    // Update cart total
    const priceToAdd = recordData.Price * parsedAmount;
    await sequelize.query(
      'UPDATE "Carts" SET "TotalPrice" = "TotalPrice" + :priceToAdd WHERE "IdCart" = :cartId',
      {
        replacements: { priceToAdd, cartId: cart.IdCart },
        type: 'UPDATE' as const,
        transaction
      }
    );
    
    // Commit the transaction
    await transaction.commit();
    
    // Get updated record info
    const [updatedRecord] = await sequelize.query(
      'SELECT "Stock" FROM "Records" WHERE "IdRecord" = :recordId',
      {
        replacements: { recordId },
        type: 'SELECT' as const
      }
    ) as any[];
    
    return res.json({ 
      success: true,
      message: "Item added to cart", 
      updatedStock: updatedRecord.Stock,
      cartId: cart.IdCart
    });
    
  } catch (error: unknown) {
    console.error('Error in addToCart:', error);
    
    // Rollback transaction if it hasn't been committed
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ 
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage })
    });
  }
}

async function removeFromCart(req: RemoveFromCartRequest, res: Response): Promise<Response> {
  const { email } = req.params;
  const { recordId, amount } = req.body;
  const transaction = await sequelize.transaction();

  try {
    // Input validation
    if (!email || !recordId || amount === undefined) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Amount must be a number greater than 0' });
    }
    
    // Check if user is authenticated
    if (!req.user) {
      await transaction.rollback();
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    
    // Verify that the authenticated user matches the requested email
    if (req.user.email.toLowerCase() !== email.toLowerCase() && req.user.role !== 'Admin') {
      await transaction.rollback();
      return res.status(403).json({ message: 'You are not authorized to modify this cart' });
    }

    // Get cart with lock
    const [cartResults] = await sequelize.query(
      'SELECT * FROM "Carts" WHERE LOWER(TRIM("UserEmail")) = :email AND "Enabled" = true FOR UPDATE',
      {
        replacements: { email: email.toLowerCase() },
        type: 'SELECT' as const,
        transaction
      }
    ) as any[];
    
    let cart = cartResults as any;
    
    if (!cart) {
      // If no active cart, create one
      try {
        cart = await cartService.createCart(email, true, transaction);
        console.log(`Created new cart for user ${email}:`, cart);
      } catch (error) {
        console.error(`Error creating cart for user ${email}:`, error);
        await transaction.rollback();
        return res.status(500).json({ 
          message: "We encountered an issue creating your cart. Please try again later.",
          ...(process.env.NODE_ENV === 'development' && { 
            error: error instanceof Error ? error.message : String(error) 
          })
        });
      }
    }

    // Get cart item with lock
    const cartItemResults = await sequelize.query(
      'SELECT * FROM "CartDetails" WHERE "CartId" = :cartId AND "RecordId" = :recordId FOR UPDATE',
      {
        replacements: { cartId: cart.IdCart, recordId },
        type: 'SELECT' as const,
        transaction
      }
    ) as any;
    
    const cartDetail = cartItemResults[0];
    
    if (!cartDetail) {
      await transaction.rollback();
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (cartDetail.Amount < parsedAmount) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "Cannot remove more items than are in the cart",
        currentAmount: cartDetail.Amount
      });
    }

    const newAmount = cartDetail.Amount - parsedAmount;
    const priceToDeduct = cartDetail.Price * parsedAmount;

    if (newAmount === 0) {
      // Remove item from cart
      await sequelize.query(
        'DELETE FROM "CartDetails" WHERE "IdCartDetail" = :id',
        {
          replacements: { id: cartDetail.IdCartDetail },
          type: 'DELETE' as const,
          transaction
        }
      );
    } else {
      // Update item quantity
      await sequelize.query(
        'UPDATE "CartDetails" SET "Amount" = :amount WHERE "IdCartDetail" = :id',
        {
          replacements: { amount: newAmount, id: cartDetail.IdCartDetail },
          type: 'UPDATE' as const,
          transaction
        }
      );
    }

    // Update stock
    await sequelize.query(
      'UPDATE "Records" SET "Stock" = "Stock" + :amount WHERE "IdRecord" = :recordId',
      {
        replacements: { amount: parsedAmount, recordId },
        type: 'UPDATE' as const,
        transaction
      }
    );

    // Update cart total
    await sequelize.query(
      'UPDATE "Carts" SET "TotalPrice" = "TotalPrice" - :priceToDeduct WHERE "IdCart" = :cartId',
      {
        replacements: { priceToDeduct, cartId: cart.IdCart },
        type: 'UPDATE' as const,
        transaction
      }
    );
    
    // Commit the transaction
    await transaction.commit();
    
    // Get updated record info
    const [updatedRecord] = await sequelize.query(
      'SELECT "Stock" FROM "Records" WHERE "IdRecord" = :recordId',
      {
        replacements: { recordId },
        type: 'SELECT' as const
      }
    ) as any[];
    
    return res.json({ 
      success: true,
      message: "Item removed from cart", 
      updatedStock: updatedRecord.Stock,
      remainingInCart: newAmount > 0 ? newAmount : 0
    });
    
  } catch (error: any) {
    console.error('Error in removeFromCart:', error);
    
    // Rollback transaction if it hasn't been committed
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    const errorMessage = error?.message || 'An unknown error occurred';
    return res.status(500).json({ 
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { 
        error: errorMessage,
        ...(error?.code && { code: error.code })
      })
    });
  }
}

export { getCartDetails, addToCart, removeFromCart };