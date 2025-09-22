import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ICartAttributes {
    IdCart: number;
    UserEmail: string;
    TotalPrice: number;
    Enabled: boolean;
}

export interface ICartCreationAttributes extends Optional<ICartAttributes, 'IdCart'> {}

class Cart extends Model<ICartAttributes, ICartCreationAttributes> implements ICartAttributes {
    public IdCart!: number;
    public UserEmail!: string;
    public TotalPrice!: number;
    public Enabled!: boolean;
}

Cart.init(
    {
        IdCart: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        UserEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'Email'
            }
        },
        TotalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        Enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
        sequelize,
        tableName: 'Carts',
        timestamps: true
    }
);

export default Cart;