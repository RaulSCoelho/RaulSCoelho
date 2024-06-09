import Color from 'color'

export interface Colors {
  thumb: string
  thumbHover: string
  thumbActive: string
  track: string
}

export const defaultColors = {
  thumb: '#e4e4e7',
  thumbHover: '#d4d4d8',
  thumbActive: '#a1a1aa',
  track: '#f4f4f5'
}

const parsedColorsCache: Record<string, number[]> = {}

export function getColorVariables(colorName: string, colorValue: string, prefix: string) {
  const parsedColor = parsedColorsCache[colorValue] || Color(colorValue).hsl().round(2).array()

  parsedColorsCache[colorValue] = parsedColor

  const defaultAlphaValue = parsedColor[3]
  const [h, s, l] = parsedColor
  const hsl = `${h} ${s}% ${l}%`
  const scrollbarColorVariable = `--${prefix}-${colorName}`

  return { parsedColor, hsl, defaultAlphaValue, scrollbarColorVariable }
}
