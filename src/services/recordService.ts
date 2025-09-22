import { sequelize } from "../config/database";
import { QueryTypes } from "sequelize";

export interface RecordItem {
  IdRecord?: number;
  TitleRecord: string;
  YearOfPublication: number;
  ImageRecord: string | null;
  Price: number;
  Stock: number;
  Discontinued: boolean;
  GroupId: number;
  NameGroup?: string;
  PhotoName?: string | null;
  stock?: number; // Add this for frontend compatibility
}

export async function getAll(): Promise<Array<{
  IdRecord: number;
  TitleRecord: string;
  YearOfPublication: number;
  Price: number;
  Stock: number;
  stock: number;
  Discontinued: boolean;
  GroupId: number;
  NameGroup?: string;
  ImageRecord: string | null;
  PhotoName: string | null;
}>> {
  try {
    // Use query with QueryTypes.SELECT to ensure we get an array of records
    const results = await sequelize.query(
      `SELECT 
        r.*, 
        g."NameGroup",
        r."Stock" as stock,
        r."ImageRecord" as "PhotoName"
      FROM "Records" r 
      LEFT JOIN "Groups" g ON r."GroupId" = g."IdGroup"`,
      { 
        type: QueryTypes.SELECT,
        logging: console.log // Log the actual SQL query
      }
    ) as any[];
    
    console.log(`Retrieved ${results?.length || 0} records from the database.`);
    
    // Ensure results is an array before mapping
    if (!Array.isArray(results)) {
      console.error('Unexpected query result format:', results);
      throw new Error('Failed to retrieve records: Invalid result format from database');
    }
    
    // Map the results to ensure consistent property naming
    const mappedResults = results.map(record => {
      try {
        return {
          IdRecord: record.IdRecord,
          TitleRecord: record.TitleRecord,
          YearOfPublication: record.YearOfPublication,
          Price: record.Price,
          Stock: record.Stock ?? 0,
          stock: record.Stock ?? 0,
          Discontinued: Boolean(record.Discontinued),
          GroupId: record.GroupId,
          NameGroup: record.NameGroup || null,
          ImageRecord: record.ImageRecord,
          PhotoName: record.ImageRecord
        };
      } catch (mapError: unknown) {
        const errorMessage = mapError instanceof Error ? mapError.message : 'Unknown error';
        console.error('Error mapping record:', mapError, 'Record data:', record);
        throw new Error(`Failed to map record with ID ${record?.IdRecord}: ${errorMessage}`);
      }
    });
    
    return mappedResults;
  } catch (error) {
    console.error('Error in recordService.getAll():', error);
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any).original ? { originalError: (error as any).original } : {}
      });
    }
    throw error; // Re-throw to be handled by the controller
  }
}

export async function getById(id: number): Promise<{
  IdRecord: number;
  TitleRecord: string;
  YearOfPublication: number;
  Price: number;
  Stock: number;
  stock: number;
  Discontinued: boolean;
  GroupId: number;
  NameGroup?: string;
  ImageRecord: string | null;
  PhotoName: string | null;
} | null> {
  try {
    console.log(`Fetching record with ID: ${id}`);
    
    const results = await sequelize.query(
      `SELECT 
        r.*, 
        g."NameGroup",
        r."Stock" as stock,
        r."ImageRecord" as "PhotoName"
      FROM "Records" r
      LEFT JOIN "Groups" g ON r."GroupId" = g."IdGroup"
      WHERE r."IdRecord" = :id`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
        logging: console.log
      }
    ) as any[];

    if (!results || results.length === 0) {
      console.log(`No record found with ID: ${id}`);
      return null;
    }

    const record = results[0];
    
    // Return with consistent property names for frontend
    return {
      IdRecord: record.IdRecord,
      TitleRecord: record.TitleRecord,
      YearOfPublication: record.YearOfPublication,
      Price: record.Price,
      Stock: record.Stock ?? 0,
      stock: record.Stock ?? 0,
      Discontinued: Boolean(record.Discontinued),
      GroupId: record.GroupId,
      NameGroup: record.NameGroup || undefined,
      ImageRecord: record.ImageRecord,
      PhotoName: record.ImageRecord
    };
  } catch (error) {
    console.error(`Error in getById(${id}):`, error);
    throw error;
  }
}

import { Record as RecordModel } from "../models/Record";

export async function create(
  recordData: Omit<RecordItem, "IdRecord" | "NameGroup"> & { stock?: number; PhotoName?: string | null }
): Promise<{ IdRecord: number } & Omit<RecordItem, "IdRecord" | "NameGroup">> {
  console.log('Creating record with data:', JSON.stringify(recordData, null, 2));
  
  // Prepare the data for creation
  const createData: any = { ...recordData };
  
  // Handle both stock and Stock
  if (createData.stock !== undefined) {
    createData.Stock = createData.stock;
    delete createData.stock;
  }
  
  // Handle both ImageRecord and PhotoName
  if ('PhotoName' in createData) {
    createData.ImageRecord = createData.PhotoName !== undefined ? createData.PhotoName : null;
    delete createData.PhotoName;
  }
  
  // Ensure required fields have default values
  const recordToCreate = {
    TitleRecord: createData.TitleRecord || '',
    YearOfPublication: createData.YearOfPublication || 0,
    Price: createData.Price || 0,
    Stock: createData.Stock || 0,
    Discontinued: createData.Discontinued || false,
    GroupId: createData.GroupId || 0,
    ImageRecord: 'ImageRecord' in createData ? createData.ImageRecord : null
  };
  
  try {
    // Use Sequelize model to create the record
    const createdRecord = await RecordModel.create(recordToCreate);
    
    // Get the full record with all fields
    const fullRecord = await getById(createdRecord.IdRecord);
    if (!fullRecord) {
      throw new Error('Failed to retrieve created record');
    }
    
    return {
      ...fullRecord,
      IdRecord: createdRecord.IdRecord
    };
  } catch (error) {
    console.error('Error creating record:', error);
    throw error;
  }
}

