import { Request, Response } from 'express';
import groupService from "../services/groupService";

interface GroupRequest extends Request {
    params: {
        id?: string;
    };
    body: {
        NameGroup?: string;
        MusicGenreId?: string | number;
        ImageGroup?: string | null;
    };
}

async function getGroups(_req: Request, res: Response): Promise<Response> {
    try {
        const groups = await groupService.getAll();
        return res.json({ success: true, data: groups });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch groups';
        console.error('Error in getGroups:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
        });
    }
}

async function getGroupWithRecords(req: GroupRequest, res: Response): Promise<Response> {
    const groupId = req.params.id;
    
    if (!groupId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Group ID is required' 
        });
    }

    try {
        const group = await groupService.getRecordsByGroupId(Number(groupId));
        if (!group) {
            return res.status(404).json({ 
                success: false,
                message: `Group with ID ${groupId} not found` 
            });
        }
        return res.json({ success: true, data: group });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch group';
        console.error(`Error in getGroupWithRecords for ID ${groupId}:`, error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function createGroup(req: GroupRequest, res: Response): Promise<Response> {
    const { NameGroup, MusicGenreId, ImageGroup } = req.body;
    
    if (!NameGroup || !MusicGenreId) {
        return res.status(400).json({ 
            success: false,
            message: 'NameGroup and MusicGenreId are required' 
        });
    }

    try {
        const musicGenreId = typeof MusicGenreId === 'string' ? parseInt(MusicGenreId, 10) : MusicGenreId;
        
        if (isNaN(musicGenreId)) {
            return res.status(400).json({
                success: false,
                message: 'MusicGenreId must be a valid number'
            });
        }

        const genreExists = await groupService.musicGenreExists(musicGenreId);
        if (!genreExists) {
            return res.status(400).json({ 
                success: false,
                message: `The MusicGenre with ID ${musicGenreId} does not exist` 
            });
        }

        // Handle the image URL
        const imageUrl = ImageGroup && ImageGroup.trim() !== '' ? ImageGroup.trim() : null;

        const newGroup = {
            NameGroup: NameGroup.trim(),
            MusicGenreId: musicGenreId,
            ImageGroup: imageUrl  // Can be null or a URL
        };

        const createdGroup = await groupService.create(newGroup);
        return res.status(201)
            .location(`/api/groups/${createdGroup.IdGroup}`)
            .json({ success: true, data: createdGroup });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create group';
        console.error('Error in createGroup:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function updateGroup(req: GroupRequest, res: Response): Promise<Response> {
    const id = req.params.id;
    const { NameGroup, MusicGenreId } = req.body;
    
    if (!id || !NameGroup || MusicGenreId === undefined) {
        return res.status(400).json({ 
            success: false,
            message: 'Group ID, NameGroup, and MusicGenreId are required' 
        });
    }

    try {
        const groupId = parseInt(id, 10);
        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: 'Group ID must be a valid number'
            });
        }

        const musicGenreId = typeof MusicGenreId === 'string' ? parseInt(MusicGenreId, 10) : MusicGenreId;
        if (isNaN(musicGenreId)) {
            return res.status(400).json({
                success: false,
                message: 'MusicGenreId must be a valid number'
            });
        }

        const group = await groupService.getById(groupId);
        if (!group) {
            return res.status(404).json({ 
                success: false,
                message: `Group with ID ${groupId} not found` 
            });
        }

        const genreExists = await groupService.musicGenreExists(musicGenreId);
        if (!genreExists) {
            return res.status(400).json({ 
                success: false,
                message: `The MusicGenre with ID ${musicGenreId} does not exist` 
            });
        }

            // Handle the image URL
            let imageUrl = group.ImageGroup; // Keep the current image by default
            
            if ('ImageGroup' in req.body) {
                // If ImageGroup is explicitly sent in the body
                if (req.body.ImageGroup && req.body.ImageGroup.trim() !== '') {
                    imageUrl = req.body.ImageGroup.trim();
                } else {
                    // If an empty string is sent, set it to null
                    imageUrl = null;
                }
            }

            console.log('Updating group with image URL:', {
                currentImage: group.ImageGroup,
                newImage: req.body.ImageGroup,
                finalImage: imageUrl
            });

        // Update the group
        await groupService.update(groupId, {
            NameGroup: NameGroup.trim(),
            MusicGenreId: musicGenreId,
            ImageGroup: imageUrl
        });

        // Get the updated group to return it
        const updatedGroup = await groupService.getById(groupId);
        return res.json({ 
            success: true, 
            data: updatedGroup 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update group';
        console.error(`Error in updateGroup for ID ${id}:`, error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function deleteGroup(req: GroupRequest, res: Response): Promise<Response> {
    const id = req.params.id;
    
    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Group ID is required'
        });
    }

    try {
        const groupId = parseInt(id, 10);
        if (isNaN(groupId)) {
            return res.status(400).json({
                success: false,
                message: 'Group ID must be a valid number'
            });
        }

        const groupExists = await groupService.getById(groupId);
        if (!groupExists) {
            return res.status(404).json({ 
                success: false,
                message: `Group with ID ${groupId} not found` 
            });
        }

        const hasRecords = await groupService.hasRecords(groupId);
        if (hasRecords) {
            return res.status(400).json({ 
                success: false,
                message: `The Group with ID ${groupId} cannot be deleted because it has associated Records` 
            });
        }

        await groupService.remove(groupId);
        return res.status(204).send();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete group';
        console.error(`Error in deleteGroup for ID ${id}:`, error);
        return res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

export default {
    getGroups,
    getGroupWithRecords,
    createGroup,
    updateGroup,
    deleteGroup
};