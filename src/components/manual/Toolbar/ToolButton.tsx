import React from "react";
import { Icon, IconName } from "../Icon";
import "./ToolButton.css";

export interface ToolButtonProps {
  icon: IconName;
  size?: "small" | "default";
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function ToolButton({
  icon,
  size = "default",
  onClick,
  disabled = false,
  active = false,
  ariaLabel,
  className = "",
}: ToolButtonProps) {
  const handleClick = () => {
    if (!disabled && onClick) onClick();
  };

  const iconSize = size === "small" ? 14 : 16;

  return (
    <button
      className={`tool-button tool-button--${size} ${active ? "tool-button--active" : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      type="button"
      aria-label={ariaLabel}
    >
      <Icon name={icon} size={iconSize} className="tool-button__icon" />
    </button>
  );
}
