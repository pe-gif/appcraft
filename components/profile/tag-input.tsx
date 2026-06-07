"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TagInput({
  value,
  onChange,
  placeholder
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Input
        placeholder={placeholder ?? "Type comma-separated values"}
        onBlur={(event) => {
          const next = event.currentTarget.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
          if (next.length) {
            onChange([...value, ...next]);
            event.currentTarget.value = "";
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => (
          <Badge key={`${item}-${index}`} variant="secondary" className="gap-2">
            {item}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-4 px-1 text-xs"
              onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
            >
              x
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
