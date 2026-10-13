import { Card } from '@astryxdesign/core/Card'
import { Heading } from '@astryxdesign/core/Heading'
import { Markdown } from '@astryxdesign/core/Markdown'
import { Text } from '@astryxdesign/core/Text'

interface SessionFeedbackProps {
  feedback: string | undefined
  sessionId: string
}

const COACHING_HEADING = '## Coaching Feedback'

function extractCoachingSection(feedback: string): string {
  const idx = feedback.indexOf(COACHING_HEADING)
  return idx >= 0 ? feedback.slice(idx + COACHING_HEADING.length).trim() : feedback.trim()
}

export function SessionFeedback({ feedback, sessionId }: SessionFeedbackProps): React.ReactElement {
  if (!feedback) {
    return (
      <section className="mt-6 flex flex-col gap-2">
        <Heading level={2}>코칭 피드백</Heading>
        <Card variant="muted">
          <Text color="secondary" display="block">
            아직 이 세션에 대한 코칭이 없습니다.
          </Text>
          <Markdown density="compact">
            {[
              `Claude Code에서 다음 명령으로 분석과 피드백을 받으세요:`,
              ``,
              '```',
              `/run ${sessionId}`,
              '```',
              ``,
              `생성된 피드백은 \`results/${sessionId}/feedback.md\` 에 저장되며 새로고침 시 자동으로 표시됩니다.`,
            ].join('\n')}
          </Markdown>
        </Card>
      </section>
    )
  }

  return (
    <section className="mt-6 flex flex-col gap-2">
      <Heading level={2}>코칭 피드백</Heading>
      <Card>
        {/*
         * 피드백 원문은 h2부터 시작한다. 페이지의 h1/h2 아래에 놓이므로
         * headingLevelStart로 한 단계 내려 문서 개요가 어긋나지 않게 한다.
         */}
        <Markdown headingLevelStart={3} contentWidth="100%">
          {extractCoachingSection(feedback)}
        </Markdown>
      </Card>
    </section>
  )
}
