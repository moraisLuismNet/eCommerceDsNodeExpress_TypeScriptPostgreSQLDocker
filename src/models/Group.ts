import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface IGroupAttributes {
    IdGroup: number;
    NameGroup: string;
    ImageGroup: string | null;
    MusicGenreId: number;
    MusicGenre?: any; // Temporary any type to avoid circular dependencies
    Records?: any[];  // Temporary any type to avoid circular dependencies
}

export interface IGroupCreationAttributes extends Optional<IGroupAttributes, 'IdGroup' | 'ImageGroup'> {}

export class Group extends Model<IGroupAttributes, IGroupCreationAttributes> implements IGroupAttributes {
    public IdGroup!: number;
    public NameGroup!: string;
    public ImageGroup!: string | null;
    public MusicGenreId!: number;

    // Associations will be added after model initialization
    public readonly MusicGenre?: any;
    public readonly Records?: any[];
}

Group.init(
    {
        IdGroup: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        NameGroup: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ImageGroup: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        MusicGenreId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'Groups',
    }
);

// Export the Group model instance
export const GroupModel = Group;

// This function will be called after all models are initialized
export function setupGroupAssociations() {
    // Use require to avoid circular dependencies at module load time
    const { MusicGenre } = require('./MusicGenre');
    
    Group.belongsTo(MusicGenre, {
        foreignKey: 'MusicGenreId',
        as: 'MusicGenre',
    });
}

export default Group;
