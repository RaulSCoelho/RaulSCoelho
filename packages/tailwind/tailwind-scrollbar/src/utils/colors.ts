import Color from 'color'
import { DefaultColors } from 'tailwindcss/types/generated/colors'

export interface Colors {
  thumb?: string
  thumbHover?: string
  thumbActive?: string
  track?: string
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

export function flattenColorPalette(colors: DefaultColors) {
  return Object.assign({}, ...Object.entries(colors !== null && colors !== void 0 ? colors : {}).flatMap(([color, values]): any => {
    if (typeof values == "object") {
      return Object.entries(flattenColorPalette(values)).map(([number, hex]) => ({
        [color + (number === "DEFAULT" ? "" : `-${number}`)]: hex
      }))
    }
    return [{ [`${color}`]: values }]
  }))
}
