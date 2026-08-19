import styled from 'styled-components'
import { appColors } from '../../styles/theme'

export const TargetCustomerPanel = styled.section`
  margin-top: 20px;
  overflow: hidden;
  border-radius: 20px;
  background: ${appColors.surface};
  box-shadow: 0 12px 34px #0000000a;
`

export const TargetCustomerPanelHeader = styled.header`
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid ${appColors.borderSoft};
`

export const TargetCustomerPanelTitle = styled.h2`
  margin: 0;
  color: ${appColors.strongText};
  font-size: 15px;
  font-weight: 600;
`

export const StepBadge = styled.span`
  min-width: 46px;
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: ${appColors.surfaceLow};
  color: ${appColors.muted};
  font-size: 12px;
  font-weight: 500;
`

export const TargetCustomerForm = styled.form`
  padding: 24px;

  @media (max-width: 520px) {
    padding: 20px 16px;
  }
`

export const TargetCustomerQuestion = styled.p`
  margin: 0;
  color: ${appColors.strongText};
  font-size: clamp(18px, 2vw, 21px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.4;
`

export const TargetCustomerHelp = styled.p`
  margin: 8px 0 0;
  color: ${appColors.muted};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.6;
`

export const TargetCustomerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 22px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

export const TargetCustomerCard = styled.section`
  display: grid;
  align-content: space-between;
  gap: 22px;
  padding: 18px;
  border: 1px solid ${appColors.border};
  border-radius: 16px;
  background: ${appColors.surface};
  color: ${appColors.text};
  text-align: left;
`

export const CardHeader = styled.div`
  display: grid;
  gap: 7px;

  strong {
    color: ${appColors.strongText};
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.025em;
  }

  span {
    color: ${appColors.muted};
    font-size: 13px;
    letter-spacing: -0.02em;
    line-height: 1.55;
  }
`

export const OptionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

export const OptionButton = styled.button`
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid ${appColors.border};
  border-radius: 12px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font-size: 13px;
  font-weight: 500;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    transform 150ms ease;

  &:hover:not(:disabled) {
    border-color: ${appColors.primarySoft};
    background: ${appColors.primaryTint};
  }

  &[data-selected='true'] {
    border-color: ${appColors.primary};
    background: #ff19560d;
    color: ${appColors.primary};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
  }

  &:disabled:not([data-selected='true']) {
    opacity: 0.55;
  }
`

export const TargetCustomerConfirmButton = styled.button`
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
