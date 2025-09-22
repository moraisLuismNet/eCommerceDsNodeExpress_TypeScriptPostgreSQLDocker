import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface IRecordAttributes {
  IdRecord: number;
  TitleRecord: string;
  YearOfPublication: number;
  ImageRecord: string | null;
  Price: number;
  Stock: number;
  Discontinued: boolean;
  GroupId: number;
}

export type IRecordCreationAttributes = Optional<
  IRecordAttributes,
  "IdRecord" | "ImageRecord" | "Stock" | "Discontinued"
>;

export class Record
  extends Model<IRecordAttributes, IRecordCreationAttributes>
  implements IRecordAttributes
{
  public IdRecord!: number;
  public TitleRecord!: string;
  public YearOfPublication!: number;
  public ImageRecord!: string | null;
  public Price!: number;
  public Stock!: number;
  public Discontinued!: boolean;
  public GroupId!: number;
}

Record.init(
  {
    IdRecord: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    TitleRecord: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    YearOfPublication: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ImageRecord: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    Stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    Discontinued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    GroupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Groups",
        key: "IdGroup",
      },
    },
  },
  {
    tableName: "Records",
    timestamps: false,
    sequelize,
    modelName: "Record",
  }
);

export default Record;
