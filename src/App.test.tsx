import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders expo log heading', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { name: /大阪・関西万博パビリオン訪問記録/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders setup completion message', () => {
    render(<App />)
    const message = screen.getByText(/プロジェクトセットアップが完了しました/i)
    expect(message).toBeInTheDocument()
  })
})