import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OTHER = "__other";

type Props = {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
};

/** A list picker with an "Other…" choice that switches to free typing. */
export function PickOrType({ id, label, value, options, onChange, required, placeholder, disabled }: Props) {
  const [typing, setTyping] = useState(value !== "" && !options.includes(value));
  const isTyping = typing || (value !== "" && !options.includes(value));

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={isTyping ? OTHER : value}
        disabled={disabled}
        onValueChange={(s) => {
          if (s === OTHER) { setTyping(true); onChange(""); }
          else { setTyping(false); onChange(s); }
        }}
      >
        <SelectTrigger id={id}><SelectValue placeholder="Choose…" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          <SelectItem value={OTHER}>Other…</SelectItem>
        </SelectContent>
      </Select>
      {isTyping && (
        <Input
          aria-label={`${label} (typed)`}
          autoFocus
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
