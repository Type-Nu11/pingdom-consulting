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

const contentEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const LocationPanel = styled.section`
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

export const LocationPanelHeader = styled.header`
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 22px;
  border-bottom: 1px solid ${appColors.borderSoft};

  @media (max-width: 520px) {
    align-items: flex-start;
    padding: 14px 16px;
  }
`

export const LocationPanelTitle = styled.h3`
  margin: 0;
  color: ${appColors.strongText};
  font-size: 15px;
  font-weight: 600;
`

export const LocationHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const MapToggle = styled.button`
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid ${appColors.border};
  border-radius: 999px;
  background: ${appColors.surface};
  color: ${appColors.text};
  font-size: 12px;
  font-weight: 500;

  svg {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover {
    border-color: ${appColors.primarySoft};
    background: ${appColors.primaryTint};
  }

  &:focus-visible {
    outline: 2px solid ${appColors.primarySoft};
    outline-offset: 2px;
  }
`

export const LocationStepBadge = styled.span`
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

export const LocationContent = styled.div`
  padding: 24px;

  @media (max-width: 520px) {
    padding: 20px 16px;
  }
`

export const LocationQuestion = styled.h4`
  margin: 0;
  color: ${appColors.strongText};
  font-size: clamp(18px, 2vw, 21px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.4;
`

export const LocationHelp = styled.p`
  margin: 8px 0 0;
  color: ${appColors.muted};
  font-size: 14px;
  letter-spacing: -0.02em;
  line-height: 1.6;
`

export const LocationSearchArea = styled.div`
  margin-top: 22px;
`

export const LocationSearchForm = styled.form`
  min-height: 54px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  align-items: center;
  gap: 8px;
  padding: 5px 6px 5px 16px;
  border: 1px solid ${appColors.border};
  border-radius: 15px;
  background: ${appColors.surface};
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &:focus-within {
    border-color: ${appColors.primary};
    box-shadow: 0 0 0 3px #ff195614;
  }
`

export const LocationSearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: ${appColors.text};
  font: inherit;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #9999a1;
  }
`

export const LocationSearchButton = styled.button`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 12px;
  background: ${appColors.primary};
  color: ${appColors.primaryText};

  svg {
    width: 19px;
    height: 19px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  &:disabled {
    background: #eeeeef;
    color: #b7b7bd;
  }
`

export const SearchMessage = styled.p`
  margin: 10px 4px 0;
  color: ${appColors.muted};
  font-size: 13px;
`

export const SearchError = styled(SearchMessage)`
  color: #c8284f;
`

export const LocationResults = styled.div`
  max-height: 310px;
  display: grid;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  overflow-y: auto;
  border: 1px solid ${appColors.borderSoft};
  border-radius: 14px;
  background: ${appColors.surface};
  box-shadow: 0 14px 34px #0000000d;
  animation: ${contentEnter} 260ms ease both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const LocationResultButton = styled.button`
  display: grid;
  gap: 6px;
  padding: 11px 12px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: transparent;
  color: ${appColors.text};
  text-align: left;

  &:hover:not(:disabled) {
    background: ${appColors.primaryTint};
  }

  &[data-selected='true'] {
    border-color: ${appColors.primary};
    background: #ff19560d;
  }
`

export const ResultMain = styled.span`
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;

  strong {
    min-width: 0;
    overflow: hidden;
    color: ${appColors.strongText};
    font-size: 14px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    flex-shrink: 0;
    color: ${appColors.muted};
    font-size: 11px;
  }
`

export const ResultAddress = styled.span`
  overflow: hidden;
  color: ${appColors.muted};
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const MapView = styled.div`
  position: relative;
  height: 380px;
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid ${appColors.borderSoft};
  border-radius: 16px;
  background: #f4f5f7;
  animation: ${contentEnter} 320ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (max-width: 520px) {
    height: 300px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const MapViewport = styled.div`
  width: 100%;
  height: 100%;

  ${MapView}[data-disabled='true'] & {
    pointer-events: none;
  }
`

export const MapOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-content: center;
  gap: 6px;
  padding: 24px;
  background: #ffffffeb;
  color: ${appColors.muted};
  font-size: 13px;
  text-align: center;

  strong {
    color: ${appColors.strongText};
    font-size: 14px;
  }
`

export const MapGuide = styled.p`
  position: absolute;
  left: 50%;
  bottom: 12px;
  z-index: 1;
  max-width: calc(100% - 24px);
  margin: 0;
  padding: 7px 11px;
  border-radius: 999px;
  background: #202024d9;
  color: #ffffff;
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
  transform: translateX(-50%);

  @media (max-width: 520px) {
    white-space: normal;
  }
`

export const SelectedLocation = styled.div`
  display: grid;
  gap: 7px;
  margin-top: 14px;
  padding: 13px 14px;
  border-radius: 12px;
  background: ${appColors.primaryTint};

  p,
  small {
    margin: 0;
  }

  p {
    color: ${appColors.text};
    font-size: 13px;
  }

  small {
    color: ${appColors.muted};
    font-size: 11px;
  }
`

export const SelectedLocationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  span {
    flex-shrink: 0;
    color: ${appColors.muted};
    font-size: 12px;
  }

  strong {
    color: ${appColors.primary};
    font-size: 14px;
    font-weight: 600;
    text-align: right;
  }
`

export const LocationConfirmForm = styled.form`
  margin-top: 18px;
`

export const LocationConfirmButton = styled.button`
  width: 100%;
  min-height: 52px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: ${appColors.primary};
  color: ${appColors.primaryText};
  font-size: 14px;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: ${appColors.primaryHover};
  }

  &:disabled {
    background: #eeeeef;
    color: #b7b7bd;
  }
`
