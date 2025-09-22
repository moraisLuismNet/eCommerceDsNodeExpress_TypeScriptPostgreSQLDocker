import { Order } from './Order';
import { OrderDetail } from './OrderDetail';
import User from './User';
import Cart from './Cart';

// Define associations
export function setupAssociations() {
    // Order has many OrderDetails
    Order.hasMany(OrderDetail, {
        foreignKey: 'OrderId',
        as: 'OrderDetails',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    // OrderDetail belongs to Order
    OrderDetail.belongsTo(Order, {
        foreignKey: 'OrderId',
        as: 'Order'
    });

    // User has one Cart
    User.hasOne(Cart, {
        foreignKey: 'CartId',
        as: 'Cart',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    });

    // Cart belongs to User
    Cart.belongsTo(User, {
        foreignKey: 'UserEmail',
        as: 'User',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    console.log('Model associations have been set up');
}
