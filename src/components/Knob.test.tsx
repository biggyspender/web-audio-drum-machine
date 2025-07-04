import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Knob } from './Knob';

describe('Knob Component', () => {
  const defaultProps = {
    min: 0,
    max: 100,
    value: 50,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Knob {...defaultProps} />);
      
      const knob = screen.getByRole('slider');
      expect(knob).toBeInTheDocument();
      expect(knob).toHaveAttribute('aria-valuemin', '0');
      expect(knob).toHaveAttribute('aria-valuemax', '100');
      expect(knob).toHaveAttribute('aria-valuenow', '50');
    });

    it('should render with label', () => {
      render(<Knob {...defaultProps} label="Volume" />);
      
      const label = screen.getByText('Volume');
      expect(label).toBeInTheDocument();
      
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('aria-labelledby');
    });

    it('should render text input field', () => {
      render(<Knob {...defaultProps} label="Volume" />);
      
      const textInput = screen.getByLabelText('Volume input field');
      expect(textInput).toBeInTheDocument();
      expect(textInput).toHaveValue('50');
    });

    it('should apply custom size', () => {
      render(<Knob {...defaultProps} size={80} />);
      
      const knob = screen.getByRole('slider');
      expect(knob).toHaveStyle({ width: '80px', height: '80px' });
    });

    it('should apply custom className', () => {
      render(<Knob {...defaultProps} className="custom-class" />);
      
      const container = screen.getByRole('slider').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Value Formatting', () => {
    it('should display value with correct precision', () => {
      render(<Knob {...defaultProps} value={50.123} precision={2} />);
      
      const textInput = screen.getByDisplayValue('50.12');
      expect(textInput).toBeInTheDocument();
    });

    it('should display integer values without decimal places', () => {
      render(<Knob {...defaultProps} value={75} precision={0} />);
      
      const textInput = screen.getByDisplayValue('75');
      expect(textInput).toBeInTheDocument();
    });

    it('should update aria-valuetext based on precision', () => {
      render(<Knob {...defaultProps} value={33.456} precision={1} />);
      
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('aria-valuetext', '33.5');
    });
  });

  describe('Keyboard Interaction', () => {
    it('should increase value on ArrowUp', () => {
      render(<Knob {...defaultProps} step={5} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(55);
    });

    it('should decrease value on ArrowDown', () => {
      render(<Knob {...defaultProps} step={5} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowDown' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(45);
    });

    it('should increase value on ArrowRight', () => {
      render(<Knob {...defaultProps} step={2} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowRight' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(52);
    });

    it('should decrease value on ArrowLeft', () => {
      render(<Knob {...defaultProps} step={2} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowLeft' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(48);
    });

    it('should handle PageUp for large increments', () => {
      render(<Knob {...defaultProps} step={1} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'PageUp' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(60);
    });

    it('should handle PageDown for large decrements', () => {
      render(<Knob {...defaultProps} step={1} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'PageDown' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(40);
    });

    it('should clamp value to maximum', () => {
      render(<Knob {...defaultProps} value={95} step={10} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(100);
    });

    it('should clamp value to minimum', () => {
      render(<Knob {...defaultProps} value={5} step={10} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowDown' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Text Input Interaction', () => {
    it('should update value through text input', () => {
      render(<Knob {...defaultProps} />);
      
      const textInput = screen.getByDisplayValue('50');
      fireEvent.change(textInput, { target: { value: '75' } });
      fireEvent.blur(textInput);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(75);
    });

    it('should clamp text input to max value', () => {
      render(<Knob {...defaultProps} />);
      
      const textInput = screen.getByDisplayValue('50');
      fireEvent.change(textInput, { target: { value: '150' } });
      fireEvent.blur(textInput);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(100);
    });

    it('should clamp text input to min value', () => {
      render(<Knob {...defaultProps} />);
      
      const textInput = screen.getByDisplayValue('50');
      fireEvent.change(textInput, { target: { value: '-10' } });
      fireEvent.blur(textInput);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(0);
    });

    it('should reset to current value on invalid input', () => {
      render(<Knob {...defaultProps} value={42} />);
      
      const textInput = screen.getByDisplayValue('42');
      fireEvent.change(textInput, { target: { value: 'invalid' } });
      fireEvent.blur(textInput);
      
      expect(defaultProps.onChange).not.toHaveBeenCalled();
      expect(textInput).toHaveValue('42');
    });

    it('should submit value on Enter key', () => {
      render(<Knob {...defaultProps} />);
      
      const textInput = screen.getByDisplayValue('50');
      fireEvent.change(textInput, { target: { value: '80' } });
      fireEvent.keyDown(textInput, { key: 'Enter' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(80);
    });
  });

  describe('Step and Precision', () => {
    it('should apply step correctly', () => {
      render(<Knob {...defaultProps} step={0.5} value={10} precision={1} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(10.5);
    });

    it('should apply precision correctly', () => {
      render(<Knob {...defaultProps} step={0.1} precision={1} value={10.0} />);
      
      const textInput = screen.getByDisplayValue('10.0');
      expect(textInput).toBeInTheDocument();
    });

    it('should round values according to precision', () => {
      render(<Knob {...defaultProps} precision={1} />);
      
      const textInput = screen.getByDisplayValue('50.0');
      fireEvent.change(textInput, { target: { value: '75.678' } });
      fireEvent.blur(textInput);
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(75.7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle min equals max', () => {
      render(<Knob {...defaultProps} min={50} max={50} value={50} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      
      // Should call onChange even when min equals max (provides feedback)
      expect(defaultProps.onChange).toHaveBeenCalledWith(50);
    });

    it('should handle negative ranges', () => {
      render(<Knob {...defaultProps} min={-100} max={-50} value={-75} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(-74);
    });

    it('should handle very small step values', () => {
      render(<Knob {...defaultProps} step={0.001} precision={3} />);
      
      const knob = screen.getByRole('slider');
      fireEvent.keyDown(knob, { key: 'ArrowUp' });
      
      expect(defaultProps.onChange).toHaveBeenCalledWith(50.001);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Knob {...defaultProps} label="Volume" ariaDescribedBy="help-text" />);
      
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('aria-labelledby');
      expect(knob).toHaveAttribute('aria-describedby', 'help-text');
      expect(knob).toHaveAttribute('aria-valuemin', '0');
      expect(knob).toHaveAttribute('aria-valuemax', '100');
      expect(knob).toHaveAttribute('aria-valuenow', '50');
      expect(knob).toHaveAttribute('aria-valuetext', '50');
    });

    it('should be focusable', () => {
      render(<Knob {...defaultProps} />);
      
      const knob = screen.getByRole('slider');
      expect(knob).toHaveAttribute('tabIndex', '0');
      
      knob.focus();
      expect(knob).toHaveFocus();
    });

    it('should have screen reader only value text', () => {
      render(<Knob {...defaultProps} value={75} />);
      
      const valueText = screen.getByText('75');
      expect(valueText).toHaveClass(/srOnly/);
    });
  });

  describe('Props Validation', () => {
    it('should use default values for optional props', () => {
      const { onChange } = defaultProps;
      render(<Knob min={0} max={100} value={50} onChange={onChange} />);
      
      const knob = screen.getByRole('slider');
      expect(knob).toHaveStyle({ width: '60px', height: '60px' }); // default size
    });

    it('should handle name prop', () => {
      render(<Knob {...defaultProps} name="volume-control" />);
      
      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveAttribute('name', 'volume-control');
    });
  });
});
