import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface IOrderAttributes {
    IdOrder: number;
    OrderDate: Date;
    PaymentMethod: string;
    Total: number;
    UserEmail: string;
    CartId: number;
    OrderDetails?: any[]; // For association with OrderDetail
}

export interface IOrderCreationAttributes extends Optional<IOrderAttributes, 'IdOrder'> {}

export class Order extends Model<IOrderAttributes, IOrderCreationAttributes> implements IOrderAttributes {
    public IdOrder!: number;
    public OrderDate!: Date;
    public PaymentMethod!: string;
    public Total!: number;
    public UserEmail!: string;
    public CartId!: number;

    // For associations
    public readonly OrderDetails?: any[];
}

Order.init(
    {
        IdOrder: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        OrderDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        PaymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Credit Card',
        },
        Total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        UserEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'Email',
            },
        },
        CartId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Carts',
                key: 'IdCart',
            },
        },
    },
    {
        sequelize,
        tableName: 'Orders',
    }
);


export default Order;
