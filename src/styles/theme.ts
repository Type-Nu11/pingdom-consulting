// PingDom 웹 레포와 공유하는 스타일 기준입니다.
export const semanticColors = {
  primary: {
    normal: '#FF1956',
    alternative: '#FF1956',
    assistive: '#FFC9D3',
  },
  secondary: {
    normal: '#BFC1C1',
    alternative: '#D1D4D5',
    assistive: '#F8F8F8',
  },
  label: {
    normal: '#0C0C0D',
    strong: '#000000',
    neutral: '#3B3B40',
    alternative: '#5E5E66',
    assistive: '#767680',
    disabled: '#EFEFEF',
  },
  line: {
    normal: '#E4E4E5',
    neutral: '#F2F2F3',
    alternative: '#F6F6F7',
  },
  background: {
    normal: '#FFFFFF',
    neutral: '#F2F2F3',
    alternative: '#FCFCFD',
  },
  static: {
    black: '#000000',
    white: '#FFFFFF',
    info: '#008BFF',
  },
} as const

export const appColors = {
  background: semanticColors.background.normal,
  surface: semanticColors.background.normal,
  surfaceLow: semanticColors.secondary.assistive,
  border: semanticColors.line.normal,
  borderSoft: semanticColors.line.neutral,
  text: semanticColors.label.normal,
  strongText: semanticColors.label.strong,
  muted: semanticColors.label.alternative,
  softText: semanticColors.label.assistive,
  primary: semanticColors.primary.normal,
  primaryHover: semanticColors.primary.alternative,
  primarySoft: semanticColors.primary.assistive,
  primaryTint: '#FF19560A',
  primaryText: semanticColors.static.white,
  info: semanticColors.static.info,
  shadow: '#00000014',
} as const

export const theme = {
  semanticColors,
  appColors,
  color: {
    background: appColors.background,
    surface: appColors.surface,
    text: appColors.text,
    mutedText: appColors.muted,
    border: appColors.border,
    primary: appColors.primary,
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
} as const
