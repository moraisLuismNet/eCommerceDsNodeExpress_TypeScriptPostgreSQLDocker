import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ICartDetailAttributes {
    IdCartDetail: number;
    CartId: number;
    RecordId: number;
    Amount: number;
    Price: number;
}

export interface ICartDetailCreationAttributes extends Optional<ICartDetailAttributes, 'IdCartDetail'> {}

export class CartDetail extends Model<ICartDetailAttributes, ICartDetailCreationAttributes> implements ICartDetailAttributes {
    public IdCartDetail!: number;
    public CartId!: number;
    public RecordId!: number;
    public Amount!: number;
    public Price!: number;

}

CartDetail.init(
    {
        IdCartDetail: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        CartId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Carts',
                key: 'IdCart',
            },
        },
        RecordId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Records',
                key: 'IdRecord',
            },
        },
        Amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        Price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'CartDetails',
    }
);

export default CartDetail;
