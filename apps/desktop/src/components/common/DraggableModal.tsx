import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

interface DraggableModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string | ReactNode;
    children: ReactNode;
    className?: string; // Custom classes for the modal body
    maxWidth?: string;  // e.g. 'max-w-md', 'max-w-2xl', 'max-w-4xl'
}

export default function DraggableModal({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    maxWidth = 'max-w-2xl'
}: DraggableModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Reset position when opened
    useEffect(() => {
        if (isOpen) {
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent dragging if clicking inside input/button on header (if any)
        if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;

        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    if (!isOpen) return null;

    return (
        // Overlay (blocks clicks underneath)
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in pointer-events-auto"
            onClick={onClose}
        >
            {/* Draggable Container */}
            <div
                ref={modalRef}
                className={`bg-white dark:bg-[#121212] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col`}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    maxHeight: '90vh', // Prevent from going out of screen height
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                onClick={(e) => e.stopPropagation()} // Prevent overlay click
            >
                {/* Header (Drag Handle) */}
                <div 
                    className="p-5 border-b border-[var(--color-border)] flex items-center justify-between cursor-move bg-black/20 shrink-0 rounded-t-2xl select-none"
                    onMouseDown={handleMouseDown}
                >
                    <div className="font-bold text-lg text-gray-900 dark:text-white flex-1 truncate mr-4">
                        {title}
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--color-muted)] hover:text-white hover:bg-red-500/80 transition-colors shrink-0 cursor-pointer pointer-events-auto"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className={`p-6 overflow-y-auto custom-scrollbar ${className}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
