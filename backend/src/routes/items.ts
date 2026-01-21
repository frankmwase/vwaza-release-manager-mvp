import { FastifyInstance } from 'fastify';
import { createItem, getItems, updateItemStatus, deleteItem } from '../controllers/ItemController';

export async function itemRoutes(server: FastifyInstance) {
    server.post<{ Body: { title: string; description?: string } }>('/items', { onRequest: [server.authenticate] }, createItem);
    server.get('/items', { onRequest: [server.authenticate] }, getItems);
    server.put<{ Params: { id: string }, Body: { status: string } }>('/items/:id/status', { onRequest: [server.authenticate] }, updateItemStatus);
    server.delete<{ Params: { id: string } }>('/items/:id', { onRequest: [server.authenticate] }, deleteItem);
}
