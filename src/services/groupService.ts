import { sequelize } from "../config/database";
import { QueryTypes } from 'sequelize';

export interface Group {
  IdGroup?: number;
  NameGroup: string;
  ImageGroup: string | null;
  MusicGenreId: number;
  NameMusicGenre?: string;
  TotalRecords?: number;
}

export interface GroupWithRecords extends Group {
  Records?: Array<{
    IdRecord: number;
    TitleRecord: string;
    YearOfPublication: number;
    ImageRecord: string;
    Price: number;
    Stock: number;
  }>;
}

export async function getAll(): Promise<Group[]> {
  const results = await sequelize.query(`
    SELECT 
      g."IdGroup", 
      g."NameGroup", 
      g."ImageGroup", 
      g."MusicGenreId", 
      mg."NameMusicGenre",
      (SELECT COUNT(*) FROM "Records" r WHERE r."GroupId" = g."IdGroup") as "TotalRecords"
    FROM "Groups" g
    LEFT JOIN "MusicGenres" mg ON g."MusicGenreId" = mg."IdMusicGenre"
  `, { type: 'SELECT' });
  
  return results as Group[];
}

export async function getById(id: number): Promise<Group | null> {
  const [result] = await sequelize.query(
    `SELECT g.*, mg."NameMusicGenre" 
     FROM "Groups" g 
     LEFT JOIN "MusicGenres" mg ON g."MusicGenreId" = mg."IdMusicGenre" 
     WHERE g."IdGroup" = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT
    }
  ) as any[];
  return result || null;
}

export async function getRecordsByGroupId(id: number): Promise<GroupWithRecords | null> {
  const group = await getById(id);
  if (!group) return null;

  const records = await sequelize.query(
    'SELECT "IdRecord", "TitleRecord", "YearOfPublication", "ImageRecord", "Price", "Stock" FROM "Records" WHERE "GroupId" = :groupId',
    {
      replacements: { groupId: id },
      type: QueryTypes.SELECT
    }
  ) as any[];

  return {
    ...group,
    Records: records
  };
}

export async function create(groupData: Omit<Group, 'IdGroup' | 'NameMusicGenre' | 'TotalRecords'>): Promise<Group> {
  const { NameGroup, ImageGroup, MusicGenreId } = groupData;
  
  // Ensure ImageGroup is null if it is empty or undefined
  const finalImageGroup = ImageGroup?.trim() || null;
  
  console.log('Creating group in database with data:', {
    NameGroup,
    ImageGroup: finalImageGroup,
    MusicGenreId,
    typeOfImageGroup: typeof finalImageGroup
  });
  
  try {
    // Use Sequelize model to create the group
    const result = await sequelize.models.Group.create({
      NameGroup,
      ImageGroup: finalImageGroup,
      MusicGenreId
    });
    
    const createdGroup = result.get({ plain: true });
    console.log('Group created successfully:', createdGroup);
    
    // Verify the inserted group
    const inserted = await sequelize.models.Group.findByPk(createdGroup.IdGroup);
    console.log('Inserted group from database:', inserted?.get({ plain: true }));
    
    return createdGroup;
  } catch (error) {
    console.error('Error in groupService.create:', error);
    throw error;
  }
}

export async function update(id: number, groupData: Partial<Omit<Group, 'IdGroup' | 'NameMusicGenre' | 'TotalRecords'>>): Promise<boolean> {
  try {
    const updateData: any = { ...groupData };
    
    // Ensure ImageGroup is null if it is empty or undefined
    if ('ImageGroup' in groupData) {
      updateData.ImageGroup = groupData.ImageGroup?.trim() || null;
    }
    
    console.log('Updating group with data:', {
      id,
      updateData,
      hasImageGroup: 'ImageGroup' in groupData
    });
    
    // Use Sequelize model to update the group
    const [affectedCount] = await sequelize.models.Group.update(updateData, {
      where: { IdGroup: id }
    });
    
    console.log('Update result:', { affectedCount });
    
    // Verify the updated group
    if (affectedCount > 0) {
      const updatedGroup = await sequelize.models.Group.findByPk(id);
      console.log('Updated group from database:', updatedGroup?.get({ plain: true }));
    }
    
    return affectedCount > 0;
  } catch (error) {
    console.error('Error in groupService.update:', error);
    throw error;
  }
}

export async function remove(id: number): Promise<boolean> {
  const [_, rowCount] = await sequelize.query(
    'DELETE FROM "Groups" WHERE "IdGroup" = :id',
    {
      replacements: { id },
      type: 'DELETE' as const
    }
  );
  return (rowCount as number) > 0;
}

export async function hasRecords(id: number): Promise<boolean> {
  const [results] = await sequelize.query(
    'SELECT COUNT(*) as count FROM "Records" WHERE "GroupId" = :id',
    {
      replacements: { id },
      type: 'SELECT' as const
    }
  );
  return (results as any).count > 0;
}

export async function musicGenreExists(id: number): Promise<boolean> {
  const { MusicGenre } = require('../models');
  const count = await MusicGenre.count({
    where: { IdMusicGenre: id }
  });
  return count > 0;
}

export default {
  getAll,
  getById,
  getRecordsByGroupId,
  create,
  update,
  remove,
  hasRecords,
  musicGenreExists,
};
