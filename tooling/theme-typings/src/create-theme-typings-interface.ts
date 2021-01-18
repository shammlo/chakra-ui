import { isObject } from "@chakra-ui/utils"
import { formatWithPrettierIfAvailable } from "./format-with-prettier"
import { extractPropertyPaths, printUnionMap } from "./extract-property-paths"
import {
  extractComponentTypes,
  printComponentTypes,
} from "./extract-component-types"
import { extractColorSchemeTypes } from "./extract-color-schemes"

export interface ThemeKeyOptions {
  /**
   * Property key in the theme object
   * @example colors
   */
  key: string
  /**
   * Maximum extraction level
   * @example
   * union: gray.500
   * level: 1---|2--|
   * @default 1
   */
  maxScanDepth?: number
  /**
   * Pass a function to filter extracted values
   * @example
   * Exclude numeric index values from `breakpoints`
   * @default () => true
   */
  filter?: (value: string) => boolean
}

export interface CreateThemeTypingsInterfaceOptions {
  config: ThemeKeyOptions[]
}

export async function createThemeTypingsInterface(
  theme: Record<string, unknown>,
  { config }: CreateThemeTypingsInterfaceOptions,
) {
  const unions = config.reduce((allUnions, { key, maxScanDepth, filter }) => {
    const target = theme[key]
    if (isObject(target) || Array.isArray(target)) {
      allUnions[key] = extractPropertyPaths(target, maxScanDepth).filter(
        filter ?? (() => true),
      )
    } else {
      allUnions[key] = []
    }
    return allUnions
  }, {} as Record<string, string[]>)

  const componentTypes = extractComponentTypes(theme)
  const colorSchemes = extractColorSchemeTypes(theme)

  const template =
    // language=ts
    `// regenerate by running
// npx @chakra-ui/theme-typings path/to/your/theme.(js|ts)
export interface ThemeTypings {
  ${printUnionMap(unions)}
  ${printUnionMap({ colorSchemes })}
  ${printComponentTypes(componentTypes)}
}

`

  return formatWithPrettierIfAvailable(template)
}