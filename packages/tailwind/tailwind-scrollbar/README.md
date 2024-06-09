# @raulscoelho/tailwind-scrollbar

## Installation

```sh
yarn add @raulscoelho/tailwind-scrollbar
# or
npm i @raulscoelho/tailwind-scrollbar
```

## Usage

To use the `@raulscoelho/tailwind-scrollbar` plugin, you need to add it to your Tailwind CSS configuration file.

### Step 1: Configure Tailwind CSS
Add the plugin to your `tailwind.config.ts` file:

```ts
import type { Config } from 'tailwindcss'
import { tailwindScrollbar } from '@raulscoelho/tailwind-scrollbar'

const config: Config = {
  // other configurations...
  plugins: [
    tailwindScrollbar()
  ]
}

export default config
```

### Step 2: Customize the Configuration (Optional)
You can customize the scrollbar by passing a configuration object to the plugin. The configuration object can contain `colors` and `layout` properties to define the appearance of the scrollbar.

#### Colors Configuration
The `colors` property allows you to define custom colors for the scrollbar thumb and track.

```ts
const colors = {
  thumb: '#e4e4e7', // color for the scrollbar thumb
  thumbHover: '#d4d4d8', // color for the scrollbar thumb on hover
  thumbActive: '#a1a1aa', // color for the scrollbar thumb on active
  track: '#f4f4f5' // color for the scrollbar track
}
```

#### Layout Configuration
The `layout` property allows you to define custom dimensions and border radius for the scrollbar components.

```ts
const layout = {
  width: '0.5rem', // width of the scrollbar
  thumbRadius: '9999px' // border radius of the scrollbar thumb
}
```

### Complete Example
Here is a complete example of configuring the `@raulscoelho/tailwind-scrollbar` plugin:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import { tailwindScrollbar } from '@raulscoelho/tailwind-scrollbar'

const config: Config = {
  // other configurations...
  plugins: [
    tailwindScrollbar({
      colors: {
        thumb: '#e4e4e7',
        thumbHover: '#d4d4d8',
        thumbActive: '#a1a1aa',
        track: '#f4f4f5'
      },
      layout: {
        width: '0.5rem',
        thumbRadius: '9999px'
      }
    })
  ]
}

export default config
```

### Next.js Integration
Below is an example showcasing how to integrate the `@raulscoelho/tailwind-scrollbar` plugin into a Next.js project:

```tsx
import './globals.css'

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Scrollbar Application - Home',
    template: 'Scrollbar Application - %s'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.className} antialiased`}>
      <body className="flex min-h-[100dvh] flex-col overflow-auto scroll-smooth bg-indigo-50 scrollbar-thumb-active-indigo-400 scrollbar-thumb-hover-indigo-300 scrollbar-thumb-indigo-200 scrollbar-track-indigo-50">
        {children}
      </body>
    </html>
  )
}
```

## CSS Variables
The plugin creates CSS variables to apply the custom styles to the scrollbar:
- `--scrollbar-width`
- `--scrollbar-height`
- `--scrollbar-thumb`
- `--scrollbar-thumb-hover`
- `--scrollbar-thumb-active`
- `--scrollbar-track`
- `--scrollbar-thumb-radius`
- `--scrollbar-track-radius`


You can use these variables in your custom CSS if needed:

```css
/* custom.css */
.custom-scrollbar {
  --scrollbar-width: 10px;
  --scrollbar-height: 10px;
  --scrollbar-thumb: #4A5568;
  --scrollbar-track: #EDF2F7;
  --scrollbar-thumb-radius: 5px;
  --scrollbar-track-radius: 5px;
}
```
