import React from "react";
import { Icon, IconName } from "../Icon";
import "./TransportButton.css";

export interface TransportButtonProps {
  icon: IconName;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  recording?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function TransportButton({
  icon,
  onClick,
  disabled = false,
  active = false,
  recording = false,
  ariaLabel,
  className = "",
}: TransportButtonProps) {
  const handleClick = () => {
    if (!disabled && onClick) onClick();
  };

  return (
    <button
      className={`transport-button ${active ? "transport-button--active" : ""} ${recording ? "transport-button--recording" : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      type="button"
      aria-label={ariaLabel}
    >
      <Icon name={icon} size={14} className="transport-button__icon" />
    </button>
  );
}
