import styled, { keyframes } from 'styled-components'
import { appColors } from '../../styles/theme'

const panelEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

export const SummaryPanel = styled.section`
  width: 100%;
  margin-top: 16px;
  overflow: hidden;
  border: 0;
  border-radius: 20px;
  background: ${appColors.surface};
  box-shadow: 0 12px 34px #0000000a;
  text-align: left;
  animation: ${panelEnter} 480ms cubic-bezier(0.16, 1, 0.3, 1) both;

  &[data-confirmed='true'] {
    background: #fcfcfd;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const SummaryHeader = styled.header`
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 22px;
  border-bottom: 1px solid ${appColors.borderSoft};

  @media (max-width: 520px) {
    padding: 14px 16px;
  }
`

export const SummaryTitle = styled.h3`
  margin: 0;
  color: ${appColors.strongText};
  font-size: 15px;
  font-weight: 600;
`

export const StepBadge = styled.span`
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: ${appColors.surfaceLow};
  color: ${appColors.muted};
  font-size: 12px;
  font-weight: 500;
`

export const SummaryForm = styled.form`
  padding: 24px;

  @media (max-width: 520px) {
    padding: 20px 16px;
  }
`

export const SummaryQuestion = styled.h4`
  margin: 0;
  color: ${appColors.strongText};
  font-size: clamp(18px, 2vw, 21px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.4;
`

export const SummaryHelp = styled.p`
  margin: 8px 0 0;
  color: ${appColors.muted};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.6;
`

export const SummaryList = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 22px;
`

export const SummaryItem = styled.div`
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 16px;
  border: 1px solid ${appColors.borderSoft};
  border-radius: 15px;
  background: ${appColors.surfaceLow};
`

export const ItemCopy = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;

  span {
    color: ${appColors.muted};
    font-size: 12px;
    font-weight: 500;
  }

  strong {
    overflow-wrap: anywhere;
    color: ${appColors.strongText};
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
  }

  small {
    overflow-wrap: anywhere;
    color: ${appColors.muted};
    font-size: 12px;
    line-height: 1.5;
  }
`

export const EditButton = styled.button`
  min-height: 38px;
  flex-shrink: 0;
  padding: 0 15px;
  border: 1px solid ${appColors.border};
  border-radius: 11px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font-size: 12px;
  font-weight: 600;

  &:hover:not(:disabled) {
    border-color: ${appColors.primarySoft};
    background: ${appColors.primaryTint};
    color: ${appColors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }

  &:disabled {
    color: #b6b6bc;
  }
`

export const InlineEditor = styled.div`
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid #ff195638;
  border-radius: 15px;
  background: ${appColors.primaryTint};
`

export const CategoryChoices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

export const CategoryChoice = styled.button`
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid ${appColors.border};
  border-radius: 999px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font-size: 12px;
  font-weight: 500;

  &[data-selected='true'] {
    border-color: ${appColors.primary};
    background: ${appColors.primary};
    color: ${appColors.primaryText};
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
`

export const CustomCategoryInput = styled.input`
  width: 100%;
  min-height: 44px;
  padding: 0 13px;
  border: 1px solid ${appColors.border};
  border-radius: 12px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font: inherit;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: ${appColors.primary};
    box-shadow: 0 0 0 3px #ff195614;
  }
`

export const EditorActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

export const CancelButton = styled.button`
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid ${appColors.border};
  border-radius: 11px;
  background: ${appColors.surface};
  color: ${appColors.muted};
  font-size: 12px;
  font-weight: 500;
`

export const ApplyButton = styled.button`
  min-height: 38px;
  padding: 0 15px;
  border: 0;
  border-radius: 11px;
  background: ${appColors.primary};
  color: ${appColors.primaryText};
  font-size: 12px;
  font-weight: 600;

  &:disabled {
    background: #ececef;
    color: #b7b7bd;
  }
`

export const InlineLocationEditor = styled.div`
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid #ff195638;
  border-radius: 17px;
  background: ${appColors.primaryTint};

  > section {
    margin-top: 0;
  }
`

export const AdditionalField = styled.div`
  position: relative;
  display: grid;
  gap: 8px;
  margin-top: 22px;
`

export const AdditionalLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 7px;
  color: ${appColors.strongText};
  font-size: 13px;
  font-weight: 600;

  small {
    padding: 2px 6px;
    border-radius: 999px;
    background: ${appColors.surfaceLow};
    color: ${appColors.muted};
    font-size: 10px;
    font-weight: 500;
  }
`

export const AdditionalTextarea = styled.textarea`
  width: 100%;
  min-height: 112px;
  resize: vertical;
  padding: 14px 14px 30px;
  border: 1px solid ${appColors.border};
  border-radius: 15px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font: inherit;
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.6;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &::placeholder {
    color: #9999a1;
  }

  &:focus {
    border-color: ${appColors.primary};
    box-shadow: 0 0 0 3px #ff195614;
  }

  &:disabled {
    resize: none;
    background: ${appColors.surfaceLow};
    color: ${appColors.muted};
  }
`

export const CharacterCount = styled.span`
  position: absolute;
  right: 12px;
  bottom: 10px;
  color: ${appColors.softText};
  font-size: 11px;
`

export const ConfirmButton = styled.button`
  width: 100%;
  min-height: 50px;
  margin-top: 18px;
  border: 0;
  border-radius: 14px;
  background: ${appColors.primary};
  color: ${appColors.primaryText};
  font-size: 14px;
  font-weight: 600;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px #ff19562b;
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }

  &:disabled {
    background: #ececef;
    color: #b7b7bd;
  }
`
