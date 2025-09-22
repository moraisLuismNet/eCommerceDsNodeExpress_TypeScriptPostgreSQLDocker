import { Request, Response } from 'express';
import musicGenreService from "../services/musicGenreService";

interface MusicGenreRequest extends Request {
    params: {
        id?: string;
        text?: string;
        ascen?: string;
    };
    body: {
        nameMusicGenre?: string;
    };
}

async function getMusicGenres(_req: Request, res: Response): Promise<Response> {
    try {
        const genres = await musicGenreService.getAll();
        return res.status(200).json({ 
            success: true, 
            data: genres 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch music genres';
        console.error('Error in getMusicGenres:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function getMusicGenreById(req: MusicGenreRequest, res: Response): Promise<Response> {
    try {
        const genre = await musicGenreService.getById(parseInt(req.params.id || '0'));
        if (!genre) {
            return res.status(404).json({ 
                success: false,
                message: `MusicGenre with ID ${req.params.id} not found` 
            });
        }
        return res.status(200).json({ 
            success: true, 
            data: genre 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch music genre';
        console.error('Error in getMusicGenreById:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function searchByName(req: MusicGenreRequest, res: Response): Promise<Response> {
    try {
        const searchText = req.params.text || '';
        const genres = await musicGenreService.searchByName(searchText);
        
        if (!genres || genres.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: `No musical genres found matching the text '${searchText}'` 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            data: genres 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search music genres';
        console.error('Error in searchByName:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function getSortedByName(req: MusicGenreRequest, res: Response): Promise<Response> {
    try {
        const ascen = req.params.ascen === 'true';
        const genres = await musicGenreService.getSortedByName(ascen);
        
        if (!genres || genres.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No musical genres found' 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            data: genres 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sorted music genres';
        console.error('Error in getSortedByName:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function getWithTotalGroups(_req: Request, res: Response): Promise<Response> {
    try {
        const genres = await musicGenreService.getWithTotalGroups();
        return res.status(200).json({ 
            success: true, 
            data: genres 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch music genres with group counts';
        console.error('Error in getWithTotalGroups:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function addMusicGenre(req: MusicGenreRequest, res: Response): Promise<Response> {
    const { nameMusicGenre } = req.body;
    
    if (!nameMusicGenre || nameMusicGenre.trim().length < 2 || nameMusicGenre.trim().length > 20) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation error: NameMusicGenre must be between 2 and 20 characters' 
        });
    }
    
    try {
        const newGenre = await musicGenreService.create(nameMusicGenre.trim());
        return res.status(201)
            .location(`/api/music-genres/${newGenre.IdMusicGenre}`)
            .json({ 
                success: true, 
                data: newGenre 
            });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create music genre';
        console.error('Error in addMusicGenre:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function updateMusicGenre(req: MusicGenreRequest, res: Response): Promise<Response> {
    const { nameMusicGenre } = req.body;
    const genreId = req.params.id || '';
    
    if (!nameMusicGenre || nameMusicGenre.trim().length < 2 || nameMusicGenre.trim().length > 20) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation error: NameMusicGenre must be between 2 and 20 characters' 
        });
    }
    
    try {
        const updatedGenre = await musicGenreService.update(parseInt(genreId), nameMusicGenre.trim());
        if (!updatedGenre) {
            return res.status(404).json({ 
                success: false,
                message: `MusicGenre with ID ${genreId} not found` 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            data: updatedGenre 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update music genre';
        console.error('Error in updateMusicGenre:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function deleteMusicGenre(req: MusicGenreRequest, res: Response): Promise<Response> {
    const genreId = req.params.id || '';
    
    try {
        const hasGroups = await musicGenreService.hasGroups(parseInt(genreId));
        if (hasGroups) {
            return res.status(400).json({ 
                success: false,
                message: `The Music Genre with ID ${genreId} cannot be deleted because it has associated Groups` 
            });
        }
        
        const deletedGenre = await musicGenreService.remove(parseInt(genreId));
        if (!deletedGenre) {
            return res.status(404).json({ 
                success: false,
                message: `MusicalGenre with ID ${genreId} not found` 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            data: deletedGenre 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete music genre';
        console.error('Error in deleteMusicGenre:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

export default {
    getMusicGenres,
    getMusicGenreById,
    searchByName,
    getSortedByName,
    getWithTotalGroups,
    addMusicGenre,
    updateMusicGenre,
    deleteMusicGenre
};