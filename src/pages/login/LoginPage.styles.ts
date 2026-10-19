import styled from 'styled-components'
import { appColors } from '../../styles/theme'

export const Page = styled.main`
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background:
    radial-gradient(circle at 12% 20%, ${appColors.primaryTint}, transparent 28%),
    radial-gradient(circle at 88% 82%, ${appColors.primaryTint}, transparent 24%),
    ${appColors.background};
  @media (max-width: 640px) { padding: 32px 18px; }
`

export const Shell = styled.div`
  width: min(100%, 450px);
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const Logo = styled.img`
  width: min(320px, 82vw);
  height: auto;
  display: block;
`

export const Title = styled.h1`
  margin: 46px 0 0;
  color: ${appColors.strongText};
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  @media (max-width: 640px) { margin-top: 38px; }
`

export const Description = styled.p`
  margin: 14px 0 0;
  color: ${appColors.muted};
  font-size: 16px;
  line-height: 1.5;
  text-align: center;
`

export const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 34px;
  padding: 26px;
  border: 1px solid ${appColors.border};
  border-radius: 22px;
  background: ${appColors.surface};
  box-shadow: 0 16px 40px ${appColors.shadow};
  @media (max-width: 400px) { padding: 24px 20px; }
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  & + & { margin-top: 18px; }
`

export const Label = styled.label`
  color: ${appColors.text};
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
`

export const InputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  > svg {
    position: absolute;
    left: 14px;
    width: 20px;
    height: 20px;
    color: ${appColors.softText};
    pointer-events: none;
  }
`

export const Input = styled.input<{ $hasAction?: boolean }>`
  width: 100%;
  height: 52px;
  padding: 0 ${({ $hasAction }) => $hasAction ? '48px' : '16px'} 0 44px;
  border: 1px solid ${appColors.border};
  border-radius: 12px;
  outline: 0;
  background: #fafafa;
  color: ${appColors.text};
  font-size: 16px;
  transition: border-color 160ms ease, box-shadow 160ms ease;
  &::placeholder { color: ${appColors.softText}; }
  &:focus {
    border-color: ${appColors.primary};
    background: ${appColors.surface};
    box-shadow: 0 0 0 4px ${appColors.primaryTint};
  }
`

export const PasswordToggle = styled.button`
  position: absolute;
  right: 6px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${appColors.muted};
  svg { width: 20px; height: 20px; }
  &:hover { background: ${appColors.surfaceLow}; }
  &:focus-visible { outline: 2px solid ${appColors.primary}; }
`

export const MessageSlot = styled.div`
  min-height: 54px;
  padding-top: 12px;
`

export const Message = styled.p`
  margin: 0 0 12px;
  padding: 11px 12px;
  border: 1px solid #d92d3a;
  border-radius: 10px;
  background: #d92d3a0a;
  color: #b4232e;
  font-size: 13px;
  line-height: 1.5;
`

export const Submit = styled.button`
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  background: ${appColors.primary};
  color: ${appColors.primaryText};
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 18px #ff195633;
  svg { width: 20px; height: 20px; }
  &:hover:not(:disabled) { filter: brightness(0.96); }
  &:focus-visible { outline: 2px solid ${appColors.primary}; outline-offset: 3px; }
  &:disabled { cursor: default; opacity: 0.65; }
`

export const Verification = styled.section`
  margin-bottom: 18px;
  color: ${appColors.muted};
  font-size: 13px;
  line-height: 1.5;
  p { margin: 0 0 10px; }
`

export const VerificationFrame = styled.iframe`
  display: block;
  width: 100%;
  border: 0;
`

export const VerificationRetry = styled.button`
  margin-top: 8px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: ${appColors.primary};
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
`

export const Footer = styled.p`
  margin: 28px 0 0;
  color: ${appColors.softText};
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
`
