import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface IMusicGenreAttributes {
  IdMusicGenre: number;
  NameMusicGenre: string;
  Groups?: any[]; // Using any to avoid circular dependencies
}

export interface IMusicGenreCreationAttributes
  extends Optional<IMusicGenreAttributes, "IdMusicGenre"> {}

export class MusicGenre
  extends Model<IMusicGenreAttributes, IMusicGenreCreationAttributes>
  implements IMusicGenreAttributes
{
  public IdMusicGenre!: number;
  public NameMusicGenre!: string;

  // Associations will be added after model initialization
  public readonly Groups?: any[];
}

MusicGenre.init(
  {
    IdMusicGenre: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    NameMusicGenre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "MusicGenres",
  }
);

// Export the MusicGenre model instance
export const MusicGenreModel = MusicGenre;

// This function will be called after all models are initialized
export function setupMusicGenreAssociations() {
  // Use require to avoid circular dependencies at module load time
  const { Group } = require("./Group");

  MusicGenre.hasMany(Group, {
    foreignKey: "MusicGenreId",
    as: "Groups",
  });
}

export default MusicGenre;
