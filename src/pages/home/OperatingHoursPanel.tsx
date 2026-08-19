import { useState, type FormEvent } from 'react'
import type { OperatingHours } from './operatingHours.types'
import { OPERATING_TIME_OPTIONS } from './operatingHoursOptions'
import * as S from './OperatingHoursPanel.styles'

type OperatingHoursPanelProps = {
  confirmedOperatingHours: OperatingHours | null
  onConfirm: (operatingHours: OperatingHours) => void
}

export default function OperatingHoursPanel({
  confirmedOperatingHours,
  onConfirm,
}: OperatingHoursPanelProps) {
  const [startTime, setStartTime] = useState(
    confirmedOperatingHours?.startTime ?? '',
  )
  const [endTime, setEndTime] = useState(
    confirmedOperatingHours?.endTime ?? '',
  )
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | null>(
    null,
  )
  const isConfirmed = confirmedOperatingHours !== null
  const hasInvalidTimeRange = Boolean(
    startTime && endTime && startTime >= endTime,
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!startTime || !endTime || hasInvalidTimeRange || isConfirmed) {
      return
    }

    onConfirm({ startTime, endTime })
  }

  function selectTime(time: string) {
    if (activeTimeField === 'start') {
      setStartTime(time)
      setActiveTimeField('end')
      return
    }

    if (activeTimeField === 'end') {
      setEndTime(time)
      setActiveTimeField(null)
    }
  }

  return (
    <S.OperatingHoursPanel data-confirmed={isConfirmed}>
      <S.OperatingHoursPanelHeader>
        <S.OperatingHoursPanelTitle>주요 운영 시간대</S.OperatingHoursPanelTitle>
        <S.StepBadge>4단계</S.StepBadge>
      </S.OperatingHoursPanelHeader>

      <S.OperatingHoursForm onSubmit={handleSubmit}>
        <S.OperatingHoursQuestion>
          언제부터 언제까지 운영할 계획인가요?
        </S.OperatingHoursQuestion>
        <S.OperatingHoursHelp>
          일반적으로 운영할 시작 시간과 종료 시간을 선택해 주세요.
        </S.OperatingHoursHelp>

        <S.TimeFieldGrid>
          <S.TimeFieldButton
            type="button"
            data-active={activeTimeField === 'start'}
            data-selected={Boolean(startTime)}
            aria-expanded={activeTimeField === 'start'}
            onClick={() =>
              setActiveTimeField((currentField) =>
                currentField === 'start' ? null : 'start',
              )
            }
            disabled={isConfirmed}
          >
            <span>시작</span>
            <strong>{startTime || '시간 선택'}</strong>
          </S.TimeFieldButton>

          <S.TimeRangeConnector aria-hidden="true">→</S.TimeRangeConnector>

          <S.TimeFieldButton
            type="button"
            data-active={activeTimeField === 'end'}
            data-selected={Boolean(endTime)}
            aria-expanded={activeTimeField === 'end'}
            onClick={() =>
              setActiveTimeField((currentField) =>
                currentField === 'end' ? null : 'end',
              )
            }
            disabled={isConfirmed}
          >
            <span>종료</span>
            <strong>{endTime || '시간 선택'}</strong>
          </S.TimeFieldButton>
        </S.TimeFieldGrid>

        {activeTimeField ? (
          <S.TimePicker>
            <S.TimePickerHeader>
              <strong>{activeTimeField === 'start' ? '시작 시간' : '종료 시간'} 선택</strong>
              <span>30분 단위</span>
            </S.TimePickerHeader>
            <S.TimeGrid aria-label={`${activeTimeField === 'start' ? '시작' : '종료'} 시간 선택`}>
              {(activeTimeField === 'start'
                ? OPERATING_TIME_OPTIONS.slice(0, -1)
                : OPERATING_TIME_OPTIONS
              ).map((time) => {
                const isSelected =
                  activeTimeField === 'start'
                    ? startTime === time
                    : endTime === time

                return (
                  <S.TimeOption
                    key={time}
                    type="button"
                    data-selected={isSelected}
                    aria-pressed={isSelected}
                    onClick={() => selectTime(time)}
                  >
                    {time}
                  </S.TimeOption>
                )
              })}
            </S.TimeGrid>
          </S.TimePicker>
        ) : null}

        {hasInvalidTimeRange ? (
          <S.TimeRangeError role="alert">
            종료 시간은 시작 시간보다 늦어야 합니다.
          </S.TimeRangeError>
        ) : null}

        <S.OperatingHoursConfirmButton
          type="submit"
          disabled={!startTime || !endTime || hasInvalidTimeRange || isConfirmed}
        >
          {isConfirmed ? '운영 시간 선택 완료' : '이 시간대로 선택'}
        </S.OperatingHoursConfirmButton>
      </S.OperatingHoursForm>
    </S.OperatingHoursPanel>
  )
}
