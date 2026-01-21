import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export interface KanbanColumn<T> {
    id: string;
    label: string;
    color?: string; // Border/Badge color class
    items: T[];
}

interface KanbanBoardProps<T> {
    columns: KanbanColumn<T>[];
    renderCard: (item: T) => React.ReactNode;
    keyExtractor: (item: T) => string | number;
    onCardClick?: (item: T, columnId: string) => void;
}

export function KanbanBoard<T>({
    columns,
    renderCard,
    keyExtractor,
    onCardClick
}: KanbanBoardProps<T>) {
    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="h-full flex gap-6 min-w-full">
                {columns.map(col => (
                    <div key={col.id} className="flex-1 min-w-[300px] max-w-sm flex flex-col h-full bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">{col.label}</h3>
                            <span className={cn("text-xs px-2 py-1 rounded-full font-bold bg-gray-200 text-gray-700", col.color)}>
                                {col.items.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            <AnimatePresence mode="popLayout">
                                {col.items.map((item) => (
                                    <motion.div
                                        layout
                                        layoutId={`kanban-${keyExtractor(item)}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={keyExtractor(item)}
                                        onClick={() => onCardClick?.(item, col.id)}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow group"
                                        whileHover={{ y: -2 }}
                                    >
                                        {renderCard(item)}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {col.items.length === 0 && (
                                <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                    No items
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
