import { render, screen } from '@testing-library/react'
import Home from '../page'

// Mock the font import
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}))

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', {
      name: /NECTA - Chat Interface for n8n AI Agents/i,
    })
    
    expect(heading).toBeInTheDocument()
  })

  it('renders the description text', () => {
    render(<Home />)
    
    const description = screen.getByText(
      /Connect with your n8n AI agents through secure webhook communication/i
    )
    
    expect(description).toBeInTheDocument()
  })

  it('has the correct CSS classes applied', () => {
    render(<Home />)
    
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen', 'bg-background')
  })

  it('renders the container with proper structure', () => {
    render(<Home />)
    
    const container = screen.getByText(/NECTA - Chat Interface/i).closest('.container')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('container', 'mx-auto', 'p-4')
  })
})