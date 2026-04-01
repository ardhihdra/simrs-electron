import { DownloadOutlined } from '@ant-design/icons'
import { Button, Dropdown, MenuProps } from 'antd'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ---------------------------------------------------------------------------
// Public API types
// ---------------------------------------------------------------------------

/**
 * Definition of a single export column.
 *
 * @template TRow - Shape of a single data row.
 */
export interface ExportColumn<TRow extends Record<string, unknown> = Record<string, unknown>> {
  /** Header label shown in the exported file. */
  label: string
  /**
   * Dot-notation key path to extract a value from the row (e.g. `"patient.name"`).
   * Supports arbitrarily deep nesting.
   */
  key: string
  /**
   * Optional transform applied after extraction.
   * Return value is converted to string via `cellToString`.
   */
  render?: (value: unknown, row: TRow) => unknown
}

/**
 * Configuration for exporting child rows nested inside a parent row.
 *
 * In the exported output each parent row is followed immediately by
 * its child rows, making the full group visible without column collapse.
 *
 * @template TParent - Shape of the parent data row.
 * @template TChild  - Shape of each child data row.
 */
export interface NestedTableConfig<
  TParent extends Record<string, unknown> = Record<string, unknown>,
  TChild extends Record<string, unknown> = Record<string, unknown>
> {
  /**
   * Extracts the array of child rows from a parent row.
   * @example `(parent) => parent.tests as TestRow[]`
   */
  getChildren: (parent: TParent) => TChild[]
  /** Column definitions for the child rows. */
  columns: ExportColumn<TChild>[]
}

export interface ExportButtonProps<
  TRow extends Record<string, unknown> = Record<string, unknown>
> {
  /** Array of data rows to export. */
  data?: TRow[]
  /** Base filename without extension. Defaults to `"export"`. */
  fileName?: string
  /**
   * Document / sheet title rendered above the table in PDF and XLSX.
   * When omitted no title row is added.
   */
  title?: string
  /**
   * Column definitions controlling which parent fields appear and in what order.
   * Dot-notation keys enable transparent flattening of nested objects.
   */
  columns?: ExportColumn<TRow>[]
  /**
   * When provided, each parent row is followed in the output by its child rows.
   * Useful for grouped / master-detail data.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nestedTable?: NestedTableConfig<TRow, any>
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Resolve a dot-notation path against an object, e.g. `"a.b.c"`. */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current !== null && typeof current === 'object') {
      return (current as Record<string, unknown>)[segment]
    }
    return undefined
  }, obj)
}

/** Convert any value to a safe, printable string for export. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Resolves column definitions, falling back to the first row's top-level keys
 * when no explicit columns are configured.
 */
function resolveExportColumns<TRow extends Record<string, unknown>>(
  data: TRow[],
  columns?: ExportColumn<TRow>[]
): ExportColumn<TRow>[] {
  if (columns && columns.length > 0) return columns
  if (data.length === 0) return []
  return Object.keys(data[0]).map((key) => ({ key, label: key }))
}

