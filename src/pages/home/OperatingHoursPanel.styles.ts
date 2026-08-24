import styled from 'styled-components'
import { appColors } from '../../styles/theme'

export const OperatingHoursPanel = styled.section`
  margin-top: 16px;
  overflow: hidden;
  border-radius: 20px;
  background: ${appColors.surface};
  box-shadow: 0 12px 34px #0000000a;
`

export const OperatingHoursPanelHeader = styled.header`
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid ${appColors.borderSoft};
`

export const OperatingHoursPanelTitle = styled.h2`
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

export const OperatingHoursForm = styled.form`
  padding: 24px;

  @media (max-width: 520px) {
    padding: 20px 16px;
  }
`

export const OperatingHoursQuestion = styled.p`
  margin: 0;
  color: ${appColors.strongText};
  font-size: clamp(18px, 2vw, 21px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.4;
`

export const OperatingHoursHelp = styled.p`
  margin: 8px 0 0;
  color: ${appColors.muted};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.6;
`

export const OperatingDaysField = styled.section`
  display: grid;
  gap: 10px;
  margin-top: 24px;
`

export const OperatingDaysLabel = styled.strong`
  color: ${appColors.strongText};
  font-size: 13px;
  font-weight: 600;
`

export const OperatingDaysOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

export const OperatingDayOption = styled.button`
  min-height: 38px;
  padding: 0 15px;
  border: 1px solid ${appColors.border};
  border-radius: 999px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font-size: 13px;
  font-weight: 500;

  &[data-selected='true'] {
    border-color: ${appColors.primary};
    background: ${appColors.primary};
    color: ${appColors.primaryText};
  }

  &:hover:not(:disabled) {
    border-color: ${appColors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
`

export const TimeFieldGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  margin-top: 28px;

  @media (max-width: 440px) {
    grid-template-columns: 1fr;
  }
`

export const TimeFieldButton = styled.button`
  min-height: 88px;
  display: grid;
  gap: 7px;
  align-content: center;
  padding: 14px 16px;
  border: 0;
  border-radius: 16px;
  background: ${appColors.surface};
  color: ${appColors.muted};
  text-align: left;
  box-shadow: 0 8px 20px #00000008;
  transition:
    box-shadow 150ms ease,
    transform 150ms ease;

  span {
    color: ${appColors.muted};
    font-size: 12px;
    font-weight: 500;
  }

  strong {
    color: ${appColors.softText};
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  &[data-selected='true'] strong {
    color: ${appColors.strongText};
  }

  &[data-selected='true'] {
    background: linear-gradient(135deg, #fff8fa, ${appColors.surface});
  }

  &[data-selected='true'] span {
    color: ${appColors.primary};
  }

  &[data-active='true'] {
    box-shadow:
      0 0 0 3px #ff195614,
      0 8px 18px #ff195612;
  }

  &:active:not(:disabled) {
    transform: scale(0.985);
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
  }
`

export const TimeRangeConnector = styled.div`
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  justify-self: center;
  border: 0;
  border-radius: 50%;
  background: #fff8fa;
  color: ${appColors.primary};
  font-size: 14px;
  line-height: 1;

  @media (max-width: 440px) {
    transform: rotate(90deg);
  }
`

export const TimePicker = styled.section`
  margin-top: 12px;
  padding: 16px;
  border: 1px solid #ff195633;
  border-radius: 16px;
  background: linear-gradient(180deg, #fff, #fffafb);
  box-shadow: 0 14px 32px #ff19560a;
`

export const TimePickerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  strong {
    color: ${appColors.strongText};
    font-size: 14px;
    font-weight: 600;
  }

  span {
    color: ${appColors.muted};
    font-size: 12px;
  }
`

export const TimeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;

  @media (max-width: 520px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`

export const TimeOption = styled.button`
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: ${appColors.surfaceLow};
  color: ${appColors.text};
  font-size: 12px;
  font-weight: 500;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;

  &:hover {
    background: ${appColors.primaryTint};
  }

  &[data-selected='true'] {
    border-color: ${appColors.primary};
    background: ${appColors.primary};
    color: ${appColors.primaryText};
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
`

export const TimeRangeError = styled.p`
  margin: 10px 0 0;
  color: ${appColors.primary};
  font-size: 13px;
`

export const OperatingHoursConfirmButton = styled.button`
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
