import { Order, IOrderAttributes, IOrderCreationAttributes } from '../models/Order';
import { OrderDetail, IOrderDetail, IOrderDetailCreationAttributes } from '../models/OrderDetail';
import { Transaction, Op } from 'sequelize';

export interface OrderWithDetails extends IOrderAttributes {
  OrderDetails?: IOrderDetail[];
}

export async function createOrder(orderData: IOrderCreationAttributes, transaction?: Transaction): Promise<Order> {
  return Order.create({
    UserEmail: orderData.UserEmail,
    OrderDate: orderData.OrderDate || new Date(),
    PaymentMethod: orderData.PaymentMethod || 'Credit Card',
    Total: orderData.Total,
    CartId: orderData.CartId
  }, { transaction });
}

export async function createOrderDetail(
  orderDetailData: Omit<IOrderDetailCreationAttributes, 'IdOrderDetail' | 'Order' | 'Record'>,
  transaction?: Transaction
): Promise<OrderDetail> {
  return OrderDetail.create({
    OrderId: orderDetailData.OrderId,
    RecordId: orderDetailData.RecordId,
    Amount: orderDetailData.Amount,
    Price: orderDetailData.Price
  }, { transaction });
}

export async function getOrdersByEmail(email: string): Promise<OrderWithDetails[]> {
  return Order.findAll({
    where: { UserEmail: email },
    order: [['OrderDate', 'DESC']],
    include: [{
      model: OrderDetail,
      as: 'OrderDetails'
    }]
  }) as unknown as Promise<OrderWithDetails[]>;
}

export async function getAllOrders(): Promise<OrderWithDetails[]> {
  try {
    console.log('Fetching all orders from database...');
    
    // First, get just the order IDs to see how many we have
    const orderIds = await Order.findAll({
      attributes: ['IdOrder'],
      order: [['OrderDate', 'DESC']],
      raw: true
    });
    
    console.log(`Found ${orderIds.length} order IDs in database`);
    
    // Now get the full orders with details
    const orders = await Order.findAll({
      order: [['OrderDate', 'DESC']],
      include: [{
        model: OrderDetail,
        as: 'OrderDetails',
        required: false // Use LEFT JOIN to include orders even without details
      }],
      logging: (sql) => {
        console.log('Executing SQL:', sql);
      }
    }) as unknown as OrderWithDetails[];
    
    console.log(`Retrieved ${orders.length} orders with details`);
    
    // Log the first few order IDs for comparison
    if (orders.length > 0) {
      const sampleSize = Math.min(5, orders.length);
      console.log(`Sample of ${sampleSize} order IDs from full query:`);
      for (let i = 0; i < sampleSize; i++) {
        console.log(`- Order ${i+1}: ID=${orders[i].IdOrder}, Email=${orders[i].UserEmail}, Date=${orders[i].OrderDate}`);
      }
    }
    
    return orders;
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    throw error;
  }
}

export async function createOrderWithDetails(
  orderData: IOrderCreationAttributes,
  orderDetails: Array<Omit<IOrderDetailCreationAttributes, 'IdOrderDetail' | 'OrderId' | 'Order' | 'Record'>>,
  transaction?: Transaction
): Promise<Order> {
  let createdTransaction = false;
  let t = transaction;
  
  try {
    if (!t) {
      t = await Order.sequelize!.transaction();
      createdTransaction = true;
    }

    // Create the order
    const order = await createOrder(orderData, t);
    
    // Create all order details
    const orderDetailPromises = orderDetails.map(detail => 
      createOrderDetail({
        ...detail,
        OrderId: order.IdOrder
      } as IOrderDetailCreationAttributes, t)
    );
    
    await Promise.all(orderDetailPromises);
    
    if (createdTransaction) {
      await t.commit();
    }
    
    // Return the order with its details
    return order.reload({
      include: [{
        model: OrderDetail,
        as: 'OrderDetails'
      }],
      transaction: t
    });
  } catch (error) {
    if (createdTransaction && t) {
      await t.rollback();
    }
    throw error;
  }
}

export default {
  createOrder,
  createOrderDetail,
  createOrderWithDetails,
  getOrdersByEmail,
  getAllOrders,
};
