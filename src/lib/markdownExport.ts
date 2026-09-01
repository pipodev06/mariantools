import { lexer } from 'marked'
import type { Token, Tokens } from 'marked'
import { jsPDF } from 'jspdf'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

type Run = { text: string; bold?: boolean; italic?: boolean; code?: boolean }

// Aplana los tokens inline (strong/em/codespan/link/text) de un bloque a una
// lista plana de "runs" con su estilo — recorre recursivamente para que
// **negrita** dentro de una lista o un heading también se detecte.
const flattenInline = (tokens: Token[] = [], bold = false, italic = false): Run[] => {
  const runs: Run[] = []
  for (const token of tokens) {
    switch (token.type) {
      case 'strong':
        runs.push(...flattenInline((token as Tokens.Strong).tokens, true, italic))
        break
      case 'em':
        runs.push(...flattenInline((token as Tokens.Em).tokens, bold, true))
        break
      case 'codespan':
        runs.push({ text: (token as Tokens.Codespan).text, code: true })
        break
      case 'link':
        runs.push(...flattenInline((token as Tokens.Link).tokens, bold, italic))
        break
      case 'br':
        runs.push({ text: '\n' })
        break
      case 'text':
      case 'escape':
        runs.push({ text: (token as Tokens.Text).text, bold, italic })
        break
      default:
        if ('text' in token) runs.push({ text: (token as { text: string }).text, bold, italic })
    }
  }
  return runs
}

const plainText = (tokens: Token[] = []) => flattenInline(tokens).map((r) => r.text).join('')

const HEADING_SIZES = [22, 18, 15, 13, 12, 11]

/**
 * PDF: para mantener esto simple, el texto se renderiza plano (sin negrita/
 * cursiva por palabra dentro de un párrafo) — jsPDF no tiene wrapping de
 * texto enriquecido nativo, y soportarlo bien requiere trackear la posición
 * x de cada run manualmente. Headings sí quedan en negrita, y los bloques de
 * código en monoespaciada. El export a Word sí soporta negrita/cursiva
 * inline por palabra (ver markdownToDocx).
 */
export const markdownToPdf = (markdown: string): Blob => {
  const tokens = lexer(markdown)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - marginX * 2
  let y = 56

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > pageHeight - 48) {
      doc.addPage()
      y = 56
    }
  }

  const writeLines = (text: string, x: number, size: number, style: 'normal' | 'bold' | 'italic', font: string, lineHeight: number) => {
    doc.setFont(font, style)
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, maxWidth - (x - marginX)) as string[]
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, x, y)
      y += lineHeight
    }
  }

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const h = token as Tokens.Heading
        const size = HEADING_SIZES[Math.min(h.depth - 1, 5)]
        writeLines(plainText(h.tokens), marginX, size, 'bold', 'helvetica', size * 1.25)
        y += 8
        break
      }
      case 'paragraph': {
        const p = token as Tokens.Paragraph
        writeLines(plainText(p.tokens), marginX, 11, 'normal', 'helvetica', 15)
        y += 8
        break
      }
      case 'list': {
        const list = token as Tokens.List
        list.items.forEach((item, i) => {
          const prefix = list.ordered ? `${(typeof list.start === 'number' ? list.start : 1) + i}.` : '•'
          writeLines(`${prefix} ${plainText(item.tokens)}`, marginX + 14, 11, 'normal', 'helvetica', 15)
        })
        y += 8
        break
      }
      case 'code': {
        const c = token as Tokens.Code
        for (const line of c.text.split('\n')) {
          ensureSpace(13)
          doc.setFont('courier', 'normal')
          doc.setFontSize(9.5)
          doc.text(line, marginX + 8, y)
          y += 13
        }
        y += 10
        break
      }
      case 'blockquote': {
        const bq = token as Tokens.Blockquote
        const text = bq.tokens
          .filter((t): t is Tokens.Paragraph => t.type === 'paragraph')
          .map((t) => plainText(t.tokens))
          .join(' ')
        writeLines(text, marginX + 16, 11, 'italic', 'helvetica', 15)
        y += 8
        break
      }
      case 'hr':
        ensureSpace(20)
        doc.setDrawColor(200)
        doc.line(marginX, y, pageWidth - marginX, y)
        y += 20
        break
      default:
        break
    }
  }

  return doc.output('blob')
}

export const markdownToDocx = async (markdown: string): Promise<Blob> => {
  const tokens = lexer(markdown)
  const children: Paragraph[] = []

  const toRuns = (inline: Token[]) =>
    flattenInline(inline).map(
      (r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic, font: r.code ? 'Courier New' : undefined }),
    )

  const HEADING_LEVELS = [
    HeadingLevel.HEADING_1,
    HeadingLevel.HEADING_2,
    HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4,
    HeadingLevel.HEADING_5,
    HeadingLevel.HEADING_6,
  ]

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const h = token as Tokens.Heading
        children.push(
          new Paragraph({ heading: HEADING_LEVELS[Math.min(h.depth - 1, 5)], children: toRuns(h.tokens) }),
        )
        break
      }
      case 'paragraph': {
        const p = token as Tokens.Paragraph
        children.push(new Paragraph({ children: toRuns(p.tokens), spacing: { after: 160 } }))
        break
      }
      case 'list': {
        const list = token as Tokens.List
        list.items.forEach((item, i) => {
          const prefix = list.ordered ? `${(typeof list.start === 'number' ? list.start : 1) + i}.` : '•'
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${prefix} ` }), ...toRuns(item.tokens)],
              indent: { left: 360 },
            }),
          )
        })
        break
      }
      case 'code': {
        const c = token as Tokens.Code
        c.text.split('\n').forEach((line) => {
          children.push(new Paragraph({ children: [new TextRun({ text: line, font: 'Courier New', size: 20 })] }))
        })
        break
      }
      case 'blockquote': {
        const bq = token as Tokens.Blockquote
        const text = bq.tokens
          .filter((t): t is Tokens.Paragraph => t.type === 'paragraph')
          .map((t) => plainText(t.tokens))
          .join(' ')
        children.push(new Paragraph({ children: [new TextRun({ text, italics: true })], indent: { left: 360 } }))
        break
      }
      case 'hr':
        children.push(new Paragraph({ text: '' }))
        break
      default:
        break
    }
  }

  const document = new Document({ sections: [{ children }] })
  return Packer.toBlob(document)
}
