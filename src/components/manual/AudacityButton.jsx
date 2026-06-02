import { useState } from "react";
import "../../styles/icons.css";

export default function AudacityButton({
  icon,
  label,
  tooltip,
  toggleable = false,
  initiallyPressed = false,
}) {
  const [pressed, setPressed] = useState(initiallyPressed);

  const baseClasses =
    "inline-flex items-center gap-2 px-3 h-9 rounded-md border text-sm font-medium select-none transition-colors";
  const idleClasses = "border-gray-300 bg-white text-gray-800 hover:bg-gray-50";
  const pressedClasses =
    "border-blue-700 bg-blue-700 text-white hover:bg-blue-600";

  const handleClick = () => {
    if (toggleable) {
      setPressed((prev) => !prev);
    } else {
      setPressed(true);
      setTimeout(() => setPressed(false), 180);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltip}
      aria-pressed={toggleable ? pressed : undefined}
      className={`${baseClasses} ${pressed ? pressedClasses : idleClasses}`}
    >
      {icon && (
        <span className={`icon icon-small ${icon}`} aria-hidden="true" />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
