import { createGlobalStyle } from 'styled-components'
import { appColors } from './theme'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    color: ${appColors.text};
    background: ${appColors.background};
    font-family:
      'Pretendard',
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`
