import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Knob.module.css";

interface KnobProps {
  /** Minimum value of the knob */
  min: number;
  /** Maximum value of the knob */
  max: number;
  /** Current value of the knob */
  value: number;
  /** Function called when the value changes */
  onChange: (value: number) => void;
  /** Optional text label for the knob */
  label?: string;
  /** Size of the knob in pixels */
  size?: number;
  /** Step increment for value changes */
  step?: number;
  /** Decimal precision for the value */
  precision?: number;
  /** Additional CSS class name */
  className?: string;
  /** Name attribute for the input element */
  name?: string;
  /** Optional description for screen readers */
  ariaDescribedBy?: string;
}

export const Knob: React.FC<KnobProps> = ({
  min,
  max,
  value,
  onChange,
  label,
  size = 60,
  step = 1,
  precision = 0,
  className = "",
  name = label,
  ariaDescribedBy,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  const [textValue, setTextValue] = useState(value.toFixed(precision));
  const [isFocused, setIsFocused] = useState(false);
  const isEscapingRef = useRef(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const lastYRef = useRef<number | null>(null);
  const accumulatedDeltaRef = useRef<number>(0);
  const originalValueRef = useRef<string>(value.toFixed(precision));
  const labelId = useRef(
    `${name || "knob"}-label-${Math.random().toString(36).substr(2, 9)}`
  );
  const valueTextId = useRef(
    `${name || "knob"}-valuetext-${Math.random().toString(36).substr(2, 9)}`
  );

  // Normalize the value to a percentage (0-1) for visual rotation
  const normalizedValue = (value - min) / (max - min);
  // Convert to degrees (0-270 degrees rotation)
  const degrees = normalizedValue * 270 - 135;

  // Generate human-readable value text
  const getValueText = useCallback(() => {
    return `${value.toFixed(precision)}`;
  }, [value, precision]);

  // Keep the textValue synchronized with the actual value
  useEffect(() => {
    setTextValue(value.toFixed(precision));
    // Reset accumulated delta if the value changes from outside (through props)
    accumulatedDeltaRef.current = 0;
  }, [value, precision]);

  const processMovement = useCallback(
    (clientY: number, isCtrlKey: boolean = false) => {
      const lastY = lastYRef.current !== null ? lastYRef.current : clientY;

      // Calculate delta based on the last position, not the start position
      const deltaY = (lastY - clientY) * (isCtrlKey ? 0.0625 : 1);

      // Scale the movement based on the value range
      const valueRange = max - min;
      // Adjust sensitivity - smaller number = more sensitive
      const valueDelta = (deltaY / 200) * valueRange;

      // Add to accumulated delta
      accumulatedDeltaRef.current += valueDelta;

      // Calculate the new value using accumulated delta
      let newValue = value + accumulatedDeltaRef.current;
      const oldValue = value;

      // Apply step if provided
      if (step) {
        newValue = Math.round(newValue / step) * step;
      }

      // Clamp value to min/max
      newValue = Math.max(min, Math.min(max, newValue));

      // Apply precision rounding
      newValue = Number(newValue.toFixed(precision));

      // Only update if the value has changed
      if (newValue !== oldValue) {
        onChange(newValue);
        // Reset accumulated delta after a change is applied
        accumulatedDeltaRef.current = 0;
      }

      // Update the last position references
      lastYRef.current = clientY;
    },
    [min, max, value, onChange, step, precision]
  );

  const adjustValue = useCallback(
    (amount: number) => {
      // Calculate new value based on step, considering precision
      let newValue = value + amount * step;

      // Clamp value to min/max
      newValue = Math.max(min, Math.min(max, newValue));

      // Apply precision rounding
      newValue = Number(newValue.toFixed(precision));

      // Always call onChange to provide feedback, even if value doesn't change due to clamping
      onChange(newValue);
    },
    [value, min, max, step, precision, onChange]
  );

  // Define keyboard handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let handled = false;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowRight":
          adjustValue(1);
          handled = true;
          break;
        case "ArrowDown":
        case "ArrowLeft":
          adjustValue(-1);
          handled = true;
          break;
        case "PageUp":
          adjustValue(10);
          handled = true;
          break;
        case "PageDown":
          adjustValue(-10);
          handled = true;
          break;
        case "Home":
          onChange(min);
          handled = true;
          break;
        case "End":
          onChange(max);
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [adjustValue, onChange, min, max]
  );

  // Define handlers using useCallbacks with proper dependencies
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || lastYRef.current === null) return;
      processMovement(e.clientY, e.ctrlKey);
    },
    [processMovement]
  );

  // Touch move handler
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDraggingRef.current || lastYRef.current === null) return;
      e.preventDefault(); // Prevent scrolling when adjusting the knob
      const touch = e.touches[0];
      processMovement(touch.clientY);
    },
    [processMovement]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    lastYRef.current = null;
    // Reset accumulated delta when dragging ends
    accumulatedDeltaRef.current = 0;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    lastYRef.current = e.clientY;

    // Focus the knob element when interacted with
    if (knobRef.current) {
      knobRef.current.focus();
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      lastYRef.current = e.touches[0].clientY;

      // Focus the knob element when interacted with
      if (knobRef.current) {
        knobRef.current.focus();
      }
    },
    []
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Add event listeners for mouse and touch events
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";

      return () => {
        // Cleanup event listeners when dragging ends
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleEnd);
        window.removeEventListener("touchcancel", handleEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  // Cleanup event listeners if component unmounts while dragging
  useEffect(() => {
    return () => {
      // Reset cursor and text selection
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Remove event listeners
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [handleMouseMove, handleTouchMove, handleEnd]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
  };

  const handleTextFocus = () => {
    // Capture the original value when the input gains focus
    originalValueRef.current = value.toFixed(precision);
  };

  const handleTextFocusWithSelection = (e: React.FocusEvent<HTMLInputElement>) => {
    handleTextFocus();
    // Select all text when input gains focus
    e.target.select();
  };

  const handleTextBlur = () => {
    // Don't process blur if we're in the middle of escaping
    if (isEscapingRef.current) {
      isEscapingRef.current = false;
      return;
    }

    const newValue = parseFloat(textValue);

    if (!isNaN(newValue)) {
      // Clamp value to min/max
      const clampedValue = Math.max(min, Math.min(max, newValue));
      // Apply precision rounding
      const roundedValue = Number(clampedValue.toFixed(precision));

      // Reset accumulated delta when value changes via text input
      accumulatedDeltaRef.current = 0;
      onChange(roundedValue);
    } else {
      // If invalid input, reset to current value
      setTextValue(value.toFixed(precision));
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTextBlur();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      // Set flag to prevent blur handler from interfering
      isEscapingRef.current = true;
      
      // Restore the original value and move focus to knob
      const originalNumericValue = parseFloat(originalValueRef.current);
      if (!isNaN(originalNumericValue)) {
        onChange(originalNumericValue);
        // Also immediately update the text value in case the parent doesn't re-render
        setTextValue(originalValueRef.current);
      }

      e.currentTarget.blur();
      if (knobRef.current) {
        knobRef.current.focus();
      }
    }
  };

  return (
    <div
      className={`${styles.container} ${className} ${
        isDragging ? styles.dragging : ""
      }`}
      style={{ width: size }}
    >
      {label && (
        <div id={labelId.current} className={styles.label}>
          {label}
        </div>
      )}
      <div
        ref={knobRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={getValueText()}
        aria-labelledby={labelId.current}
        aria-describedby={ariaDescribedBy || valueTextId.current}
        className={`${styles.knob} ${isDragging ? styles.active : ""} ${
          isFocused ? styles.focused : ""
        }`}
        style={{
          width: size,
          height: size,
          transform: `rotate(${degrees}deg)`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <div className={styles.indicator} />
        <span
          id={valueTextId.current}
          className={styles.srOnly}
          aria-live="polite"
        >
          {getValueText()}
        </span>
      </div>
      <input
        type="text"
        className={styles.textInput}
        value={textValue}
        onChange={handleTextChange}
        onFocus={handleTextFocusWithSelection}
        onBlur={handleTextBlur}
        onKeyDown={handleTextKeyDown}
        size={3}
        name={name}
        aria-label={`${label || name || "Value"} input field`}
      />
    </div>
  );
};

export default Knob;
