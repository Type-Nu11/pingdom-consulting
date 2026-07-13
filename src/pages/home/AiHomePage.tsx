import { useState, type FormEvent } from 'react'
import * as S from './AiHomePage.styles'

const starterPrompts = [
  '핑돔을 처음 쓰는 사람에게 서비스를 설명해줘',
  '내 주변에서 할 만한 활동을 추천해줘',
  '이번 주말 핑돔 콘텐츠를 요약해줘',
]

function AiHomePage() {
  const [prompt, setPrompt] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  function handleStarterPrompt(starterPrompt: string) {
    setPrompt(starterPrompt)
  }

  return (
    <S.PageShell>
      <S.Header>
        <S.Brand>pingdom</S.Brand>
        <S.HeaderLabel>AI assistant</S.HeaderLabel>
      </S.Header>

      <S.Main>
        <S.Intro>
          <S.Eyebrow>PingDom AI</S.Eyebrow>
          <S.Title>핑돔에서 무엇을<br />찾고 있나요?</S.Title>
          <S.Description>
            장소와 콘텐츠를 더 쉽게 발견할 수 있도록
            <br />AI가 도와드릴게요.
          </S.Description>
        </S.Intro>

        <S.ChatCard>
          <S.ChatCardHeader>
            <S.StatusDot />
            <span>AI에게 물어보기</span>
          </S.ChatCardHeader>
          <S.Form onSubmit={handleSubmit}>
            <S.PromptInput
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="궁금한 내용을 입력해 주세요"
              aria-label="AI 질문 입력"
            />
            <S.SubmitButton type="submit" aria-label="질문 보내기">
              <span>→</span>
            </S.SubmitButton>
          </S.Form>
          <S.CardFooter>
            <span>아직 AI 연결 전인 초기 화면입니다.</span>
            <span>Enter로 질문 보내기</span>
          </S.CardFooter>
        </S.ChatCard>

        <S.StarterSection>
          <S.SectionLabel>이렇게 시작해 보세요</S.SectionLabel>
          <S.StarterList>
            {starterPrompts.map((starterPrompt) => (
              <S.StarterButton
                key={starterPrompt}
                type="button"
                onClick={() => handleStarterPrompt(starterPrompt)}
              >
                {starterPrompt}
                <span>↗</span>
              </S.StarterButton>
            ))}
          </S.StarterList>
        </S.StarterSection>
      </S.Main>

      <S.Footer>© PingDom</S.Footer>
    </S.PageShell>
  )
}

export default AiHomePage
