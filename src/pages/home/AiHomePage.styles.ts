import styled from 'styled-components'
import { appColors } from '../../styles/theme'

export const PageShell = styled.div`
  height: 100dvh;
  min-height: 560px;
  display: grid;
  grid-template-columns: 256px minmax(0, 1fr);
  overflow: hidden;
  background: ${appColors.background};

  @media (max-width: 768px) {
    display: block;
  }
`

export const Sidebar = styled.aside`
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 16px 12px 12px;
  border-right: 1px solid ${appColors.borderSoft};
  background: #f7f7f8;

  @media (max-width: 768px) {
    display: none;
  }
`

export const SidebarHeader = styled.div`
  min-height: 56px;
  display: flex;
  align-items: center;
  padding: 0 10px;
`

export const BrandLogo = styled.img`
  width: 168px;
  height: auto;
  display: block;
`

const iconStroke = `
  svg {
    width: 19px;
    height: 19px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`

export const NewChatButton = styled.button`
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #ececee;
  color: ${appColors.text};
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: background 160ms ease;

  ${iconStroke}

  &:hover {
    background: #e4e4e6;
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
`

export const SidebarContent = styled.div`
  min-height: 0;
  flex: 1;
  padding: 28px 10px;
`

export const SidebarLabel = styled.p`
  margin: 0;
  color: ${appColors.softText};
  font-size: 12px;
  font-weight: 500;
`

export const EmptyHistory = styled.p`
  margin: 12px 0 0;
  color: ${appColors.muted};
  font-size: 13px;
  line-height: 1.55;
`

export const Workspace = styled.div`
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

export const TopBar = styled.header`
  min-height: 64px;
  display: none;
  align-items: center;
  padding: 0 24px;

  @media (max-width: 768px) {
    min-height: 58px;
    display: flex;
    gap: 12px;
    padding: 0 18px;
    border-bottom: 1px solid ${appColors.borderSoft};
  }
`

export const MobileBrandLogo = styled.img`
  width: 168px;
  height: auto;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`

export const ChatMain = styled.main`
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  padding: 0 32px 64px;

  @media (max-width: 768px) {
    padding: 0 18px 32px;
  }
`

export const EmptyState = styled.section`
  width: min(760px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  text-align: center;
  transform: translateY(-5vh);

  @media (max-width: 768px) {
    transform: translateY(-2vh);
  }

  @media (max-height: 640px) {
    transform: none;
  }
`

export const MessageTitle = styled.h1`
  margin: 0;
  color: ${appColors.strongText};
  font-size: clamp(25px, 3vw, 31px);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 1.35;
`

export const MessageText = styled.p`
  max-width: 590px;
  margin: 12px auto 0;
  color: ${appColors.muted};
  font-size: 15px;
  letter-spacing: -0.025em;
  line-height: 1.7;

  @media (max-width: 520px) {
    max-width: 310px;
    font-size: 14px;
  }

  @media (max-height: 640px) {
    margin-top: 6px;
  }
`

export const ComposerArea = styled.div`
  width: 100%;
  margin-top: 30px;

  @media (max-height: 640px) {
    margin-top: 18px;
  }
`

export const Form = styled.form`
  position: relative;
  width: 100%;
  min-height: 58px;
  padding: 7px 54px;
  border: 1px solid ${appColors.border};
  border-radius: 30px;
  background: ${appColors.surface};
  box-shadow: 0 8px 28px #00000012;
  transition:
    min-height 220ms cubic-bezier(0.22, 1, 0.36, 1),
    padding 220ms cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 220ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:focus-within {
    border-color: ${appColors.primarySoft};
    box-shadow:
      0 0 0 3px ${appColors.primaryTint},
      0 10px 32px #00000014;
  }

  &[data-expanded='true'] {
    padding: 12px 8px 54px;
    border-radius: 24px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const InputActionWrapper = styled.div`
  position: absolute;
  left: 8px;
  top: 50%;
  z-index: 2;
  width: 38px;
  height: 38px;
  transform: translateY(-50%);
  transition: top 220ms cubic-bezier(0.22, 1, 0.36, 1);

  form[data-expanded='true'] & {
    top: calc(100% - 27px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const InputAction = styled.button`
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: ${appColors.muted};
  transition:
    background 160ms ease,
    transform 160ms ease;

  ${iconStroke}

  svg {
    stroke-width: 2.2;
  }

  &:hover {
    background: ${appColors.surfaceLow};
    transform: scale(1.03);
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
  }
`

export const AttachmentMenu = styled.div`
  position: absolute;
  left: 0;
  bottom: calc(100% + 12px);
  z-index: 10;
  width: min(260px, calc(100vw - 36px));
  display: grid;
  gap: 2px;
  padding: 8px;
  border: 1px solid ${appColors.borderSoft};
  border-radius: 18px;
  background: ${appColors.surface};
  box-shadow: 0 14px 40px #0000001a;
`

export const AttachmentMenuItem = styled.button`
  width: 100%;
  min-height: 58px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: ${appColors.text};
  transition: background 140ms ease;

  &:hover,
  &:focus-visible {
    outline: 0;
    background: ${appColors.surfaceLow};
  }
`

export const MenuItemIcon = styled.span`
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid ${appColors.borderSoft};
  border-radius: 10px;
  background: ${appColors.background};
  color: ${appColors.muted};

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`

export const MenuItemText = styled.span`
  min-width: 0;
  display: grid;
  gap: 2px;
  text-align: left;

  strong {
    font-size: 14px;
    font-weight: 500;
  }

  span {
    color: ${appColors.softText};
    font-size: 12px;
  }
`

export const PromptInput = styled.textarea`
  width: 100%;
  min-width: 0;
  min-height: 44px;
  max-height: 140px;
  overflow-y: hidden;
  resize: none;
  padding: 12px 4px 8px;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${appColors.text};
  font-size: 15px;
  letter-spacing: -0.02em;
  line-height: 1.5;
  transition:
    height 220ms cubic-bezier(0.22, 1, 0.36, 1),
    padding 220ms cubic-bezier(0.22, 1, 0.36, 1);

  &::placeholder {
    color: ${appColors.softText};
  }

  form[data-expanded='true'] & {
    padding: 4px 8px 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const SubmitButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: ${appColors.primary};
  color: ${appColors.primaryText};
  transform: translateY(-50%);
  transition:
    top 220ms cubic-bezier(0.22, 1, 0.36, 1),
    background 160ms ease,
    transform 160ms ease;

  ${iconStroke}

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover:not(:disabled) {
    background: ${appColors.primaryHover};
    transform: translateY(-50%) scale(1.03);
  }

  &:disabled {
    background: #e7e7e9;
    color: #a6a6ad;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }

  form[data-expanded='true'] & {
    top: calc(100% - 27px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

export const ComposerHint = styled.p`
  margin: 10px 0 0;
  color: ${appColors.softText};
  font-size: 11px;
  text-align: center;
`