export async function update(
  id: number,
  recordData: Partial<Omit<RecordItem, "IdRecord" | "NameGroup"> & { stock?: number; PhotoName?: string | null }>
): Promise<boolean> {
  try {
    // Create a copy to avoid modifying the original
    const updateData = { ...recordData };
    
    // Handle stock/Stock
    if ('stock' in updateData) {
      updateData.Stock = updateData.stock;
      delete updateData.stock;
    }
    
    // Handle PhotoName/ImageRecord
    if ('PhotoName' in updateData) {
      updateData.ImageRecord = updateData.PhotoName;
      delete updateData.PhotoName;
    }
    
    // If there's nothing to update, return false
    if (Object.keys(updateData).length === 0) {
      return false;
    }
    const fields = [];
    const replacements: { [key: string]: any } = { id };

    if (updateData.TitleRecord !== undefined) {
      fields.push('"TitleRecord" = :title');
      replacements.title = String(updateData.TitleRecord).trim();
    }
    if (updateData.YearOfPublication !== undefined) {
      fields.push('"YearOfPublication" = :year');
      replacements.year = Number(updateData.YearOfPublication);
    }
    if ('ImageRecord' in updateData) {
      fields.push('"ImageRecord" = :image');
      replacements.image = updateData.ImageRecord !== null && updateData.ImageRecord !== undefined 
        ? String(updateData.ImageRecord).trim() 
        : null;
    }
    if (updateData.Price !== undefined) {
      fields.push('"Price" = :price');
      replacements.price = Number(updateData.Price);
    }
    if (updateData.Stock !== undefined) {
      fields.push('"Stock" = :stock');
      replacements.stock = Number(updateData.Stock);
    }
    if (updateData.Discontinued !== undefined) {
      fields.push('"Discontinued" = :discontinued');
      replacements.discontinued = Boolean(updateData.Discontinued);
    }
    if (updateData.GroupId !== undefined) {
      fields.push('"GroupId" = :groupId');
      replacements.groupId = Number(updateData.GroupId);
    }

    if (fields.length === 0) return false;

    const query = `
      UPDATE "Records" 
      SET ${fields.join(", ")}
      WHERE "IdRecord" = :id
    `;

    const [_, rowCount] = await sequelize.query(query, {
      replacements,
      type: "UPDATE" as const,
      logging: console.log // Add logging here
    });

    console.log(`Record update for ID ${id} resulted in ${rowCount} rows affected.`);

    return (rowCount as number) > 0;
  } catch (error) {
    console.error('Error updating record:', error);
    return false;
  }
}

export async function remove(id: number): Promise<boolean> {
  // Check if record exists
  const existing = await getById(id);
  if (!existing) {
    return false;
  }
  await sequelize.query('DELETE FROM "Records" WHERE "IdRecord" = :id', {
    replacements: { id },
    type: "DELETE" as const,
  });
  return true;
}

export async function updateStock(
  id: number,
  amount: number
): Promise<{ newStock: number; record?: RecordItem }> {
  // Start a transaction to ensure data consistency
  const transaction = await sequelize.transaction();
  
  try {
    // Get the current record with a lock to prevent race conditions
    const [results] = await sequelize.query(
      'SELECT * FROM "Records" WHERE "IdRecord" = :id FOR UPDATE',
      {
        replacements: { id },
        type: "SELECT" as const,
        transaction
      }
    );
    
    const record = (results as RecordItem[])[0];
    if (!record) {
      await transaction.rollback();
      throw new Error(`Record with ID ${id} not found`);
    }

    const currentStock = record.Stock;
    const newStock = currentStock + amount;

    // Validate stock level
    if (newStock < 0) {
      await transaction.rollback();
      throw new Error("Insufficient stock available");
    }

    // Update the stock
    await sequelize.query(
      'UPDATE "Records" SET "Stock" = :newStock WHERE "IdRecord" = :id',
      {
        replacements: { newStock, id },
        type: "UPDATE" as const,
        transaction
      }
    );

    // Commit the transaction
    await transaction.commit();

    // Get the updated record with all fields
    const updatedRecord = await getById(id);
    
    return { 
      newStock,
      record: updatedRecord || undefined
    };
  } catch (error) {
    // Rollback the transaction in case of errors
    await transaction.rollback();
    console.error('Error updating stock:', error);
    throw error; // Re-throw the error to be handled by the controller
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  updateStock,
};
