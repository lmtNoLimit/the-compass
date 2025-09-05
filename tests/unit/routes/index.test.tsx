import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '~/routes/_index';

describe('Index Route', () => {
  it('renders the welcome message', () => {
    render(<Index />);
    expect(screen.getByText('Welcome to Persona Compass')).toBeDefined();
  });

  it('renders the description', () => {
    render(<Index />);
    expect(screen.getByText('AI-Powered Feature Brief Generation Platform')).toBeDefined();
  });
});