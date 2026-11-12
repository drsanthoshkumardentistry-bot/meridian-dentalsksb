// In-browser PDF text extraction with pdf.js (lazy-loaded so it doesn't bloat the main bundle).
import { cleanPages, chunkPages } from './textclean.js'

let pdfjsPromise = null
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, worker]) => { pdfjs.GlobalWorkerOptions.workerSrc = worker.default; return pdfjs })
  }
  return pdfjsPromise
}

/** Group pdf.js text items into lines using their y position and end-of-line flags. */
function itemsToText(items) {
  const lines = []
  let line = '', lastY = null
  for (const it of items) {
    const y = it.transform?.[5]
    if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2 && line.trim()) { lines.push(line); line = '' }
    line += it.str
    if (it.hasEOL) { lines.push(line); line = '' ; lastY = null; continue }
    if (y !== undefined) lastY = y
  }
  if (line.trim()) lines.push(line)
  return lines.join('\n')
}

/**
 * Read a PDF File → { pages, chunks, pageCount, emptyPages }.
 * onProgress(stage, done, total) is called as pages are read.
 */
export async function readPdf(file, onProgress = () => {}) {
  const pdfjs = await loadPdfjs()
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise
  const raw = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    raw.push({ number: i, text: itemsToText(tc.items) })
    onProgress('reading', i, doc.numPages)
  }
  await doc.destroy()
  onProgress('cleaning', 1, 1)
  const pages = cleanPages(raw)
  const chunks = chunkPages(pages)
  return { pages, chunks, pageCount: pages.length, emptyPages: pages.filter((p) => !p.text.trim()).map((p) => p.number) }
}
