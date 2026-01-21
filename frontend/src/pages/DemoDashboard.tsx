import React, { useState } from 'react';
import { CardStack } from '../components/CardStack';
import { KanbanBoard } from '../components/KanbanBoard';
import type { KanbanColumn } from '../components/KanbanBoard';

const MOCK_ITEMS = [
    { id: 1, title: 'Item 1', status: 'TODO', color: 'bg-red-500' },
    { id: 2, title: 'Item 2', status: 'TODO', color: 'bg-blue-500' },
    { id: 3, title: 'Item 3', status: 'IN_PROGRESS', color: 'bg-green-500' },
    { id: 4, title: 'Item 4', status: 'DONE', color: 'bg-yellow-500' },
    { id: 5, title: 'Item 5', status: 'TODO', color: 'bg-purple-500' },
];

export default function DemoDashboard() {
    const [activeStack, setActiveStack] = useState<string | null>('TODO');
    const [view, setView] = useState<'STACK' | 'KANBAN'>('STACK');

    const groupedItems: Record<string, typeof MOCK_ITEMS> = {
        TODO: MOCK_ITEMS.filter(i => i.status === 'TODO'),
        IN_PROGRESS: MOCK_ITEMS.filter(i => i.status === 'IN_PROGRESS'),
        DONE: MOCK_ITEMS.filter(i => i.status === 'DONE'),
    };

    const columns: KanbanColumn<typeof MOCK_ITEMS[0]>[] = [
        { id: 'TODO', label: 'To Do', items: groupedItems.TODO, color: 'bg-red-100 text-red-800' },
        { id: 'IN_PROGRESS', label: 'In Progress', items: groupedItems.IN_PROGRESS, color: 'bg-blue-100 text-blue-800' },
        { id: 'DONE', label: 'Done', items: groupedItems.DONE, color: 'bg-green-100 text-green-800' },
    ];

    const renderCard = (item: typeof MOCK_ITEMS[0]) => (
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center text-white font-bold`}>
                {item.title[0]}
            </div>
            <div>
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.status}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 text-gray-900 dark:text-white">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Solitaire Stack Demo</h1>
                    <p className="text-gray-500">React + Fastify Starter Kit</p>
                </div>
                <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700">
                    <button
                        onClick={() => setView('STACK')}
                        className={`px-4 py-2 rounded-md transition ${view === 'STACK' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}
                    >
                        Solitaire View
                    </button>
                    <button
                        onClick={() => setView('KANBAN')}
                        className={`px-4 py-2 rounded-md transition ${view === 'KANBAN' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-gray-50'}`}
                    >
                        Kanban View
                    </button>
                </div>
            </header>

            {view === 'STACK' ? (
                <div className="flex gap-6 overflow-x-auto pb-8 items-start min-h-[500px]">
                    {Object.entries(groupedItems).map(([status, items]) => (
                        <CardStack
                            key={status}
                            title={status}
                            items={items}
                            renderCard={renderCard}
                            keyExtractor={(item) => item.id}
                            isActive={activeStack === status}
                            onActivate={() => setActiveStack(status)}
                        />
                    ))}
                </div>
            ) : (
                <KanbanBoard
                    columns={columns}
                    renderCard={renderCard}
                    keyExtractor={(item) => item.id}
                    onCardClick={(item) => alert(`Clicked ${item.title}`)}
                />
            )}
        </div>
    );
}
