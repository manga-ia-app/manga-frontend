"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface AddItemInlineProps {
  placeholder: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function AddItemInline({ placeholder, onConfirm, onCancel }: AddItemInlineProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && value.trim()) {
      onConfirm(value.trim());
      setValue("");
    }
    if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        if (!value.trim()) onCancel();
      }}
      className="h-8 text-sm"
    />
  );
}
