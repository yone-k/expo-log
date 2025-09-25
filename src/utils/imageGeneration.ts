import html2canvas from 'html2canvas'

export async function captureMapAsPng(selector: string): Promise<string> {
  const element = document.querySelector(selector)
  if (!(element instanceof HTMLElement)) {
    throw new Error(`指定された要素が見つかりません: ${selector}`)
  }

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
  })

  return canvas.toDataURL('image/png')
}

export async function downloadPng(dataUrl: string, filename: string): Promise<void> {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function buildFilename(prefix = 'expo-visited'): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')

  return `${prefix}-${yyyy}${mm}${dd}.png`
}
