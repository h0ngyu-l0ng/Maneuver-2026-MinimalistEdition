import { Select, SelectContent, SelectItem, SelectTrigger } from "@/core/components/ui/select";
import { cn } from "@/core/lib/utils";

export interface UniversalDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface UniversalDropdownProps {
  value: string;
  options: UniversalDropdownOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  title?: string;
}

export function UniversalDropdown({
  value,
  options,
  onValueChange,
  placeholder = "Select option",
  triggerClassName,
  contentClassName,
}: UniversalDropdownProps) {
  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption?.label || placeholder;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-10 w-full", triggerClassName)}>
        <span className="truncate">{displayText}</span>
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
