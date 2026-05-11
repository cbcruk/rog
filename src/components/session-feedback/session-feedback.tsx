import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">코칭 피드백</h2>
        <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-sm">
          <p className="text-muted-foreground">아직 이 세션에 대한 코칭이 없습니다.</p>
          <p className="mt-3 text-muted-foreground">
            Claude Code에서 다음 명령으로 분석과 피드백을 받으세요:
          </p>
          <code className="mt-2 inline-block rounded bg-background/80 px-2 py-1 font-mono text-foreground">
            /run {sessionId}
          </code>
          <p className="mt-3 text-xs text-muted-foreground">
            생성된 피드백은{' '}
            <code className="rounded bg-background/80 px-1">results/{sessionId}/feedback.md</code>{' '}
            에 저장되며 새로고침 시 자동으로 표시됩니다.
          </p>
        </div>
      </section>
    )
  }

  const content = extractCoachingSection(feedback)

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">코칭 피드백</h2>
      <div className="rounded-lg border bg-muted/30 p-5">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ ...props }) => (
              <h3 className="mt-5 border-b pb-1 text-base font-semibold first:mt-0" {...props} />
            ),
            h3: ({ ...props }) => (
              <h4 className="mt-4 text-sm font-semibold text-muted-foreground" {...props} />
            ),
            p: ({ ...props }) => <p className="my-2 text-sm leading-relaxed" {...props} />,
            ul: ({ ...props }) => (
              <ul className="my-2 list-disc space-y-1 pl-5 text-sm" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol className="my-2 list-decimal space-y-1 pl-5 text-sm" {...props} />
            ),
            li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
            strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
            em: ({ ...props }) => <em className="italic" {...props} />,
            blockquote: ({ ...props }) => (
              <blockquote
                className="my-3 rounded-md border-l-4 border-blue bg-blue/10 px-4 py-2 text-sm"
                {...props}
              />
            ),
            hr: () => <hr className="my-4 border-border" />,
            table: ({ ...props }) => (
              <div className="my-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm" {...props} />
              </div>
            ),
            thead: ({ ...props }) => (
              <thead className="border-b text-muted-foreground" {...props} />
            ),
            th: ({ ...props }) => <th className="p-2 text-left font-medium" {...props} />,
            td: ({ ...props }) => (
              <td className="border-b border-border/40 p-2 tabular-nums" {...props} />
            ),
            code: ({ ...props }) => (
              <code className="rounded bg-background/80 px-1 py-0.5 font-mono text-xs" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </section>
  )
}
