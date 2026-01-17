import type { Request, Response } from 'express';
import type { IUserService } from './user.service.js';
import { asyncHandler, createResponse, createListResponse } from '../../shared/interfaces/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import type { PaginationQuery } from '../../shared/middlewares/validate.js';

// Controller - HTTP layer only (Single Responsibility)
export class UserController {
    constructor(private readonly userService: IUserService) { }

    getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const user = await this.userService.getUserById(userId);
        res.status(HTTP_STATUS.OK).json(createResponse(user, 'User retrieved successfully', req.requestId));
    });

    getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const user = await this.userService.getUserById(id!);
        res.status(HTTP_STATUS.OK).json(createResponse(user, 'User retrieved successfully', req.requestId));
    });

    listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { page, limit, sortBy, sortOrder } = req.query as unknown as PaginationQuery;
        const result = await this.userService.listUsers({ page, limit, sortBy, sortOrder });
        res.status(HTTP_STATUS.OK).json(createListResponse(result, req.requestId));
    });

    updateSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const user = await this.userService.updateUserSettings(userId, req.body);
        res.status(HTTP_STATUS.OK).json(createResponse(user, 'Settings updated successfully', req.requestId));
    });

    connectRepo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const { repoId, fullName } = req.body;
        const user = await this.userService.connectRepository(userId, {
            repoId,
            fullName,
            isActive: true,
        });
        res.status(HTTP_STATUS.OK).json(createResponse(user, 'Repository connected successfully', req.requestId));
    });

    disconnectRepo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const repoId = parseInt(req.params.repoId!, 10);
        const user = await this.userService.disconnectRepository(userId, repoId);
        res.status(HTTP_STATUS.OK).json(createResponse(user, 'Repository disconnected successfully', req.requestId));
    });
}
