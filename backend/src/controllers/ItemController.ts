import { FastifyRequest, FastifyReply } from 'fastify';
import { ItemModel } from '../models/ItemModel';

export const createItem = async (req: FastifyRequest<{ Body: { title: string; description?: string } }>, reply: FastifyReply) => {
    const { title, description } = req.body;
    const user = req.user as any;

    if (!title) {
        return reply.status(400).send({ message: 'Title is required' });
    }

    const item = await ItemModel.create(user.id, title, description);
    return reply.status(201).send(item);
};

export const getItems = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as any;
    const items = await ItemModel.findAll(user.id);
    return reply.send(items);
};

export const updateItemStatus = async (req: FastifyRequest<{ Params: { id: string }, Body: { status: string } }>, reply: FastifyReply) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
        return reply.status(400).send({ message: 'Invalid status' });
    }

    // Check ownership
    const item = await ItemModel.findById(Number(id));
    if (!item) return reply.status(404).send({ message: 'Item not found' });

    const user = req.user as any;
    if (item.user_id !== user.id) return reply.status(403).send({ message: 'Unauthorized' });

    const updated = await ItemModel.updateStatus(Number(id), status);
    return reply.send(updated);
};

export const deleteItem = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params;

    // Check ownership
    const item = await ItemModel.findById(Number(id));
    if (!item) return reply.status(404).send({ message: 'Item not found' });

    const user = req.user as any;
    if (item.user_id !== user.id) return reply.status(403).send({ message: 'Unauthorized' });

    await ItemModel.delete(Number(id));
    return reply.status(204).send();
};
