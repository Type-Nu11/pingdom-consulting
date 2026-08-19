import { useState, type FormEvent } from 'react'
import * as S from './TargetCustomerPanel.styles'
import {
  AGE_GROUPS,
  CUSTOMER_NATIONALITIES,
  type AgeGroup,
  type CustomerNationality,
  type TargetCustomerSelection,
} from './targetCustomerOptions'

type TargetCustomerPanelProps = {
  confirmedCustomer: TargetCustomerSelection | null
  onConfirm: (customer: TargetCustomerSelection) => void
}

export default function TargetCustomerPanel({
  confirmedCustomer,
  onConfirm,
}: TargetCustomerPanelProps) {
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>(
    confirmedCustomer?.ageGroups ?? [],
  )
  const [selectedNationality, setSelectedNationality] =
    useState<CustomerNationality | null>(
      confirmedCustomer?.nationality ?? null,
    )
  const isConfirmed = confirmedCustomer !== null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedAgeGroups.length === 0 || !selectedNationality || isConfirmed) {
      return
    }

    onConfirm({
      ageGroups: selectedAgeGroups,
      nationality: selectedNationality,
    })
  }

  return (
    <S.TargetCustomerPanel data-confirmed={isConfirmed}>
      <S.TargetCustomerPanelHeader>
        <S.TargetCustomerPanelTitle>주요 고객층</S.TargetCustomerPanelTitle>
        <S.StepBadge>3단계</S.StepBadge>
      </S.TargetCustomerPanelHeader>

      <S.TargetCustomerForm onSubmit={handleSubmit}>
        <S.TargetCustomerQuestion>
          주요 고객층의 조건을 설정해 주세요.
        </S.TargetCustomerQuestion>
        <S.TargetCustomerHelp>
          연령대는 복수로, 국적은 하나를 선택하면 이후 상권 분석의 기준으로 활용합니다.
        </S.TargetCustomerHelp>

        <S.TargetCustomerGrid>
          <S.TargetCustomerCard>
            <S.CardHeader>
              <strong>연령대</strong>
              <span>주요 방문 고객의 연령대를 모두 선택해 주세요.</span>
            </S.CardHeader>
            <S.OptionList aria-label="주요 고객층 연령대">
              {AGE_GROUPS.map((ageGroup) => (
                <S.OptionButton
                  key={ageGroup}
                  type="button"
                  data-selected={selectedAgeGroups.includes(ageGroup)}
                  aria-pressed={selectedAgeGroups.includes(ageGroup)}
                  onClick={() => {
                    setSelectedAgeGroups((currentAgeGroups) =>
                      currentAgeGroups.includes(ageGroup)
                        ? currentAgeGroups.filter(
                            (currentAgeGroup) => currentAgeGroup !== ageGroup,
                          )
                        : AGE_GROUPS.filter(
                            (candidateAgeGroup) =>
                              currentAgeGroups.includes(candidateAgeGroup) ||
                              candidateAgeGroup === ageGroup,
                          ),
                    )
                  }}
                  disabled={isConfirmed}
                >
                  {ageGroup}
                </S.OptionButton>
              ))}
            </S.OptionList>
          </S.TargetCustomerCard>

          <S.TargetCustomerCard>
            <S.CardHeader>
              <strong>국적</strong>
              <span>주요 고객의 국적 조건을 하나 선택해 주세요.</span>
            </S.CardHeader>
            <S.OptionList aria-label="주요 고객층 국적">
              {CUSTOMER_NATIONALITIES.map((nationality) => (
                <S.OptionButton
                  key={nationality}
                  type="button"
                  data-selected={selectedNationality === nationality}
                  aria-pressed={selectedNationality === nationality}
                  onClick={() => setSelectedNationality(nationality)}
                  disabled={isConfirmed}
                >
                  {nationality}
                </S.OptionButton>
              ))}
            </S.OptionList>
          </S.TargetCustomerCard>
        </S.TargetCustomerGrid>

        <S.TargetCustomerConfirmButton
          type="submit"
          disabled={
            selectedAgeGroups.length === 0 || !selectedNationality || isConfirmed
          }
        >
          {isConfirmed ? '고객층 선택 완료' : '이 고객층으로 선택'}
        </S.TargetCustomerConfirmButton>
      </S.TargetCustomerForm>
    </S.TargetCustomerPanel>
  )
}
