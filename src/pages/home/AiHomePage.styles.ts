import styled, { keyframes } from 'styled-components'
import { appColors } from '../../styles/theme'

const cloudDrift = keyframes`
  0%,
  100% {
    transform: translate(-51%, -51%) rotate(-5deg) scale(1);
    border-radius: 44% 56% 39% 61% / 58% 43% 57% 42%;
  }

  35% {
    transform: translate(-45%, -56%) rotate(3deg) scale(1.08, 0.93);
    border-radius: 52% 48% 57% 43% / 46% 58% 42% 54%;
  }

  70% {
    transform: translate(-57%, -46%) rotate(-12deg) scale(0.92, 1.1);
    border-radius: 39% 61% 46% 54% / 61% 39% 56% 44%;
  }
`

const userMessageEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const floatingPromptToUserMessage = keyframes`
  from {
    top: var(--prompt-start-top);
    right: var(--prompt-start-right);
    border-radius: 30px;
    background: ${appColors.surface};
    box-shadow: 0 8px 28px #00000012;
  }
  to {
    top: var(--prompt-end-top);
    right: var(--prompt-end-right);
    border-radius: 18px 18px 4px 18px;
    background: #f1f1f3;
    box-shadow: none;
  }
`

const assistantMessageEnter = keyframes`
  from {
    opacity: 0;
    transform: translateX(-28px) translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
`

