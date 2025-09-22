import { MusicGenre, IMusicGenreAttributes } from "../models/MusicGenre";
import { Op, literal } from 'sequelize';
import { sequelize } from "../config/database";

export interface MusicGenreWithCount extends IMusicGenreAttributes {
  TotalGroups?: number;
}

export async function getAll(): Promise<MusicGenreWithCount[]> {
  const genres = await MusicGenre.findAll({
    attributes: [
      'IdMusicGenre',
      'NameMusicGenre'
    ]
  });

  // Get the count of groups for each genre
  const genresWithCounts = await Promise.all(
    genres.map(async (genre) => {
      const [result] = await sequelize.query(
        'SELECT COUNT(*)::integer as "TotalGroups" FROM "Groups" WHERE "MusicGenreId" = :genreId',
        {
          replacements: { genreId: genre.IdMusicGenre },
          type: 'SELECT' as const
        }
      );
      
      return {
        ...genre.toJSON(),
        TotalGroups: (result as any).TotalGroups || 0
      } as MusicGenreWithCount;
    })
  );

  return genresWithCounts;
}

export async function getById(id: number): Promise<MusicGenre | null> {
  const genre = await MusicGenre.findByPk(id);
  if (!genre) return null;
  
  // Get the count of groups for this genre
  const [result] = await sequelize.query(
    'SELECT COUNT(*)::integer as "groupCount" FROM "Groups" WHERE "MusicGenreId" = :genreId',
    {
      replacements: { genreId: id },
      type: 'SELECT' as const
    }
  );
  
  const genreData = genre.toJSON() as any;
  genreData.groupCount = (result as any).groupCount || 0;
  
  return genreData as MusicGenre;
}

export async function searchByName(text: string): Promise<IMusicGenreAttributes[]> {
  return MusicGenre.findAll({
    where: {
      NameMusicGenre: {
        [Op.iLike]: `%${text}%`
      }
    },
    attributes: ['IdMusicGenre', 'NameMusicGenre']
  });
}

export async function getSortedByName(ascending = true): Promise<IMusicGenreAttributes[]> {
  return MusicGenre.findAll({
    order: [
      ['NameMusicGenre', ascending ? 'ASC' : 'DESC']
    ],
    attributes: ['IdMusicGenre', 'NameMusicGenre']
  });
}

export async function getWithTotalGroups(): Promise<MusicGenreWithCount[]> {
  return getAll();
}

export async function create(name: string): Promise<MusicGenre> {
  return MusicGenre.create({
    NameMusicGenre: name
  });
}

export async function update(id: number, name: string): Promise<MusicGenre | null> {
  const [affectedCount] = await MusicGenre.update(
    { NameMusicGenre: name },
    { where: { IdMusicGenre: id } }
  );
  
  if (affectedCount === 0) {
    return null;
  }
  
  return getById(id);
}

export async function remove(id: number): Promise<MusicGenre | null> {
  const genre = await MusicGenre.findByPk(id);
  if (!genre) {
    return null;
  }
  
  await genre.destroy();
  return genre;
}

export async function hasGroups(id: number): Promise<boolean> {
  const [result] = await sequelize.query(
    'SELECT COUNT(*)::integer as count FROM "Groups" WHERE "MusicGenreId" = :genreId',
    {
      replacements: { genreId: id },
      type: 'SELECT' as const
    }
  );
  
  return (result as any).count > 0;
}

export default {
  getAll,
  getById,
  searchByName,
  getSortedByName,
  getWithTotalGroups,
  create,
  update,
  remove,
  hasGroups,
};
