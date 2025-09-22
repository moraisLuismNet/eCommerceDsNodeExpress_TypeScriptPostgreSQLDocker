import { Request, Response } from 'express';
import orderService from "../services/orderService";
import cartService from "../services/cartService";
import cartDetailService from "../services/cartDetailService";

interface OrderRequest extends Request {
  params: {
    email?: string;
  };
  body: {
    status?: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

async function createOrderFromCart(req: OrderRequest, res: Response<ApiResponse<{ orderId: number }>>) {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    const cart = await cartService.getActiveCartByEmail(email);
    if (!cart || cart.TotalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or not found'
      });
    }

    const cartDetails = await cartDetailService.getCartDetailsByCartId(cart.IdCart);
    if (cartDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Create Order
    const order = await orderService.createOrder({
      UserEmail: email,
      OrderDate: new Date(),
      PaymentMethod: 'Credit Card',  
      Total: cart.TotalPrice,
      CartId: cart.IdCart          
    });

    // Create Order Details
    await Promise.all(cartDetails.map(detail => 
      orderService.createOrderDetail({
        OrderId: order.IdOrder,
        RecordId: detail.RecordId,
        Amount: detail.Amount,
        Price: detail.Price,
      })
    ));

    // Clear cart details and reset cart total price
    await Promise.all([
      cartDetailService.removeAllDetailsFromCart(cart.IdCart),
      cartService.updateCartTotalPrice(cart.IdCart, -cart.TotalPrice)
    ]);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { orderId: order.IdOrder }
    });
  } catch (error: unknown) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
      
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

async function getOrders(req: OrderRequest, res: Response<ApiResponse>) {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    const orders = await orderService.getOrdersByEmail(email);
    return res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders
    });
  } catch (error: unknown) {
    console.error(`Error getting orders for ${email}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
}

async function getAllOrders(_req: Request, res: Response<ApiResponse>) {
  try {
    const orders = await orderService.getAllOrders();
    return res.json({
      success: true,
      message: 'All orders retrieved successfully',
      data: orders
    });
  } catch (error: unknown) {
    console.error('Error getting all orders:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
      
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default {
  createOrderFromCart,
  getOrders,
  getAllOrders
};
