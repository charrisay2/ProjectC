import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface CreatableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  defaultOptions: string[];
  storageKey: string;
  placeholder?: string;
  required?: boolean;
}

export default function CreatableSelect({ label, value, onChange, defaultOptions, storageKey, placeholder, required }: CreatableSelectProps) {
  const [options, setOptions] = useState<string[]>(defaultOptions);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = Array.from(new Set([...defaultOptions, ...parsed]));
        setOptions(merged);
      } catch (e) {
        setOptions(defaultOptions);
      }
    } else {
      setOptions(defaultOptions);
    }
  }, [defaultOptions, storageKey]);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to value if not selected
        setInputValue(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()));
  const isExactMatch = options.some(opt => opt.toLowerCase() === inputValue.toLowerCase());

  const handleSelect = (opt: string) => {
    setInputValue(opt);
    onChange(opt);
    setIsOpen(false);
  };

  const handleCreate = () => {
    if (window.confirm(`Đây là ${label.toLowerCase()} mới, bạn có muốn tạo không?`)) {
      const newOptions = [...options, inputValue];
      setOptions(newOptions);
      
      // Save custom options to local storage
      const customOptions = newOptions.filter(o => !defaultOptions.includes(o));
      localStorage.setItem(storageKey, JSON.stringify(customOptions));
      
      onChange(inputValue);
      setIsOpen(false);
    } else {
      setInputValue(value || ''); // revert
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="input-field w-full pr-10"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || `Chọn hoặc nhập ${label.toLowerCase()}...`}
          required={required}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((opt, idx) => (
            <div
              key={idx}
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700"
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
          
          {inputValue && !isExactMatch && (
            <div
              className="px-4 py-2 hover:bg-primary/5 cursor-pointer text-primary font-medium border-t border-slate-100 flex items-center gap-2"
              onClick={handleCreate}
            >
              <span className="text-xl leading-none">+</span> Thêm mới "{inputValue}"
            </div>
          )}
          
          {filteredOptions.length === 0 && (!inputValue || isExactMatch) && (
            <div className="px-4 py-2 text-slate-500 italic text-sm">Không có dữ liệu</div>
          )}
        </div>
      )}
    </div>
  );
}
