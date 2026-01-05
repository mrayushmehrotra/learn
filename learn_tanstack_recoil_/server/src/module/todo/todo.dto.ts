import { z } from 'zod';

export const TodoStatus = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const Priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: Priority.default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  userId: z.string().min(1, 'User ID is required'),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: TodoStatus.optional(),
  priority: Priority.optional(),
  dueDate: z.string().datetime().optional(),
});

export const CreateSubtaskSchema = z.object({
  title: z.string().min(1, 'Subtask title is required').max(200, 'Subtask title too long'),
  todoId: z.string().min(1, 'Todo ID is required'),
});

export const UpdateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isCompleted: z.boolean().optional(),
});

export const TodoQuerySchema = z.object({
  status: TodoStatus.optional(),
  priority: Priority.optional(),
  userId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type CreateTodoDto = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoDto = z.infer<typeof UpdateTodoSchema>;
export type CreateSubtaskDto = z.infer<typeof CreateSubtaskSchema>;
export type UpdateSubtaskDto = z.infer<typeof UpdateSubtaskSchema>;
export type TodoQueryDto = z.infer<typeof TodoQuerySchema>;