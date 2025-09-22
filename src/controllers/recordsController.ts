import { Request, Response } from 'express';
import recordService from "../services/recordService";
import groupService from "../services/groupService";

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T & {
        record?: any; // This allows the record property to be included in the response
    };
    error?: string;
}

interface RecordRequest extends Request {
    body: {
        TitleRecord?: string;
        YearOfPublication?: string | number;
        Price?: string | number;
        Stock?: string | number;
        Discontinued?: string | boolean;
        GroupId?: string | number;
        ImageRecord?: string | null;
        [key: string]: any; // Allow additional properties
    };
    params: {
        id?: string;
        amount?: string;
    };
}

async function getRecords(req: Request, res: Response<ApiResponse>) {
    try {
        const records = await recordService.getAll();
        
        if (!records) {
            console.log('No records found');
            return res.json({
                success: true,
                message: 'No records found',
                data: []
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Records retrieved successfully', 
            data: records 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error in getRecords:', error);
        
        // Log the full error in development
        if (process.env.NODE_ENV === 'development' && error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve records',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function getRecordById(
    req: Request,
    res: Response<ApiResponse<{
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
    }>>
) {
    try {
        const record = await recordService.getById(parseInt(req.params.id as string));
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }
        
        // The record is already in the correct format from the service
        res.json({ 
            success: true, 
            message: 'Record retrieved successfully', 
            data: record 
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function deleteRecord(req: Request, res: Response<ApiResponse>) {
    try {
        const success = await recordService.remove(Number(req.params.id));
        if (!success) {
            return res.status(404).json({ 
                success: false,
                message: 'Record not found' 
            });
        }
        res.status(204).send(); 
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

interface StockUpdateResponse {
    message: string;
    newStock: number;
    record?: any;
}

async function updateStock(req: Request, res: Response<ApiResponse<StockUpdateResponse>>) {
    const { id, amount } = req.params;
    try {
        const result = await recordService.updateStock(parseInt(id), parseInt(amount));
        
        if (!result.record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found after stock update'
            });
        }
        
        const responseData: StockUpdateResponse = {
            message: 'Stock updated successfully',
            newStock: result.newStock,
            record: {
                ...result.record,
                stock: result.record.Stock,
                PhotoName: result.record.ImageRecord
            }
        };
        
        res.json({
            success: true,
            message: `The stock of the record with ID ${id} has been updated by ${amount} units`,
            data: responseData
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(400).json({ 
            success: false,
            message: 'Bad request',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function createRecord(req: RecordRequest, res: Response<ApiResponse>) {
    try {
        const { TitleRecord, YearOfPublication, Price, Stock, Discontinued, GroupId } = req.body;

        // Validate that the group exists
        const group = await groupService.getById(Number(GroupId));
        if (!group) {
            return res.status(400).json({ 
                success: false,
                message: `The Group with ID ${GroupId} does not exist` 
            });
        }

        if (!TitleRecord || !YearOfPublication || !Price || !Stock || !GroupId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Handle image URL
        const imageRecord = req.body.ImageRecord && req.body.ImageRecord.trim() !== '' 
            ? req.body.ImageRecord.trim() 
            : null;
        
        const newRecord = {
            TitleRecord: String(TitleRecord).trim(),
            YearOfPublication: Number(YearOfPublication),
            Price: Number(Price),
            Stock: Number(Stock),
            Discontinued: Discontinued === 'true',
            GroupId: Number(GroupId),
            ImageRecord: imageRecord,  // This will be either the image path, null, or an empty string
            PhotoName: imageRecord     // Also set PhotoName for compatibility
        };

        const createdRecord = await recordService.create(newRecord);
        
        // Get the full record with all fields
        const fullRecord = await recordService.getById(createdRecord.IdRecord);
        
        if (!fullRecord) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve the created record'
            });
        }
        
        // Create a response object with consistent property names
        const responseData = {
            ...fullRecord,
            // Add frontend-compatible properties
            stock: fullRecord.Stock,
            PhotoName: fullRecord.ImageRecord
        };

        // Return a 201 Created response with the location and the created object
        res.status(201)
            .location(`/api/records/${createdRecord.IdRecord}`)
            .json({
                success: true,
                message: 'Record created successfully',
                data: responseData
            });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

async function updateRecord(req: RecordRequest, res: Response<ApiResponse>) {
    const { id } = req.params;
    try {
        const recordId = Number(id);
        let record = await recordService.getById(recordId);
        if (!record) {
            return res.status(404).json({ 
                success: false,
                message: `Record with ID ${id} not found` 
            });
        }

        const { TitleRecord, YearOfPublication, Price, Stock, Discontinued, GroupId } = req.body;

        if (GroupId) {
            const group = await groupService.getById(Number(GroupId));
            if (!group) {
                return res.status(400).json({ 
                    success: false,
                    message: `The Group with ID ${GroupId} does not exist` 
                });
            }
        }

        // Prepare the updated data
        const updatedData: any = {
            TitleRecord: TitleRecord !== undefined ? String(TitleRecord) : record.TitleRecord,
            YearOfPublication: YearOfPublication !== undefined ? Number(YearOfPublication) : record.YearOfPublication,
            Price: Price !== undefined ? Number(Price) : record.Price,
            Stock: Stock !== undefined ? Number(Stock) : record.Stock,
            Discontinued: Discontinued !== undefined ? (String(Discontinued) === 'true') : record.Discontinued,
            GroupId: GroupId !== undefined ? Number(GroupId) : record.GroupId,
        };

        // Handle image URL update
        // Check if either ImageRecord or PhotoName is present in the request body
        if ('ImageRecord' in req.body || 'PhotoName' in req.body) {
            const imageSource = req.body.ImageRecord || req.body.PhotoName;
            updatedData.ImageRecord = imageSource && imageSource.trim() !== ''
                ? imageSource.trim()
                : null;
            updatedData.PhotoName = updatedData.ImageRecord; // Ensure PhotoName is consistent with ImageRecord
        }

        // Update the record
        const success = await recordService.update(recordId, updatedData);
        
        if (!success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update record in the database'
            });
        }

        // Get the updated record with all fields
        const updatedRecord = await recordService.getById(recordId);
        
        if (!updatedRecord) {
            return res.status(404).json({
                success: false,
                message: 'Record not found after update'
            });
        }

        // Prepare the response data with consistent property names
        const responseData = {
            ...updatedRecord,
            // Add frontend-compatible properties
            stock: updatedRecord.Stock,
            PhotoName: updatedRecord.ImageRecord
        };

        res.json({
            success: true,
            message: 'Record updated successfully',
            data: responseData
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}

export default { 
    getRecords, 
    getRecordById, 
    createRecord, 
    updateRecord, 
    deleteRecord, 
    updateStock 
};