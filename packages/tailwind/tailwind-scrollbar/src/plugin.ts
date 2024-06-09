import deepMerge from 'deepmerge'
import plugin from 'tailwindcss/plugin'
const flattenColorPalette = require("tailwindcss/lib/util/flattenColorPalette");

import { Colors, Layout, defaultColors, defaultLayout, flattenThemeObject, getColorVariables } from './utils'
import mapKeys from 'lodash.mapkeys'
import kebabCase from 'lodash.kebabcase'

const DEFAULT_PREFIX = 'scrollbar'

interface Config {
  colors?: Colors
  layout?: Layout
}

// @internal
function resolveConfig({ colors, layout }: Config, prefix: string) {
  const resolved: {
    layout: Record<string, any>
    colors: Record<string, any>
  } = {
    colors: {},
    layout: {}
  }
  const cssSelector = ':root'
  const flatColors = flattenThemeObject(colors) as Record<string, string>
  const flatLayout = layout ? mapKeys(layout, (value, key) => kebabCase(key)) : {}

  resolved.colors[cssSelector] = {}
  resolved.layout[cssSelector] = {}

  /**
   * Colors
   */
  for (const colorsEntries of Object.entries(flatColors)) {
    const colorName = kebabCase(colorsEntries[0])
    const colorValue = colorsEntries[1]

    if (!colorValue) continue

    try {
      const { hsl, defaultAlphaValue, scrollbarColorVariable } = getColorVariables(colorName, colorValue, prefix)

      // set the css variable in "@layer utilities"
      resolved.colors[cssSelector]![scrollbarColorVariable] = `hsl(${hsl})`

      // if an alpha value was provided in the color definition, store it in a css variable
      if (typeof defaultAlphaValue === 'number') {
        resolved.colors[cssSelector]![scrollbarColorVariable] = `hsl(${hsl} / ${defaultAlphaValue.toFixed(2)})`
      }
    } catch (error: any) {
      console.log('error', error?.message)
    }
  }

  /**
   * Layout
   */
  for (const [key, value] of Object.entries(flatLayout)) {
    if (!value) continue

    const layoutVariablePrefix = `--${prefix}-${key}`

    if (typeof value === 'object') {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        const nestedLayoutVariable = `${layoutVariablePrefix}-${nestedKey}`

        resolved.layout[cssSelector]![nestedLayoutVariable] = nestedValue
      }
    } else {
      // Handle opacity values and other singular layout values
      const formattedValue =
        layoutVariablePrefix.includes('opacity') && typeof value === 'number'
          ? value.toString().replace(/^0\./, '.')
          : value

      resolved.layout[cssSelector]![layoutVariablePrefix] = formattedValue
    }
  }

  return resolved
}

export interface TailwindScrollbarConfig {
  colors?: Colors
  layout?: Layout
  prefix?: string
}

export function tailwindScrollbar({
  colors = defaultColors,
  layout = defaultLayout,
  prefix = DEFAULT_PREFIX
}: TailwindScrollbarConfig = {}) {
  const resolved = resolveConfig({ colors, layout }, prefix)
  const utilities = deepMerge(resolved.colors, resolved.layout)

  return plugin(({ addBase, addUtilities, matchUtilities, theme }) => {
    addBase({
      '::-webkit-scrollbar': {
        width: `var(--${prefix}-width)`,
        height: `var(--${prefix}-height)`
      },

      '::-webkit-scrollbar-thumb': {
        backgroundColor: `var(--${prefix}-thumb) !important`,
        borderRadius: `var(--${prefix}-thumb-radius, 0) !important`,
        border: `0.18rem solid var(--${prefix}-track) !important`
      },

      '::-webkit-scrollbar-thumb:hover': {
        backgroundColor: `var(--${prefix}-thumb-hover) !important`
      },

      '::-webkit-scrollbar-thumb:active': {
        backgroundColor: `var(--${prefix}-thumb-active) !important`
      },

      '::-webkit-scrollbar-track': {
        backgroundColor: `var(--${prefix}-track) !important`,
        borderRadius: `var(--${prefix}-track-radius, 0) !important`
      }
    })

    // add the css variables to "@layer utilities"
    addUtilities(utilities)

    matchUtilities(
      {
        [`${prefix}-w`]: value => ({
          [`--${prefix}-width`]: value
        }),
        [`${prefix}-h`]: value => ({
          [`--${prefix}-height`]: value
        })
      },
      {
        values: theme('spacing')
      }
    )

    matchUtilities(
      {
        [`${prefix}-thumb-rounded`]: value => ({
          [`--${prefix}-thumb-radius`]: value
        }),
        [`${prefix}-track-rounded`]: value => ({
          [`--${prefix}-track-radius`]: value
        })
      },
      {
        values: theme('borderRadius')
      }
    )

    matchUtilities(
      Object.keys(resolved.colors[':root'] ?? {}).reduce(
        (acc, key) => {
          acc[key.slice(2)] = (value: any) => ({
            [key]: typeof value === 'function' ? value({}) : value
          })
          return acc
        },
        {} as Record<string, any>
      ),
      {
        type: 'color',
        values: flattenColorPalette(theme('colors'))
      }
    )
  })
}
