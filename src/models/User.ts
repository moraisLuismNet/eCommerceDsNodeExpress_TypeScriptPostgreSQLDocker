import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Interfaces
export interface IUserAttributes {
  email: string;
  password: string;
  role: string;
  cartId?: number | null;
}

export type UserCreationAttributes = IUserAttributes;

// Model
class User extends Model<IUserAttributes, UserCreationAttributes> implements IUserAttributes {
  public email!: string;
  public password!: string;
  public role!: string;
  public cartId: number | null = null;

  public static associations: {};
}

// Model initialization
User.init(
  {
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
        len: [5, 100]
      },
      field: 'Email'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'Password'
    },
    role: {
      type: DataTypes.ENUM('Admin', 'User'),
      allowNull: false,
      defaultValue: 'User',
      field: 'Role'
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'CartId',
      references: {
        model: 'Carts',
        key: 'IdCart'
      }
    }
  },
  {
    sequelize,
    tableName: 'Users',
    underscored: false,
    defaultScope: {
      attributes: {
        exclude: ['password']
      }
    },
    scopes: {
      withSensitiveData: {
        attributes: { include: [] }
      }
    }
  }
);

// Associations
export function setupUserAssociations() {
  // Add associations here if needed
}

export default User;
