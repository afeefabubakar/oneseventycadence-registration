import React from 'react'

interface LexicalTextNode {
  type: 'text'
  text: string
  format?: number
}

interface LexicalLinkNode {
  type: 'link'
  fields?: {
    url: string
    newTab?: boolean
  }
  children: LexicalNode[]
}

interface LexicalElementNode {
  type: 'paragraph' | 'heading' | 'list' | 'listitem'
  tag?: string
  children: LexicalNode[]
}

type LexicalNode = LexicalTextNode | LexicalLinkNode | LexicalElementNode

interface RichTextRendererProps {
  content?: {
    root?: {
      children?: LexicalNode[]
    }
  } | null
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content || !content.root || !content.root.children) return null

  function renderTextNode(node: LexicalTextNode, key: string) {
    let element: React.ReactNode = node.text
    const format = node.format || 0

    // Bold (1)
    if (format & 1) {
      element = <strong>{element}</strong>
    }
    // Italic (2)
    if (format & 2) {
      element = <em>{element}</em>
    }
    // Underline (8)
    if (format & 8) {
      element = <span className="underline">{element}</span>
    }
    // Strikethrough (4)
    if (format & 4) {
      element = <span className="line-through">{element}</span>
    }

    return <React.Fragment key={key}>{element}</React.Fragment>
  }

  function renderNode(node: LexicalNode, index: number): React.ReactNode {
    const key = `node-${index}`

    if (node.type === 'text') {
      return renderTextNode(node as LexicalTextNode, key)
    }

    const children = (node as any).children?.map((child: LexicalNode, idx: number) =>
      renderNode(child, idx)
    )

    if (node.type === 'link') {
      const linkNode = node as LexicalLinkNode
      const href = linkNode.fields?.url || ''
      const target = linkNode.fields?.newTab ? '_blank' : undefined
      return (
        <a
          key={key}
          href={href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-pink-600 hover:underline font-medium"
        >
          {children}
        </a>
      )
    }

    if (node.type === 'paragraph') {
      return <p key={key} className="mt-1.5 text-gray-600 text-sm leading-relaxed">{children}</p>
    }

    if (node.type === 'heading') {
      const elementNode = node as LexicalElementNode
      const Tag = (elementNode.tag || 'h3') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Tag key={key} className="mt-4 mb-2 font-bold text-gray-900">
          {children}
        </Tag>
      )
    }

    if (node.type === 'list') {
      const elementNode = node as LexicalElementNode
      const Tag = (elementNode.tag || 'ul') as 'ul' | 'ol'
      const listClass = Tag === 'ol' ? 'list-decimal pl-5 mt-1.5 space-y-1 text-sm text-gray-600' : 'list-disc pl-5 mt-1.5 space-y-1 text-sm text-gray-600'
      return (
        <Tag key={key} className={listClass}>
          {children}
        </Tag>
      )
    }

    if (node.type === 'listitem') {
      return <li key={key}>{children}</li>
    }

    return children ? <span key={key}>{children}</span> : null
  }

  return (
    <div className="rich-text">
      {content.root.children.map((node, idx) => renderNode(node, idx))}
    </div>
  )
}
