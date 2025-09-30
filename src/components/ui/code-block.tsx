"use client"

import React from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { Check, Copy } from "lucide-react"

export type CodeBlockProps = {
  language: string
  filename: string
  highlightLines?: number[]
} & (
  | {
      code: string
      tabs?: never
    }
  | {
      code?: never
      tabs: Array<{
        name: string
        code: string
        language?: string
        highlightLines?: number[]
      }>
    }
)

export const CodeBlock = ({
  language,
  filename,
  code,
  highlightLines = [],
  tabs = [],
}: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState(0)

  const tabsExist = tabs.length > 0

  const copyToClipboard = async () => {
    const textToCopy = tabsExist ? tabs[activeTab].code : code
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const activeCode = tabsExist ? tabs[activeTab].code : code
  const activeLanguage = tabsExist
    ? tabs[activeTab].language || language
    : language
  const activeHighlightLines = tabsExist
    ? tabs[activeTab].highlightLines || []
    : highlightLines

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950 p-5 font-mono text-sm shadow-[0_25px_55px_-20px_rgba(8,15,45,0.65)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 via-white/0 to-transparent"
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {tabsExist && (
            <div className="flex overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-3 !py-2 text-xs transition-colors font-sans ${
                    activeTab === index
                      ? "rounded-full bg-slate-800/80 text-white"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          )}
          {!tabsExist && filename && (
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2 text-xs font-sans text-zinc-400">
              <div>{filename}</div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-100"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
        <SyntaxHighlighter
          language={activeLanguage}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
            fontSize: "0.875rem",
          }}
          wrapLines={true}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2.75rem",
            color: "rgba(148, 163, 184, 0.5)",
          }}
          lineProps={(lineNumber) => ({
            style: {
              backgroundColor: activeHighlightLines.includes(lineNumber)
                ? "rgba(148, 163, 184, 0.08)"
                : "transparent",
              display: "block",
              width: "100%",
            },
          })}
          PreTag="div"
        >
          {String(activeCode)}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