/** Extract and transform a single row into an array of cell strings. */
function extractRowCells<TRow extends Record<string, unknown>>(
  row: TRow,
  columns: ExportColumn<TRow>[]
): string[] {
  return columns.map((col) => {
    const rawValue = resolvePath(row, col.key)
    const transformed = col.render ? col.render(rawValue, row) : rawValue
    return cellToString(transformed)
  })
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function buildFlatCsvLines<TRow extends Record<string, unknown>>(
  data: TRow[],
  columns: ExportColumn<TRow>[]
): string[] {
  return data.map((row) =>
    extractRowCells(row, columns)
      .map((cell) => `"${cell.replace(/"/g, '""')}"`)
      .join(',')
  )
}

function buildNestedCsvLines<
  TRow extends Record<string, unknown>,
  TChild extends Record<string, unknown>
>(
  data: TRow[],
  parentColumns: ExportColumn<TRow>[],
  nested: NestedTableConfig<TRow, TChild>
): string[] {
  const totalCols = parentColumns.length

  const padRow = (cells: string[]): string =>
    cells
      .concat(Array(Math.max(0, totalCols - cells.length)).fill('""'))
      .map((c) => (c.startsWith('"') ? c : `"${c.replace(/"/g, '""')}"`))
      .join(',')

  const lines: string[] = []

  for (const parentRow of data) {
    lines.push(
      extractRowCells(parentRow, parentColumns)
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(',')
    )

    const children = nested.getChildren(parentRow)
    if (children.length > 0) {
      lines.push(padRow(['', ...nested.columns.map((col) => col.label)]))
      for (const child of children) {
        lines.push(padRow(['', ...extractRowCells(child, nested.columns)]))
      }
    }

    lines.push('') // blank separator between parent groups
  }

  return lines
}

function exportToCsv<TRow extends Record<string, unknown>>(
  data: TRow[],
  fileName: string,
  columns: ExportColumn<TRow>[],
  title?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nestedTable?: NestedTableConfig<TRow, any>
): void {
  const titleLines = title ? [`"${title}"`, ''] : []
  const headerRow = columns.map((col) => `"${col.label}"`).join(',')
  const bodyLines = nestedTable
    ? buildNestedCsvLines(data, columns, nestedTable)
    : buildFlatCsvLines(data, columns)

  const csvContent = [...titleLines, headerRow, ...bodyLines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${fileName}.csv`)
}

// ---------------------------------------------------------------------------
// XLSX export
// ---------------------------------------------------------------------------

/**
 * Constructs a styled XLSX workbook.
 *
 * For nested data each parent row is rendered in a light-blue row followed
 * by its children in an indented sub-section (first column blank).
 * Column widths are auto-fitted to the longest content in each column.
 */
function exportToXlsx<TRow extends Record<string, unknown>>(
  data: TRow[],
  fileName: string,
  columns: ExportColumn<TRow>[],
  title?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nestedTable?: NestedTableConfig<TRow, any>
): void {
  const aoa: (string | undefined)[][] = [] // array-of-arrays fed to xlsx

  // Title row
  if (title) {
    aoa.push([title])
    aoa.push([]) // blank spacer
  }

  if (nestedTable) {
    // ---- Nested layout -------------------------------------------------------
    // Parent header
    aoa.push(columns.map((col) => col.label))

    for (const parentRow of data) {
      aoa.push(extractRowCells(parentRow, columns))

      const children = nestedTable.getChildren(parentRow)
      if (children.length > 0) {
        // Child sub-header (blank leading cell for visual indent)
        aoa.push(['', ...nestedTable.columns.map((col: ExportColumn) => col.label)])
        for (const child of children) {
          aoa.push(['', ...extractRowCells(child, nestedTable.columns)])
        }
      }

      aoa.push([]) // blank separator between groups
    }
  } else {
    // ---- Flat layout ---------------------------------------------------------
    aoa.push(columns.map((col) => col.label))
    for (const row of data) {
      aoa.push(extractRowCells(row, columns))
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)

  // Auto column widths: measure longest content in each column
  const colWidths = aoa.reduce<number[]>((widths, row) => {
    row.forEach((cell, colIndex) => {
      widths[colIndex] = Math.max(widths[colIndex] ?? 8, String(cell ?? '').length + 2)
    })
    return widths
  }, [])
  worksheet['!cols'] = colWidths.map((w) => ({ wch: Math.min(w, 50) }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

// ---------------------------------------------------------------------------
// PDF export
// ---------------------------------------------------------------------------

/** Brand colours */
const PDF_BRAND_BLUE: [number, number, number] = [22, 93, 255]
const PDF_ACCENT_BLUE: [number, number, number] = [79, 134, 247]
const PDF_PARENT_ROW_BG: [number, number, number] = [239, 246, 255]
const PDF_TITLE_COLOR: [number, number, number] = [30, 41, 59]

function addFlatTable<TRow extends Record<string, unknown>>(
  doc: jsPDF,
  data: TRow[],
  columns: ExportColumn<TRow>[],
  title?: string
): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  if (title) {
    doc.setFontSize(14)
    doc.setTextColor(...PDF_TITLE_COLOR)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, 20)
    doc.setFont('helvetica', 'normal')
  }

  autoTable(doc, {
    startY: title ? 26 : undefined,
    head: [columns.map((col) => col.label)],
    body: data.map((row) => extractRowCells(row, columns)),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: PDF_BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableWidth: pageWidth - margin * 2,
    margin: { left: margin, right: margin }
  })
}

function addNestedTable<
  TRow extends Record<string, unknown>,
  TChild extends Record<string, unknown>
>(
  doc: jsPDF,
  data: TRow[],
  parentColumns: ExportColumn<TRow>[],
  nested: NestedTableConfig<TRow, TChild>,
  title?: string
): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const childIndent = 18

  if (title) {
    doc.setFontSize(14)
    doc.setTextColor(...PDF_TITLE_COLOR)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, 20)
    doc.setFont('helvetica', 'normal')
  }

  let currentY = title ? 28 : 14

  for (const parentRow of data) {
    // Parent row — full-width table, single data row styled as a section header
    autoTable(doc, {
      startY: currentY,
      head: [parentColumns.map((col) => col.label)],
      body: [extractRowCells(parentRow, parentColumns)],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: PDF_BRAND_BLUE, textColor: 255, fontStyle: 'bold' },
      bodyStyles: { fontStyle: 'bold', fillColor: PDF_PARENT_ROW_BG, textColor: PDF_TITLE_COLOR },
      tableWidth: pageWidth - margin * 2,
      margin: { left: margin, right: margin }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 1

    const children = nested.getChildren(parentRow)
    if (children.length > 0) {
      const childBodyRows = children.map((child) => extractRowCells(child, nested.columns))

      // Child table — full width minus the indent, flush below the parent
      autoTable(doc, {
        startY: currentY,
        head: [nested.columns.map((col) => col.label)],
        body: childBodyRows,
        styles: { fontSize: 7.5, cellPadding: 2.5 },
        headStyles: { fillColor: PDF_ACCENT_BLUE, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        tableWidth: pageWidth - margin * 2 - childIndent,
        margin: { left: margin + childIndent, right: margin }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 6 // gap after each group
    } else {
      currentY += 6
    }
  }
}

function exportToPdf<TRow extends Record<string, unknown>>(
  data: TRow[],
  fileName: string,
  columns: ExportColumn<TRow>[],
  title?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nestedTable?: NestedTableConfig<TRow, any>
): void {
  const doc = new jsPDF({ orientation: 'landscape' })

  if (nestedTable) {
    addNestedTable(doc, data, columns, nestedTable, title)
  } else {
    addFlatTable(doc, data, columns, title)
  }

  doc.save(`${fileName}.pdf`)
}

// ---------------------------------------------------------------------------
// Shared download utility
// ---------------------------------------------------------------------------

/** Creates a temporary `<a>` element to trigger a file download. */
function triggerDownload(blob: Blob, downloadFileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = downloadFileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExportButton = <TRow extends Record<string, unknown> = Record<string, unknown>>({
  data = [] as unknown as TRow[],
  fileName = 'export',
  title,
  columns,
  nestedTable
}: ExportButtonProps<TRow>) => {
  const resolvedColumns = resolveExportColumns(data, columns)

  const handleCsvExport = () => exportToCsv(data, fileName, resolvedColumns, title, nestedTable)
  const handleXlsxExport = () => exportToXlsx(data, fileName, resolvedColumns, title, nestedTable)
  const handlePdfExport = () => exportToPdf(data, fileName, resolvedColumns, title, nestedTable)

  const menuItems: MenuProps['items'] = [
    {
      key: 'xlsx',
      label: 'Export as Excel (XLSX)',
      onClick: handleXlsxExport
    },
    {
      key: 'csv',
      label: 'Export as CSV',
      onClick: handleCsvExport
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      onClick: handlePdfExport
    }
  ]

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
      <Button type="primary" icon={<DownloadOutlined />}>
        Export
      </Button>
    </Dropdown>
  )
}