const composerDockEnter = keyframes`
  0% {
    opacity: 0.45;
    transform: translateY(38px) scale(0.96);
  }
  70% {
    opacity: 1;
    transform: translateY(-5px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const categoryPanelEnter = keyframes`
  0% {
    opacity: 0;
    transform: translateY(38px) scale(0.94);
  }
  70% {
    opacity: 1;
    transform: translateY(-5px) scale(1.012);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const typingDotBounce = keyframes`
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0) scale(0.85);
  }
  30% {
    opacity: 1;
    transform: translateY(-6px) scale(1.08);
  }
`

const cursorBlink = keyframes`
  0%,
  45% {
    opacity: 1;
  }
  46%,
  100% {
    opacity: 0;
  }
`

const selectedOptionPulse = keyframes`
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.018);
  }
  100% {
    transform: scale(1);
  }
`

const categoryOptionEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const contextStreamPulse = keyframes`
  0%,
  100% {
    opacity: 0.18;
    transform: scale(0.985);
  }
  50% {
    opacity: 0.48;
    transform: scale(1.015);
  }
`

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
  border-right: 1px solid #e9e9eb;
  background: ${appColors.surface};

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
  padding: 20px 10px 28px;
`

export const PinnedSection = styled.section`
  margin: 20px 10px 0;
`

export const PinnedLabel = styled.p`
  margin: 0;
  color: ${appColors.softText};
  font-size: 12px;
  font-weight: 500;
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

export const HistoryList = styled.div`
  display: grid;
  gap: 4px;
  margin-top: 12px;
`

export const HistoryItem = styled.div`
  position: relative;
  min-width: 0;
  min-height: 40px;
  display: flex;
  align-items: center;
  margin: 0 -8px;
  padding: 0 8px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: ${appColors.text};
  transition: background 160ms ease;

  &:hover {
    background: #ececee;
  }

  &:hover > div,
  &:focus-within > div {
    opacity: 1;
    pointer-events: auto;
  }
`

export const HistorySelectButton = styled.button`
  height: 40px;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: -2px;
  }
`

export const HistoryTitle = styled.strong`
  display: block;
  overflow: hidden;
  font-size: 13px;
  font-weight: 300;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const HistoryActions = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
`

export const HistoryMenuToggle = styled.button`
  width: 20px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 0 0 1px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: ${appColors.softText};
  font-family: Arial, sans-serif;
  font-size: 17px;
  font-weight: 300;
  letter-spacing: 0;
  line-height: 1;

  &:hover,
  &[aria-expanded='true'] {
    background: #dedee2;
    color: ${appColors.text};
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 1px;
  }
`

export const HistoryMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 4;
  min-width: 124px;
  display: grid;
  padding: 5px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 22px #1b1b241f;
`

export const HistoryMenuItem = styled.button`
  padding: 8px 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${appColors.text};
  font-size: 12px;
  text-align: left;

  &:hover {
    background: #f1f1f3;
  }

  &[data-danger='true'] {
    color: #d6334a;
  }
`

export const HistoryRenameForm = styled.form`
  height: 40px;
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0;
`

export const HistoryRenameInput = styled.input`
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${appColors.text};
  font-size: 13px;
  font-weight: 300;
  letter-spacing: inherit;
  line-height: 1.4;

  &:focus {
    box-shadow: none;
  }
`

export const DeleteDialogBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #15151d42;
`

export const DeleteDialog = styled.section`
  width: min(360px, 100%);
  padding: 24px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 52px #14142036;
`

export const DeleteDialogTitle = styled.h2`
  margin: 0;
  color: ${appColors.strongText};
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.03em;
`

export const DeleteDialogDescription = styled.p`
  margin: 10px 0 0;
  color: ${appColors.softText};
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
`

export const DeleteDialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`

export const DeleteDialogButton = styled.button`
  min-height: 36px;
  padding: 0 13px;
  border: 0;
  border-radius: 8px;
  background: #efeff1;
  color: ${appColors.text};
  font-size: 13px;
  font-weight: 500;

  &:hover {
    background: #e4e4e7;
  }

  &[data-danger='true'] {
    background: #ef3553;
    color: #fff;
  }

  &[data-danger='true']:hover {
    background: #dd2544;
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
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
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 32px 64px;

  &[data-conversation='true'] {
    overflow: hidden;
    padding-bottom: 24px;
  }

  &[data-transitioning='true'] {
    overflow: hidden;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 0;
    width: min(1040px, 96%);
    height: min(600px, 82%);
    transform: translate(-51%, -51%) rotate(-5deg);
    border-radius: 44% 56% 39% 61% / 58% 43% 57% 42%;
    background:
      radial-gradient(
        ellipse 62% 50% at 34% 46%,
        #ff19561a 0%,
        #ff19560c 48%,
        transparent 74%
      ),
      radial-gradient(
        ellipse 48% 66% at 69% 54%,
        #ff195618 0%,
        #ff19560a 52%,
        transparent 76%
      ),
      radial-gradient(
        ellipse 40% 34% at 57% 24%,
        #ff195610 0%,
        transparent 72%
    );
    filter: blur(36px);
    pointer-events: none;
    will-change: transform, border-radius;
    animation: ${cloudDrift} 8s ease-in-out infinite;
    opacity: 1;
    transition:
      opacity 700ms ease,
      filter 700ms ease;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  &[data-conversation='true']::before {
    opacity: 0.48;
    filter: blur(52px);
  }

  &[data-transitioning='true']::before {
    opacity: 0.68;
    filter: blur(46px);
  }

  @media (max-width: 768px) {
    padding: 0 18px 32px;

    &::before {
      width: 130%;
      height: min(460px, 68%);
      opacity: 0.72;
    }
  }
`

export const EmptyState = styled.section`
  position: relative;
  z-index: 1;
  width: min(760px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  text-align: center;
  transform: translateY(5vh);

  > h1,
  > p,
  > section {
    transition:
      opacity 420ms ease,
      transform 420ms ease;
  }

  @media (max-height: 640px) {
    transform: none;
  }

  &[data-leaving='true'] {
    pointer-events: none;
  }

  &[data-leaving='true'] > h1,
  &[data-leaving='true'] > p,
  &[data-leaving='true'] > section {
    opacity: 0;
    transform: translateY(-16px);
  }

  @media (prefers-reduced-motion: reduce) {
    > h1,
    > p,
    > section {
      transition: none;
    }
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

export const ConversationLayout = styled.section`
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex: none;
  flex-direction: column;
  margin: 0 auto;
`

export const ConversationMessages = styled.div`
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding: 40px max(8px, calc((100% - 800px) / 2 + 8px)) 28px;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  @media (max-width: 520px) {
    gap: 20px;
    padding: 24px 0 20px;
  }
`

export const UserMessageRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-left: 56px;
  animation: ${userMessageEnter} 560ms cubic-bezier(0.16, 1, 0.3, 1) both;

  &[data-initial-prompt-row='true'] {
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const UserMessageBubble = styled.div`
  max-width: min(560px, 100%);
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  background: #f1f1f3;
  color: ${appColors.text};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.65;
  white-space: pre-wrap;
`

export const AssistantMessageRow = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  animation: ${assistantMessageEnter} 520ms 180ms
    cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const AssistantAvatar = styled.div`
  width: 34px;
  height: 34px;
  overflow: hidden;
  border-radius: 10px;
  background: ${appColors.primary};

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
`

export const AssistantMessageContent = styled.div`
  position: relative;
  isolation: isolate;
  min-width: 0;

  &[data-streaming='true']::before {
    content: '';
    position: absolute;
    inset: -12px;
    z-index: -1;
    border-radius: 28px;
    background: radial-gradient(
      ellipse at 42% 28%,
      #ff19561a,
      transparent 68%
    );
    filter: blur(18px);
    pointer-events: none;
    animation: ${contextStreamPulse} 1.15s steps(8, end) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-streaming='true']::before {
      animation: none;
    }
  }
`

export const AssistantIntro = styled.p`
  min-height: 24px;
  max-width: 650px;
  margin: 5px 0 16px;
  color: ${appColors.text};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.7;
`

export const TypingIndicator = styled.span`
  min-height: 22px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 0;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${appColors.primary};
    animation: ${typingDotBounce} 900ms ease-in-out infinite;
  }

  span:nth-child(2) {
    animation-delay: 130ms;
  }

  span:nth-child(3) {
    animation-delay: 260ms;
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
    }
  }
`

export const TypingCursor = styled.span`
  width: 2px;
  height: 1.1em;
  display: inline-block;
  margin-left: 2px;
  border-radius: 2px;
  background: ${appColors.primary};
  vertical-align: -0.15em;
  animation: ${cursorBlink} 720ms step-end infinite;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`

export const AssistantFollowup = styled.p`
  margin: 5px 0 0;
  color: ${appColors.text};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.7;
`

export const AnalysisReportDownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 46px;
  margin-top: 12px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: linear-gradient(135deg, ${appColors.primary}, #ff4776);
  box-shadow: 0 8px 20px #ff195633;
  color: ${appColors.primaryText};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease,
    filter 150ms ease;

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px #ff19563d;
    filter: brightness(1.02);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 5px 12px #ff19562e;
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 3px;
  }
`

export const ConversationComposer = styled.div`
  width: min(800px, 100%);
  flex-shrink: 0;
  margin: 0 auto;
  padding: 12px 8px 0;
  background: linear-gradient(transparent, ${appColors.background} 18%);
  animation: ${composerDockEnter} 760ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @media (max-width: 520px) {
    padding-right: 0;
    padding-left: 0;
  }
`

export const ConversationEnd = styled.div`
  width: 1px;
  height: 1px;
  flex-shrink: 0;
`

export const CategoryPanel = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 0;
  border-radius: 20px;
  background: ${appColors.surface};
  box-shadow: 0 12px 34px #0000000a;
  text-align: left;

  &[data-animated='true'] {
    animation: ${categoryPanelEnter} 620ms steps(10, end) both;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-animated='true'] {
      animation: none;
    }
  }
`

export const CategoryPanelHeader = styled.div`
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid ${appColors.borderSoft};
`

export const CategoryPanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${appColors.strongText};
  font-size: 15px;
  font-weight: 600;

  > span:first-child {
    min-width: 1px;
  }

  img {
    width: 30px;
    height: 30px;
    display: block;
    border-radius: 8px;
  }
`

export const StepBadge = styled.span`
  min-width: 46px;
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  padding: 5px 9px;
  border-radius: 999px;
  background: ${appColors.surfaceLow};
  color: ${appColors.muted};
  font-size: 12px;
  font-weight: 500;
`

export const CategoryForm = styled.form`
  padding: 24px;

  @media (max-width: 520px) {
    padding: 20px 16px;
  }
`

export const CategoryFieldset = styled.fieldset`
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`

export const CategoryQuestion = styled.legend`
  width: 100%;
  min-height: 30px;
  padding: 0;
  color: ${appColors.strongText};
  font-size: clamp(18px, 2vw, 21px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.4;
`

export const CategoryHelp = styled.p`
  min-height: 22px;
  margin: 8px 0 0;
  color: ${appColors.muted};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.6;
`

export const CategoryList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 22px;
`

export const CustomCategoryField = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
  animation: ${categoryOptionEnter} 280ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const CustomCategoryLabel = styled.label`
  color: ${appColors.muted};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.02em;
`

export const CustomCategoryInput = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid ${appColors.border};
  border-radius: 12px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font: inherit;
  font-size: 14px;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &::placeholder {
    color: #a8a8af;
  }

  &:focus {
    border-color: ${appColors.primary};
    box-shadow: 0 0 0 3px #ff195614;
  }
`

export const CategoryOption = styled.button`
  width: 100%;
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid ${appColors.border};
  border-radius: 12px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    transform 150ms ease;
  animation: ${categoryOptionEnter} 360ms cubic-bezier(0.16, 1, 0.3, 1)
    both;

  &:hover {
    border-color: ${appColors.primarySoft};
    background: ${appColors.primaryTint};
  }

  &[data-selected='true'] {
    border-color: ${appColors.primary};
    background: #ff19560d;
    animation: ${selectedOptionPulse} 360ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:active {
    transform: scale(0.995);
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }

  fieldset:disabled & {
    opacity: 0.55;
    cursor: default;
  }

  fieldset:disabled &[data-selected='true'] {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    &[data-selected='true'] {
      animation: none;
    }
  }
`

export const CategoryTypingText = styled.span`
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
`

export const SelectionIndicator = styled.span`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid ${appColors.border};
  border-radius: 50%;
  color: ${appColors.primaryText};
  font-size: 13px;
  line-height: 1;

  button[data-selected='true'] & {
    border-color: ${appColors.primary};
    background: ${appColors.primary};
  }
`

export const CategoryConfirmButton = styled.button`
  width: 100%;
  min-height: 52px;
  margin-top: 22px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: ${appColors.primary};
  color: ${appColors.primaryText};
  font-size: 14px;
  font-weight: 600;
  transition:
    background 150ms ease,
    transform 150ms ease;

  &:hover:not(:disabled) {
    background: ${appColors.primaryHover};
  }

  &:active:not(:disabled) {
    transform: scale(0.995);
  }

  &:disabled {
    background: #eeeeef;
    color: #b7b7bd;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
`

export const CategorySelectionStatus = styled.p`
  margin: 12px 0 0;
  color: ${appColors.muted};
  font-size: 13px;
  text-align: center;

  strong {
    color: ${appColors.primary};
    font-weight: 600;
  }
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

export const StarterPromptSection = styled.section`
  width: min(760px, 100%);
  margin-top: 14px;
  padding: 6px;
  border: 1px solid #ffffff;
  border-radius: 18px;
  background: #ffffff9c;
  box-shadow: 0 12px 28px #00000008;
  text-align: left;

  @media (max-height: 640px) {
    margin-top: 10px;
  }
`

export const StarterPromptList = styled.div`
  display: grid;
  gap: 2px;
`

export const StarterPromptButton = styled.button`
  max-width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: ${appColors.muted};
  font-size: 16px;
  font-weight: 400;
  letter-spacing: -0.025em;
  line-height: 1.55;
  text-align: left;
  transition:
    background 150ms ease,
    color 150ms ease,
    transform 150ms ease;

  &:hover {
    background: ${appColors.primaryTint};
    color: ${appColors.text};
  }

  &:active {
    transform: scale(0.985);
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
`

export const StarterPromptIcon = styled.span`
  width: 18px;
  height: 18px;
  flex: none;
  display: grid;
  place-items: center;
  color: ${appColors.softText};

  svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.65;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`

export const ComposerArea = styled.div`
  width: 100%;
  margin-top: 30px;

  &[data-conversation='true'] {
    margin-top: 0;
  }

  &[data-transitioning='true'] {
    position: relative;
    z-index: 2;
  }

  @media (max-height: 640px) {
    margin-top: 18px;
  }
`

export const TransitionComposerPlaceholder = styled.div`
  width: 100%;
  min-height: 58px;
`

export const FloatingPromptBubble = styled.div`
  --prompt-start-top: calc(50% + 24px);
  --prompt-start-right: max(0px, calc((100% - 760px) / 2));
  --prompt-end-top: 40px;
  --prompt-end-right: max(8px, calc((100% - 800px) / 2 + 8px));

  position: absolute;
  z-index: 5;
  top: var(--prompt-start-top);
  right: var(--prompt-start-right);
  width: fit-content;
  max-width: min(560px, calc(100% - 64px));
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 30px;
  background: ${appColors.surface};
  box-shadow: 0 8px 28px #00000012;
  color: ${appColors.text};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.65;
  text-align: left;
  white-space: pre-wrap;
  pointer-events: none;
  opacity: 1;
  will-change: top, right, border-radius, background, box-shadow, opacity;
  animation: ${floatingPromptToUserMessage} 480ms
    cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: opacity 220ms ease;

  &[data-handoff='true'] {
    opacity: 0;
  }

  @media (max-width: 520px) {
    --prompt-start-top: calc(50% + 16px);
    --prompt-start-right: 18px;
    --prompt-end-top: 24px;
    --prompt-end-right: 18px;

    max-width: calc(100% - 36px);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    top: var(--prompt-end-top);
    right: var(--prompt-end-right);
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

  &:disabled {
    opacity: 0.55;
    cursor: default;
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
  padding: 13px 4px 7px;
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

  &:disabled {
    color: ${appColors.softText};
    cursor: default;
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
