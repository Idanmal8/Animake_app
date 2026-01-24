import { COLORS } from './colors'

export const lightTheme = {
  background: COLORS.white,
  backgroundSoft: COLORS.gray50,
  text: COLORS.gray900,
  textSoft: COLORS.gray600,
  border: COLORS.gray200,
  primary: COLORS.black,
  primaryText: COLORS.white,
}

export const darkTheme = {
  background: COLORS.gray950,
  backgroundSoft: COLORS.gray900,
  text: COLORS.gray100,
  textSoft: COLORS.gray400,
  border: COLORS.gray800,
  primary: COLORS.white,
  primaryText: COLORS.black,
}

// Type definition for theme structure
export type Theme = typeof lightTheme
