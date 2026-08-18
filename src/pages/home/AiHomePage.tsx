import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import * as S from './AiHomePage.styles'

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 4.5-4 3.5 3 2.5-2 5.5 5" />
    </svg>
  )
}

function AiHomePage() {
  const [prompt, setPrompt] = useState('')
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const promptHeightRef = useRef(44)
  const promptLengthRef = useRef(0)

  useLayoutEffect(() => {
    const input = promptInputRef.current

    if (!input) {
      return
    }

    const currentHeight = input.getBoundingClientRect().height
    const isPromptShorter = prompt.length < promptLengthRef.current
    promptLengthRef.current = prompt.length

    let contentHeight = input.scrollHeight

    if (isPromptShorter) {
      input.style.height = 'auto'
      contentHeight = input.scrollHeight
      input.style.height = `${currentHeight}px`
    }

    const nextHeight = Math.min(contentHeight, 140)
    input.style.overflowY = contentHeight > 140 ? 'auto' : 'hidden'

    if (nextHeight === promptHeightRef.current) {
      return
    }

    promptHeightRef.current = nextHeight
    input.style.height = `${currentHeight}px`

    const animationFrame = requestAnimationFrame(() => {
      input.style.height = `${nextHeight}px`
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [prompt])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function handlePromptChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const input = event.currentTarget
    const nextPrompt = input.value

    setPrompt(nextPrompt)
    setIsPromptExpanded(
      nextPrompt.length > 0 && (isPromptExpanded || input.scrollHeight > 44),
    )
  }

  return (
    <S.PageShell>
      <S.Sidebar>
        <S.SidebarHeader>
          <S.BrandLogo src="/pingdom-logo.png" alt="Pingdom" />
        </S.SidebarHeader>

        <S.NewChatButton
          type="button"
          onClick={() => {
            setPrompt('')
            setIsPromptExpanded(false)
          }}
        >
          <PlusIcon />
          새 상담
        </S.NewChatButton>

        <S.SidebarContent>
          <S.SidebarLabel>상담</S.SidebarLabel>
          <S.EmptyHistory>아직 저장된 상담이 없습니다.</S.EmptyHistory>
        </S.SidebarContent>

      </S.Sidebar>

      <S.Workspace>
        <S.TopBar>
          <S.MobileBrandLogo src="/pingdom-logo.png" alt="Pingdom" />
        </S.TopBar>

        <S.ChatMain>
          <S.EmptyState aria-live="polite">
            <S.MessageTitle>어떤 가게를 준비하고 계신가요?</S.MessageTitle>
            <S.MessageText>
              지역과 업종을 알려주시면 핑덤의 유동인구 데이터를 바탕으로
              입지와 상권을 함께 살펴볼게요.
            </S.MessageText>

            <S.ComposerArea>
              <S.Form
                onSubmit={handleSubmit}
                data-expanded={isPromptExpanded}
              >
                <S.InputActionWrapper
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsAttachmentMenuOpen(false)
                    }
                  }}
                >
                  <S.InputAction
                    type="button"
                    aria-label="추가 기능"
                    aria-haspopup="menu"
                    aria-expanded={isAttachmentMenuOpen}
                    onClick={() => setIsAttachmentMenuOpen((isOpen) => !isOpen)}
                  >
                    <PlusIcon />
                  </S.InputAction>

                  {isAttachmentMenuOpen ? (
                    <S.AttachmentMenu role="menu" aria-label="추가할 항목 선택">
                      <S.AttachmentMenuItem
                        type="button"
                        role="menuitem"
                        onClick={() => setIsAttachmentMenuOpen(false)}
                      >
                        <S.MenuItemIcon><FileIcon /></S.MenuItemIcon>
                        <S.MenuItemText>
                          <strong>파일 첨부</strong>
                          <span>PDF, 문서, 표</span>
                        </S.MenuItemText>
                      </S.AttachmentMenuItem>
                      <S.AttachmentMenuItem
                        type="button"
                        role="menuitem"
                        onClick={() => setIsAttachmentMenuOpen(false)}
                      >
                        <S.MenuItemIcon><ImageIcon /></S.MenuItemIcon>
                        <S.MenuItemText>
                          <strong>사진 첨부</strong>
                          <span>매장 및 상권 이미지</span>
                        </S.MenuItemText>
                      </S.AttachmentMenuItem>
                    </S.AttachmentMenu>
                  ) : null}
                </S.InputActionWrapper>
                <S.PromptInput
                  ref={promptInputRef}
                  rows={1}
                  value={prompt}
                  onChange={handlePromptChange}
                  onKeyDown={handleKeyDown}
                  placeholder="궁금한 상권이나 입지를 물어보세요"
                  aria-label="AI 질문 입력"
                />
                <S.SubmitButton
                  type="submit"
                  disabled={!prompt.trim()}
                  aria-label="질문 보내기"
                >
                  <ArrowUpIcon />
                </S.SubmitButton>
              </S.Form>
              <S.ComposerHint>
                핑덤의 유동인구 데이터와 AI 분석을 바탕으로 답변합니다.
              </S.ComposerHint>
            </S.ComposerArea>
          </S.EmptyState>
        </S.ChatMain>
      </S.Workspace>
    </S.PageShell>
  )
}

export default AiHomePage
