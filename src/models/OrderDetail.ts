import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { IOrderAttributes } from './Order';

export interface IOrderDetailAttributes {
    IdOrderDetail: number;
    OrderId: number;
    RecordId: number;
    Amount: number;
    Price: number;
    // Virtual field for computed total
    total?: number;
    // Associations
    Order?: IOrderAttributes;
}

export interface IOrderDetailCreationAttributes extends Optional<IOrderDetailAttributes, 'IdOrderDetail' | 'total'> {}

export class OrderDetail extends Model<IOrderDetailAttributes, IOrderDetailCreationAttributes> implements IOrderDetailAttributes {
    public IdOrderDetail!: number;
    public OrderId!: number;
    public RecordId!: number;
    public Amount!: number;
    public Price!: number;
    
    // Virtual field for computed total
    public get total(): number {
        return this.Amount * this.Price;
    }
    
    // For associations
    public readonly Order?: IOrderAttributes;
}

OrderDetail.init(
    {
        IdOrderDetail: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        OrderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Orders',
                key: 'IdOrder',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        RecordId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Records',
                key: 'IdRecord',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        Amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        Price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0.01,
            },
        },
    },
    {
        sequelize,
        tableName: 'OrderDetails',
        getterMethods: {
            total() {
                return this.Amount * this.Price;
            },
        },
    }
);

// Associations are defined in src/models/associations.ts
// This is a type alias for backward compatibility
export type IOrderDetail = IOrderDetailAttributes;
