import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface CardStackProps<T> {
    title: string;
    items: T[];
    renderCard: (item: T) => React.ReactNode;
    renderStackCard?: (item: T) => React.ReactNode;
    keyExtractor: (item: T) => string | number;
    onCardClick?: (item: T) => void;
    color?: string; // Tailwind text color class
    bgColor?: string; // Tailwind bg class
    isActive?: boolean;
    onActivate?: () => void;
}

export function CardStack<T>({
    title,
    items,
    renderCard,
    renderStackCard,
    keyExtractor,
    onCardClick,
    color = "text-gray-800",
    bgColor = "bg-gray-200",
    isActive = false,
    onActivate
}: CardStackProps<T>) {

    return (
        <motion.div
            layout
            initial={false}
            onClick={onActivate}
            animate={{
                flex: isActive ? 1 : 0,
                width: isActive ? "auto" : 260,
                opacity: isActive ? 1 : 0.6,
                scale: isActive ? 1 : 0.95,
                filter: isActive ? 'grayscale(0%)' : 'grayscale(40%)'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "relative rounded-2xl p-4 transition-all duration-300 min-h-[300px]",
                isActive ? "shadow-xl bg-white dark:bg-gray-800 ring-1 ring-violet-500/20" : "cursor-pointer hover:opacity-80 bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:scale-105"
            )}
        >
            <motion.h3 layout="position" className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full", bgColor)} style={{ backgroundColor: 'currentColor' }} />
                <span className={color}>{title}</span>
                <span className="text-gray-400 text-sm">({items.length})</span>
            </motion.h3>

            {isActive ? (
                // Expanded Grid View
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                layoutId={`card-${keyExtractor(item)}`}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                key={keyExtractor(item)}
                                onClick={(e) => { e.stopPropagation(); onCardClick?.(item); }}
                                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md cursor-pointer group hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
                                whileHover={{ y: -5 }}
                            >
                                {renderCard(item)}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {items.length === 0 && <div className="text-gray-400 italic">No items in this stack.</div>}
                </motion.div>
            ) : (
                // Collapsed Stack View
                <div className="relative h-64 w-full">
                    {items.slice(0, 3).reverse().map((item, index) => {
                        const reverseIndex = Math.min(items.length, 3) - 1 - index;
                        return (
                            <motion.div
                                layoutId={`card-${keyExtractor(item)}`}
                                key={keyExtractor(item)}
                                className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-4 overflow-hidden"
                                style={{
                                    zIndex: index,
                                    top: reverseIndex * 8, // stack offset
                                    scale: 1 - (reverseIndex * 0.05),
                                }}
                            >
                                {index === items.length - 1 || index === 2 ? (
                                    (renderStackCard || renderCard)(item)
                                ) : <div className="w-full h-full bg-gray-100 dark:bg-gray-900 rounded opacity-50" />}
                            </motion.div>
                        );
                    })}
                    {items.length === 0 && (
                        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                            Empty
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
