import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string;
    isCustom?: boolean;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    allowCustom?: boolean;
    onAddCustom?: (val: string) => void;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Selecione...",
    allowCustom = false,
    onAddCustom,
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find the current selected label
    const selectedOption = options.find(o => o.value === value) || { label: value, value: value };
    const displayValue = isOpen ? searchTerm : (value ? selectedOption.label : '');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => 
        o.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCustomAdd = () => {
        if (!searchTerm) return;
        if (onAddCustom) {
            onAddCustom(searchTerm);
        } else {
            onChange(searchTerm); // fallback if no specific custom handler
        }
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div ref={wrapperRef} className="relative w-full text-left">
            <div 
                className={`flex items-center justify-between w-full p-3 bg-white/5 border border-white/10 rounded-xl transition-all cursor-text ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--color-primary)]/50 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20'}`}
                onClick={() => {
                    if (disabled) return;
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
            >
                <div className="flex items-center flex-1 min-w-0 pr-2">
                    {isOpen && <Search className="w-4 h-4 text-[var(--color-muted)] mr-2 shrink-0" />}
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full bg-transparent border-none outline-none text-white placeholder-[var(--color-muted)] truncate"
                        placeholder={placeholder}
                        value={displayValue}
                        onChange={(e) => {
                            setIsOpen(true);
                            setSearchTerm(e.target.value.toUpperCase());
                            if (!isOpen) onChange(''); // clear selection if start typing new
                        }}
                        readOnly={disabled}
                    />
                </div>
                <button 
                    type="button" 
                    className="p-1 text-[var(--color-muted)] hover:text-white shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (disabled) return;
                        setIsOpen(!isOpen);
                        if (!isOpen) inputRef.current?.focus();
                    }}
                >
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, i) => (
                            <button
                                key={i}
                                type="button"
                                className="w-full text-left p-3 text-white hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] transition-colors border-b border-white/5 last:border-0"
                                onClick={() => handleSelect(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-[var(--color-muted)]">
                            Nenhum resultado encontrado.
                        </div>
                    )}

                    {allowCustom && searchTerm && !filteredOptions.find(o => o.label.toUpperCase() === searchTerm.toUpperCase()) && (
                        <button
                            type="button"
                            className="w-full text-left p-3 flex items-center gap-2 text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-colors border-t border-white/10"
                            onClick={handleCustomAdd}
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar "{searchTerm.toUpperCase()}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
