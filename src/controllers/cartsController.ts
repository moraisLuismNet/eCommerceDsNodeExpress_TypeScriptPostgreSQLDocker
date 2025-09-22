import { Request, Response } from 'express';
import * as cartService from "../services/cartService";

interface CartRequest extends Request {
    params: {
        email: string;
    };
}

async function disableCart(req: CartRequest, res: Response): Promise<Response> {
    try {
        const disabledCart = await cartService.disableCart(req.params.email);
        return res.json({ 
            success: true,
            message: `Cart for ${req.params.email} has been disabled`, 
            cart: disabledCart 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to disable cart';
        console.error('Error in disableCart:', error);
        return res.status(404).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

async function enableCart(req: CartRequest, res: Response): Promise<Response> {
    try {
        const enabledCart = await cartService.enableCart(req.params.email);
        return res.json({ 
            success: true,
            message: `Cart for ${req.params.email} has been enabled`, 
            cart: enabledCart 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to enable cart';
        console.error('Error in enableCart:', error);
        return res.status(404).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

async function getAllCarts(req: Request, res: Response): Promise<Response> {
    try {
        const carts = await cartService.getAllCarts();
        return res.json({ 
            success: true,
            count: carts.length,
            data: carts
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch carts';
        console.error('Error in getAllCarts:', error);
        return res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

async function getCartByEmail(req: Request, res: Response): Promise<Response> {
    // Decode the email from the URL (handles %40 for @, etc.)
    const email = decodeURIComponent(req.params.email);
    
    if (!email) {
        return res.status(400).json({ 
            success: false,
            message: 'Email is required' 
        });
    }

    try {
        const cart = await cartService.getCartByEmail(email);
        
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                message: 'No active cart found for this user' 
            });
        }

        return res.json({ 
            success: true,
            data: cart
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart';
        console.error('Error in getCartByEmail:', error);
        return res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

async function getCartStatus(req: Request, res: Response): Promise<Response> {
    try {
        const { email } = req.params;
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }
        
        const cartStatus = await cartService.getCartStatus(email);
        return res.json({ 
            success: true,
            data: cartStatus 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get cart status';
        console.error('Error in getCartStatus:', error);
        return res.status(500).json({ 
            success: false,
            message: errorMessage 
        });
    }
}

export { disableCart, enableCart, getAllCarts, getCartByEmail, getCartStatus };

export default { disableCart, enableCart, getAllCarts, getCartByEmail, getCartStatus };