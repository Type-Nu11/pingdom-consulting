import styled from 'styled-components'
import { appColors } from '../../styles/theme'

export const PageShell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${appColors.background};
`

export const Header = styled.header`
  width: min(1120px, calc(100% - 48px));
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
  border-bottom: 1px solid ${appColors.borderSoft};
`

export const Brand = styled.div`
  color: ${appColors.primary};
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.08em;
`

export const HeaderLabel = styled.span`
  color: ${appColors.muted};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
`

export const Main = styled.main`
  width: min(720px, calc(100% - 48px));
  flex: 1;
  margin: 0 auto;
  padding: 96px 0 80px;
`

export const Intro = styled.section`
  margin-bottom: 40px;
`

export const Eyebrow = styled.p`
  margin: 0 0 16px;
  color: ${appColors.primary};
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
`

export const Title = styled.h1`
  margin: 0;
  color: ${appColors.strongText};
  font-size: clamp(40px, 7vw, 64px);
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 1.12;
`

export const Description = styled.p`
  margin: 24px 0 0;
  color: ${appColors.muted};
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.65;
`

export const ChatCard = styled.section`
  padding: 20px;
  border: 1px solid ${appColors.border};
  border-radius: 16px;
  background: ${appColors.surface};
  box-shadow: 0 12px 36px ${appColors.shadow};
`

export const ChatCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 4px 16px;
  color: ${appColors.text};
  font-size: 14px;
  font-weight: 800;
`

export const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${appColors.primary};
`

export const Form = styled.form`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 16px;
  border: 1px solid ${appColors.border};
  border-radius: 12px;
  background: ${appColors.surfaceLow};
`

export const PromptInput = styled.input`
  width: 100%;
  min-width: 0;
  padding: 10px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${appColors.text};
  font-size: 15px;

  &::placeholder {
    color: ${appColors.softText};
  }
`

export const SubmitButton = styled.button`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: ${appColors.primary};
  color: ${appColors.primaryText};
  font-size: 22px;
  line-height: 1;
  transition: background 160ms ease;

  &:hover {
    background: ${appColors.primaryHover};
  }
`

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 14px 4px 0;
  color: ${appColors.softText};
  font-size: 12px;
`

export const StarterSection = styled.section`
  margin-top: 40px;
`

export const SectionLabel = styled.p`
  margin: 0 0 12px;
  color: ${appColors.muted};
  font-size: 13px;
  font-weight: 700;
`

export const StarterList = styled.div`
  display: grid;
  gap: 8px;
`

export const StarterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 52px;
  padding: 0 16px;
  border: 1px solid ${appColors.borderSoft};
  border-radius: 8px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font-size: 14px;
  text-align: left;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease;

  span {
    color: ${appColors.softText};
  }

  &:hover {
    border-color: ${appColors.primarySoft};
    background: ${appColors.primaryTint};
    color: ${appColors.primary};
  }
`

export const Footer = styled.footer`
  width: min(1120px, calc(100% - 48px));
  margin: 0 auto;
  padding: 24px 0;
  border-top: 1px solid ${appColors.borderSoft};
  color: ${appColors.softText};
  font-size: 12px;
`
