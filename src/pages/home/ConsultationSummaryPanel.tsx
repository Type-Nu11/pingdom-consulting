import { useState, type FormEvent } from 'react'
import type { LocationSelection } from '../../features/location/location.types'
import type { TargetCustomerSelection } from './targetCustomerOptions'
import LocationSelectionPanel from './LocationSelectionPanel'
import * as S from './ConsultationSummaryPanel.styles'

const ADDITIONAL_DETAILS_MAX_LENGTH = 500

type ConsultationSummaryPanelProps = {
  categoryLabel: string
  location: LocationSelection
  targetCustomer: TargetCustomerSelection
  categoryOptions: readonly string[]
  additionalDetails: string
  isConfirmed: boolean
  onAdditionalDetailsChange: (value: string) => void
  onCategoryChange: (categoryLabel: string) => void
  onLocationChange: (location: LocationSelection) => void
  onTargetCustomerChange: () => void
  onConfirm: () => void
}

export default function ConsultationSummaryPanel({
  categoryLabel,
  location,
  targetCustomer,
  categoryOptions,
  additionalDetails,
  isConfirmed,
  onAdditionalDetailsChange,
  onCategoryChange,
  onLocationChange,
  onTargetCustomerChange,
  onConfirm,
}: ConsultationSummaryPanelProps) {
  const [editingField, setEditingField] = useState<
    'category' | 'location' | null
  >(null)
  const [draftCategory, setDraftCategory] = useState(categoryLabel)
  const [draftCustomCategory, setDraftCustomCategory] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isConfirmed && editingField === null) {
      onConfirm()
    }
  }

  function openCategoryEditor() {
    const isKnownCategory = categoryOptions.includes(categoryLabel)
    setDraftCategory(isKnownCategory ? categoryLabel : '기타')
    setDraftCustomCategory(isKnownCategory ? '' : categoryLabel)
    setEditingField('category')
  }

  function applyCategoryChange() {
    const nextCategory =
      draftCategory === '기타'
        ? draftCustomCategory.trim()
        : draftCategory

    if (!nextCategory) {
      return
    }

    onCategoryChange(nextCategory)
    setEditingField(null)
  }

  return (
    <S.SummaryPanel data-confirmed={isConfirmed}>
      <S.SummaryHeader>
        <S.SummaryTitle>상담 정보 확인</S.SummaryTitle>
        <S.StepBadge>4단계</S.StepBadge>
      </S.SummaryHeader>

      <S.SummaryForm onSubmit={handleSubmit}>
        <S.SummaryQuestion>지금까지 알려주신 정보가 맞나요?</S.SummaryQuestion>
        <S.SummaryHelp>
          수정할 내용이 있다면 항목별로 다시 선택해 주세요.
        </S.SummaryHelp>

        <S.SummaryList>
          <S.SummaryItem>
            <S.ItemCopy>
              <span>가게 업종</span>
              <strong>{categoryLabel}</strong>
            </S.ItemCopy>
            <S.EditButton
              type="button"
              onClick={openCategoryEditor}
              disabled={isConfirmed}
            >
              수정
            </S.EditButton>
          </S.SummaryItem>

          {editingField === 'category' ? (
            <S.InlineEditor aria-label="가게 업종 수정">
              <S.CategoryChoices>
                {categoryOptions.map((option) => (
                  <S.CategoryChoice
                    key={option}
                    type="button"
                    data-selected={draftCategory === option}
                    aria-pressed={draftCategory === option}
                    onClick={() => setDraftCategory(option)}
                  >
                    {option}
                  </S.CategoryChoice>
                ))}
              </S.CategoryChoices>

              {draftCategory === '기타' ? (
                <S.CustomCategoryInput
                  value={draftCustomCategory}
                  onChange={(event) =>
                    setDraftCustomCategory(event.currentTarget.value)
                  }
                  placeholder="어떤 가게인지 입력해 주세요"
                  maxLength={40}
                  autoFocus
                />
              ) : null}

              <S.EditorActions>
                <S.CancelButton
                  type="button"
                  onClick={() => setEditingField(null)}
                >
                  취소
                </S.CancelButton>
                <S.ApplyButton
                  type="button"
                  onClick={applyCategoryChange}
                  disabled={
                    draftCategory === '기타' &&
                    draftCustomCategory.trim().length === 0
                  }
                >
                  적용
                </S.ApplyButton>
              </S.EditorActions>
            </S.InlineEditor>
          ) : null}

          <S.SummaryItem>
            <S.ItemCopy>
              <span>희망 장소</span>
              <strong>{location.displayName}</strong>
              <small>{location.roadAddress || location.address}</small>
            </S.ItemCopy>
            <S.EditButton
              type="button"
              onClick={() => setEditingField('location')}
              disabled={isConfirmed}
            >
              수정
            </S.EditButton>
          </S.SummaryItem>

          <S.SummaryItem>
            <S.ItemCopy>
              <span>주요 고객층 연령대</span>
              <strong>{targetCustomer.ageGroups.join(', ')}</strong>
            </S.ItemCopy>
          </S.SummaryItem>

          <S.SummaryItem>
            <S.ItemCopy>
              <span>주요 고객층 국적</span>
              <strong>{targetCustomer.nationality}</strong>
            </S.ItemCopy>
            <S.EditButton
              type="button"
              onClick={onTargetCustomerChange}
              disabled={isConfirmed}
            >
              수정
            </S.EditButton>
          </S.SummaryItem>

          {editingField === 'location' ? (
            <S.InlineLocationEditor aria-label="희망 장소 수정">
              <LocationSelectionPanel
                confirmedLocation={null}
                initialLocation={location}
                onConfirm={(nextLocation) => {
                  onLocationChange(nextLocation)
                  setEditingField(null)
                }}
              />
              <S.EditorActions>
                <S.CancelButton
                  type="button"
                  onClick={() => setEditingField(null)}
                >
                  장소 수정 취소
                </S.CancelButton>
              </S.EditorActions>
            </S.InlineLocationEditor>
          ) : null}
        </S.SummaryList>

        <S.AdditionalField>
          <S.AdditionalLabel htmlFor="consultation-additional-details">
            <span>기타 요청사항</span>
            <small>선택</small>
          </S.AdditionalLabel>
          <S.AdditionalTextarea
            id="consultation-additional-details"
            value={additionalDetails}
            onChange={(event) =>
              onAdditionalDetailsChange(event.currentTarget.value)
            }
            placeholder="예: 주차가 가능한 곳이면 좋겠어요. 평일 저녁 유동인구를 중요하게 보고 싶어요."
            maxLength={ADDITIONAL_DETAILS_MAX_LENGTH}
            disabled={isConfirmed}
          />
          <S.CharacterCount>
            {additionalDetails.length}/{ADDITIONAL_DETAILS_MAX_LENGTH}
          </S.CharacterCount>
        </S.AdditionalField>

        <S.ConfirmButton
          type="submit"
          disabled={isConfirmed || editingField !== null}
        >
          {isConfirmed ? '확인 완료' : '이 정보로 상담 시작'}
        </S.ConfirmButton>
      </S.SummaryForm>
    </S.SummaryPanel>
  )
}
