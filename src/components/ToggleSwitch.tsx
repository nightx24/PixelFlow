import React from 'react';
import { Check } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  accentColor?: string;
  accentInk?: string;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  accentColor = '#C4B5FD',
  accentInk,
  size = 'md',
  ariaLabel,
}) => {
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) onChange(!checked);
        }
      }}
      className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D1E23] select-none ${
        isSm ? 'w-[38px] h-[22px] p-[2px]' : 'w-[48px] h-[28px] p-[3px]'
      } ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
      } ${
        checked
          ? 'shadow-md shadow-black/25'
          : 'bg-[#2A2B32] hover:bg-[#34353E] border border-white/10'
      }`}
      style={{
        backgroundColor: checked ? accentColor : undefined,
        outlineColor: accentColor,
      }}
    >
      <span
        className={`pointer-events-none rounded-full transform transition-all duration-300 ease-out shadow-sm flex items-center justify-center shrink-0 ${
          isSm ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'
        } ${
          checked
            ? isSm
              ? 'translate-x-[16px] bg-[#16171B] text-[#F5F4FA]'
              : 'translate-x-[20px] bg-[#16171B] text-[#F5F4FA]'
            : 'translate-x-0 bg-[#A6A6B2]'
        }`}
      >
        {checked && (
          <Check 
            className={`${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} stroke-[3.5] transition-transform`}
            style={{ color: accentColor }}
          />
        )}
      </span>
    </button>
  );
};
