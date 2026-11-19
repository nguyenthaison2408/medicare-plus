/**
 * Standard Word (.docx) Documentation Generator
 * Software Project Management (QLDA) - VKU
 * MediCare Plus Project - Team 04
 * Font: Times New Roman | Formal Academic & Industrial Report Standards
 */

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  PageNumber,
  Header,
  Footer,
  PageOrientation
} = require('docx');

// --- Standard Formatting Constants ---
const FONT_PRIMARY = 'Times New Roman';
const FONT_CODE = 'Consolas';

const COLOR_NAVY = '1F4E79';
const COLOR_SLATE_BLUE = '2E5B82';
const COLOR_DARK = '111827';
const COLOR_MUTED = '4B5563';
const COLOR_LIGHT_BORDER = 'CBD5E1';
const COLOR_HEADER_BG = '1F4E79';
const COLOR_ROW_ALT = 'F8FAFC';
const COLOR_CALLOUT_BG = 'F0F7FF';
const COLOR_CODE_BG = 'F8FAFC';

// A4 in twips (1 inch = 1440 twips, 1 cm = 567 twips)
// Portrait: width 11906, height 16838
// Margins: Left 3cm (1701), Right 2cm (1134), Top 2cm (1134), Bottom 2cm (1134)
const MARGIN_PORTRAIT = {
  top: 1134,
  bottom: 1134,
  left: 1701,
  right: 1134,
  header: 720,
  footer: 720
};

// Landscape for wide tables (Risk Register)
const MARGIN_LANDSCAPE = {
  top: 1134,
  bottom: 1134,
  left: 1134,
  right: 1134,
  header: 720,
  footer: 720
};

/**
 * Clean up LaTeX math formulas into readable unicode text
 */
function cleanLatex(text) {
  if (!text) return '';
  return text
    .replace(/\\le\b/g, '≤')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\pm\b/g, '±')
    .replace(/\\times\b/g, '×')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\\quad/g, ' ')
    .replace(/\\,/g, ' ');
}

/**
 * Parse an inline string into an array of docx TextRun objects
 */
function parseInlineRuns(text, options = {}) {
  const defaultSize = options.size || 26; // 13pt
  const defaultColor = options.color || COLOR_DARK;
  const defaultItalics = options.italics || false;
  const defaultBold = options.bold || false;

  if (!text) return [];

  // Normalize LaTeX first
  let cleaned = cleanLatex(text);

  // Replace checkmarks
  cleaned = cleaned.replace(/\[x\]/gi, '☑ ').replace(/\[ \]/g, '☐ ');

  // Tokenize string for bold, italic, code, links
  // Regex matches:
  // 1: ***bolditalic***
  // 2: **bold**
  // 3: *italic*
  // 4: `code`
  // 5: [text](url)
  // 6: ~~strike~~
  const regex = /(\*\*\*([^*]+)\*\*\*)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(~~([^~]+)~~)/g;

  const runs = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    // Add text preceding match
    if (match.index > lastIndex) {
      const prevText = cleaned.substring(lastIndex, match.index);
      runs.push(new TextRun({
        text: prevText,
        font: FONT_PRIMARY,
        size: defaultSize,
        color: defaultColor,
        bold: defaultBold,
        italics: defaultItalics
      }));
    }

    if (match[1]) {
      // ***bolditalic***
      runs.push(new TextRun({
        text: match[2],
        font: FONT_PRIMARY,
        size: defaultSize,
        color: defaultColor,
        bold: true,
        italics: true
      }));
    } else if (match[3]) {
      // **bold**
      runs.push(new TextRun({
        text: match[4],
        font: FONT_PRIMARY,
        size: defaultSize,
        color: options.boldColor || defaultColor,
        bold: true,
        italics: defaultItalics
      }));
    } else if (match[5]) {
      // *italic*
      runs.push(new TextRun({
        text: match[6],
        font: FONT_PRIMARY,
        size: defaultSize,
        color: defaultColor,
        bold: defaultBold,
        italics: true
      }));
    } else if (match[7]) {
      // `code`
      runs.push(new TextRun({
        text: match[8],
        font: FONT_CODE,
        size: Math.max(defaultSize - 4, 18),
        color: 'B91C1C',
        shading: { fill: 'F1F5F9' }
      }));
    } else if (match[9]) {
      // [text](url)
      runs.push(new TextRun({
        text: match[10],
        font: FONT_PRIMARY,
        size: defaultSize,
        color: COLOR_NAVY,
        underline: {}
      }));
    } else if (match[12]) {
      // ~~strike~~
      runs.push(new TextRun({
        text: match[13],
        font: FONT_PRIMARY,
        size: defaultSize,
        color: COLOR_MUTED,
        strike: true
      }));
    }

    lastIndex = regex.lastIndex;
  }

  // Add trailing text
  if (lastIndex < cleaned.length) {
    const remaining = cleaned.substring(lastIndex);
    runs.push(new TextRun({
      text: remaining,
      font: FONT_PRIMARY,
      size: defaultSize,
      color: defaultColor,
      bold: defaultBold,
      italics: defaultItalics
    }));
  }

  return runs.length > 0 ? runs : [new TextRun({
    text: '',
    font: FONT_PRIMARY,
    size: defaultSize
  })];
}

/**
 * Parse Markdown lines into structured blocks
 */
function parseMarkdownBlocks(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Empty line
    if (!line) {
      i++;
      continue;
    }

    // Code block ```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', lang, lines: codeLines });
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Headings #
    if (line.startsWith('#')) {
      let level = 0;
      while (level < line.length && line[level] === '#') level++;
      const text = line.slice(level).trim();
      blocks.push({ type: 'heading', level: Math.min(level, 4), text });
      i++;
      continue;
    }

    // Blockquote >
    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    // Table row |
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Parse header, divider, and rows
        const parseRow = (rowStr) => {
          return rowStr
            .slice(1, -1)
            .split('|')
            .map(c => c.trim());
        };

        const headers = parseRow(tableLines[0]);
        const divider = parseRow(tableLines[1]);
        const rows = [];

        for (let r = 2; r < tableLines.length; r++) {
          rows.push(parseRow(tableLines[r]));
        }

        const aligns = divider.map(d => {
          if (d.startsWith(':') && d.endsWith(':')) return AlignmentType.CENTER;
          if (d.endsWith(':')) return AlignmentType.RIGHT;
          return AlignmentType.LEFT;
        });

        blocks.push({ type: 'table', headers, aligns, rows });
        continue;
      }
    }

    // Bullet List
    if (/^[\*\-\+]\s+/.test(line)) {
      const match = line.match(/^(\s*)[\*\-\+]\s+(.*)$/);
      const indent = match ? Math.floor(match[1].length / 2) : 0;
      const text = match ? match[2] : line.replace(/^[\*\-\+]\s+/, '');
      blocks.push({ type: 'bullet', level: indent, text });
      i++;
      continue;
    }

    // Numbered List
    if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^(\d+)\.\s+(.*)$/);
      blocks.push({ type: 'numbered', num: match[1], text: match[2] });
      i++;
      continue;
    }

    // Regular Paragraph: collect consecutive lines
    const pLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('---') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !/^[\*\-\+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }

    blocks.push({ type: 'paragraph', text: pLines.join(' ') });
  }

  return blocks;
}

/**
 * Build docx elements from parsed Markdown blocks
 */
function buildDocxElements(blocks, isLandscape = false) {
  const elements = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading': {
        const text = block.text;
        let headingLevel = HeadingLevel.HEADING_1;
        let size = 32; // 16pt
        let color = COLOR_NAVY;
        let spaceBefore = 280;
        let spaceAfter = 120;

        if (block.level === 2) {
          headingLevel = HeadingLevel.HEADING_2;
          size = 28; // 14pt
          color = COLOR_SLATE_BLUE;
          spaceBefore = 220;
          spaceAfter = 80;
        } else if (block.level === 3) {
          headingLevel = HeadingLevel.HEADING_3;
          size = 26; // 13pt
          color = COLOR_DARK;
          spaceBefore = 160;
          spaceAfter = 60;
        } else if (block.level >= 4) {
          headingLevel = HeadingLevel.HEADING_4;
          size = 25; // 12.5pt
          color = COLOR_MUTED;
          spaceBefore = 120;
          spaceAfter = 40;
        }

        elements.push(new Paragraph({
          heading: headingLevel,
          spacing: { before: spaceBefore, after: spaceAfter, line: 300, lineRule: 'auto' },
          children: parseInlineRuns(text, { size, color, bold: true })
        }));
        break;
      }

      case 'paragraph': {
        elements.push(new Paragraph({
          spacing: { before: 0, after: 120, line: 300, lineRule: 'auto' },
          children: parseInlineRuns(block.text, { size: 26, color: COLOR_DARK })
        }));
        break;
      }

      case 'bullet': {
        elements.push(new Paragraph({
          bullet: { level: block.level || 0 },
          spacing: { before: 20, after: 60, line: 280, lineRule: 'auto' },
          children: parseInlineRuns(block.text, { size: 25, color: COLOR_DARK })
        }));
        break;
      }

      case 'numbered': {
        const runs = [
          new TextRun({
            text: `${block.num}.  `,
            font: FONT_PRIMARY,
            bold: true,
            size: 25,
            color: COLOR_NAVY
          }),
          ...parseInlineRuns(block.text, { size: 25, color: COLOR_DARK })
        ];

        elements.push(new Paragraph({
          indent: { left: 450, hanging: 350 },
          spacing: { before: 20, after: 60, line: 280, lineRule: 'auto' },
          children: runs
        }));
        break;
      }

      case 'blockquote': {
        let content = block.text;
        let calloutTitle = '';
        let calloutColor = COLOR_NAVY;
        let calloutBg = COLOR_CALLOUT_BG;

        if (content.includes('[!IMPORTANT]')) {
          content = content.replace(/\[!IMPORTANT\]\s*/g, '');
          calloutTitle = '⚠️ LƯU Ý QUAN TRỌNG: ';
          calloutColor = 'B91C1C';
          calloutBg = 'FEF2F2';
        } else if (content.includes('[!WARNING]')) {
          content = content.replace(/\[!WARNING\]\s*/g, '');
          calloutTitle = '⚠️ CẢNH BÁO: ';
          calloutColor = 'D97706';
          calloutBg = 'FFFBEB';
        } else if (content.includes('[!NOTE]')) {
          content = content.replace(/\[!NOTE\]\s*/g, '');
          calloutTitle = 'ℹ️ GHI CHÚ: ';
          calloutColor = COLOR_NAVY;
          calloutBg = 'F0F7FF';
        }

        const lines = content.split('\n').filter(l => l.trim().length > 0);
        lines.forEach((lineText, idx) => {
          const runs = [];
          if (idx === 0 && calloutTitle) {
            runs.push(new TextRun({
              text: calloutTitle,
              font: FONT_PRIMARY,
              bold: true,
              size: 24,
              color: calloutColor
            }));
          }
          runs.push(...parseInlineRuns(lineText, { size: 24, color: COLOR_DARK, italics: true }));

          elements.push(new Paragraph({
            indent: { left: 400, right: 300 },
            spacing: { before: idx === 0 ? 80 : 20, after: idx === lines.length - 1 ? 100 : 20, line: 280, lineRule: 'auto' },
            shading: { fill: calloutBg },
            border: {
              left: { style: BorderStyle.SINGLE, size: 24, color: calloutColor }
            },
            children: runs
          }));
        });
        break;
      }

      case 'code': {
        for (const line of block.lines) {
          elements.push(new Paragraph({
            indent: { left: 300, right: 300 },
            spacing: { before: 0, after: 10, line: 240, lineRule: 'auto' },
            shading: { fill: COLOR_CODE_BG },
            border: {
              left: { style: BorderStyle.SINGLE, size: 12, color: '93C5FD' }
            },
            children: [
              new TextRun({
                text: line || ' ',
                font: FONT_CODE,
                size: 19, // ~9.5pt
                color: '1E293B'
              })
            ]
          }));
        }
        // Spacer after code block
        elements.push(new Paragraph({ spacing: { before: 0, after: 80 }, children: [] }));
        break;
      }

      case 'table': {
        const numCols = block.headers.length;
        if (numCols === 0) break;

        // Calculate cell widths based on column count and landscape mode
        const totalPageWidthTwips = isLandscape ? 14500 : 9070;
        const cellWidth = Math.floor(totalPageWidthTwips / numCols);

        // Header Row
        const headerCells = block.headers.map((hText, colIdx) => {
          const align = block.aligns[colIdx] || AlignmentType.LEFT;
          return new TableCell({
            width: { size: cellWidth, type: WidthType.DXA },
            shading: { fill: COLOR_HEADER_BG },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_NAVY },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_NAVY },
              left: { style: BorderStyle.SINGLE, size: 4, color: '93C5FD' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '93C5FD' }
            },
            children: [
              new Paragraph({
                alignment: align,
                spacing: { before: 0, after: 0, line: 260, lineRule: 'auto' },
                children: parseInlineRuns(hText, {
                  size: isLandscape ? 20 : 22,
                  color: 'FFFFFF',
                  bold: true,
                  boldColor: 'FFFFFF'
                })
              })
            ]
          });
        });

        const tableRows = [new TableRow({ children: headerCells, tableHeader: true })];

        // Data Rows
        block.rows.forEach((row, rowIdx) => {
          const rowBg = rowIdx % 2 === 1 ? COLOR_ROW_ALT : 'FFFFFF';
          const cells = row.map((cellText, colIdx) => {
            const align = block.aligns[colIdx] || AlignmentType.LEFT;
            // Split multiline within cell if contains <br> or \n
            const subLines = cellText.split(/<br\s*\/?>/i);
            const pList = subLines.map(subLine => {
              return new Paragraph({
                alignment: align,
                spacing: { before: 20, after: 20, line: 260, lineRule: 'auto' },
                children: parseInlineRuns(subLine.trim(), {
                  size: isLandscape ? 19 : 21,
                  color: COLOR_DARK
                })
              });
            });

            return new TableCell({
              width: { size: cellWidth, type: WidthType.DXA },
              shading: { fill: rowBg },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER },
                left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER },
                right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER }
              },
              children: pList.length > 0 ? pList : [new Paragraph({ children: [] })]
            });
          });

          // Fill missing cells if any
          while (cells.length < numCols) {
            cells.push(new TableCell({
              width: { size: cellWidth, type: WidthType.DXA },
              shading: { fill: rowBg },
              margins: { top: 90, bottom: 90, left: 120, right: 120 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER },
                left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER },
                right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER }
              },
              children: [new Paragraph({ children: [] })]
            }));
          }

          tableRows.push(new TableRow({ children: cells }));
        });

        elements.push(new Table({
          width: { size: totalPageWidthTwips, type: WidthType.DXA },
          rows: tableRows
        }));

        // Spacer after table
        elements.push(new Paragraph({ spacing: { before: 0, after: 140 }, children: [] }));
        break;
      }

      case 'hr': {
        elements.push(new Paragraph({
          spacing: { before: 80, after: 80 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_SLATE_BLUE }
          },
          children: []
        }));
        break;
      }
    }
  }

  return elements;
}

/**
 * Generate standard VKU Formal Academic Cover Page for Final Report
 */
function createFinalReportCoverPage() {
  return [
    // Header Institution
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO — ĐẠI HỌC ĐÀ NẴNG',
          font: FONT_PRIMARY,
          size: 24,
          bold: true,
          color: COLOR_NAVY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT - HÀN',
          font: FONT_PRIMARY,
          size: 26,
          bold: true,
          color: COLOR_NAVY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: 'KHOA KHOA HỌC MÁY TÍNH',
          font: FONT_PRIMARY,
          size: 24,
          bold: true,
          color: COLOR_SLATE_BLUE
        })
      ]
    }),

    // Horizontal divider
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      border: {
        bottom: { style: BorderStyle.DOUBLE, size: 18, color: COLOR_NAVY }
      },
      children: []
    }),

    // Document Title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: 'BÁO CÁO TỔNG KẾT KỸ THUẬT',
          font: FONT_PRIMARY,
          size: 40, // 20pt
          bold: true,
          color: COLOR_NAVY
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: 'HỌC PHẦN: QUẢN TRỊ DỰ ÁN PHẦN MỀM (SPM)',
          font: FONT_PRIMARY,
          size: 28, // 14pt
          bold: true,
          color: COLOR_SLATE_BLUE
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 300 },
      children: [
        new TextRun({
          text: 'FINAL TECHNICAL AUDIT REPORT — 15 WEEKS EXECUTION',
          font: FONT_PRIMARY,
          size: 22,
          italics: true,
          color: COLOR_MUTED
        })
      ]
    }),

    // Project Name Box
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({
          text: 'ĐỀ TÀI DỰ ÁN THỰC TẾ:',
          font: FONT_PRIMARY,
          size: 24,
          bold: true,
          color: COLOR_DARK
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 600 },
      children: [
        new TextRun({
          text: 'NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN\n(MEDICARE PLUS)',
          font: FONT_PRIMARY,
          size: 32, // 16pt
          bold: true,
          color: COLOR_NAVY
        })
      ]
    }),

    // Details Table / Info Block
    new Paragraph({
      spacing: { before: 100, after: 40 },
      children: [
        new TextRun({
          text: 'GIẢNG VIÊN HƯỚNG DẪN & PHỤ TRÁCH:',
          font: FONT_PRIMARY,
          size: 24,
          bold: true,
          color: COLOR_NAVY
        })
      ]
    }),
    new Paragraph({
      indent: { left: 400 },
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: '• Giảng viên phụ trách học phần: ', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: 'TS. Nguyễn Thanh Tuấn', font: FONT_PRIMARY, size: 24 })
      ]
    }),
    new Paragraph({
      indent: { left: 400 },
      spacing: { before: 20, after: 120 },
      children: [
        new TextRun({ text: '• Giảng viên đồ án chuyên ngành song hành: ', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: 'ThS. Lê Đăng Quang', font: FONT_PRIMARY, size: 24 })
      ]
    }),

    new Paragraph({
      spacing: { before: 100, after: 40 },
      children: [
        new TextRun({
          text: 'SINH VIÊN THỰC HIỆN (NHÓM 04 — LỚP 23IT):',
          font: FONT_PRIMARY,
          size: 24,
          bold: true,
          color: COLOR_NAVY
        })
      ]
    }),
    new Paragraph({
      indent: { left: 400 },
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: '1. Nguyễn Thái Sơn   ', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: '— MSV: ', font: FONT_PRIMARY, size: 24 }),
        new TextRun({ text: '23IT.EB086', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: ' (Project Lead / Scrum Master — Đóng góp 40%)', font: FONT_PRIMARY, size: 23, color: COLOR_MUTED })
      ]
    }),
    new Paragraph({
      indent: { left: 400 },
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: '2. Vi Hữu Thành       ', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: '— MSV: ', font: FONT_PRIMARY, size: 24 }),
        new TextRun({ text: '23IT.EB096', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: ' (Technical Lead / System Architect — Đóng góp 20%)', font: FONT_PRIMARY, size: 23, color: COLOR_MUTED })
      ]
    }),
    new Paragraph({
      indent: { left: 400 },
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: '3. Đặng Thanh Vũ     ', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: '— MSV: ', font: FONT_PRIMARY, size: 24 }),
        new TextRun({ text: '23IT.EB120', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: ' (Backend Engineer — Đóng góp 20%)', font: FONT_PRIMARY, size: 23, color: COLOR_MUTED })
      ]
    }),
    new Paragraph({
      indent: { left: 400 },
      spacing: { before: 20, after: 120 },
      children: [
        new TextRun({ text: '4. Nguyễn Từ Anh Nguyên ', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: '— MSV: ', font: FONT_PRIMARY, size: 24 }),
        new TextRun({ text: '23IT.EB064', font: FONT_PRIMARY, bold: true, size: 24 }),
        new TextRun({ text: ' (Frontend / QA Engineer — Đóng góp 20%)', font: FONT_PRIMARY, size: 23, color: COLOR_MUTED })
      ]
    }),

    // Footer Location & Date
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 40 },
      children: [
        new TextRun({
          text: 'ĐÀ NẴNG, THÁNG 12 NĂM 2026',
          font: FONT_PRIMARY,
          size: 24,
          bold: true,
          color: COLOR_NAVY
        })
      ]
    }),

    // Page Break after cover
    new Paragraph({
      pageBreakBefore: true,
      children: []
    })
  ];
}

/**
 * Standard Header & Footer builder
 */
function createDocumentHeaderFooter(docTitle) {
  return {
    header: new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER }
          },
          spacing: { before: 0, after: 60 },
          children: [
            new TextRun({
              text: `VKU • QUẢN TRỊ DỰ ÁN PHẦN MỀM | ${docTitle.toUpperCase()}`,
              font: FONT_PRIMARY,
              size: 18, // 9pt
              italics: true,
              color: COLOR_MUTED
            })
          ]
        })
      ]
    }),
    footer: new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_LIGHT_BORDER }
          },
          spacing: { before: 60, after: 0 },
          children: [
            new TextRun({
              text: 'Dự án MediCare Plus (Nhóm 04)                        Trang ',
              font: FONT_PRIMARY,
              size: 19,
              color: COLOR_MUTED
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              font: FONT_PRIMARY,
              size: 19,
              bold: true,
              color: COLOR_NAVY
            }),
            new TextRun({
              text: ' / ',
              font: FONT_PRIMARY,
              size: 19,
              color: COLOR_MUTED
            }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              font: FONT_PRIMARY,
              size: 19,
              color: COLOR_MUTED
            })
          ]
        })
      ]
    })
  };
}

/**
 * Main conversion function for a single Markdown file
 */
async function convertFile(inputMdPath, outputDocxPath, options = {}) {
  console.log(`\n========================================`);
  console.log(`Processing: ${path.basename(inputMdPath)} -> ${path.basename(outputDocxPath)}`);

  const mdContent = fs.readFileSync(inputMdPath, 'utf8');
  const blocks = parseMarkdownBlocks(mdContent);

  const isLandscape = options.isLandscape || false;
  const isFinalReport = options.isFinalReport || false;
  const docTitle = options.title || path.basename(inputMdPath, '.md').replace(/^\d+_/, '').replace(/_/g, ' ');

  const { header, footer } = createDocumentHeaderFooter(docTitle);

  let bodyElements = [];

  // Add cover page if Final Technical Report
  if (isFinalReport) {
    bodyElements.push(...createFinalReportCoverPage());
  }

  // Add main parsed elements
  bodyElements.push(...buildDocxElements(blocks, isLandscape));

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_PRIMARY,
            size: 26,
            color: COLOR_DARK
          },
          paragraph: {
            spacing: { line: 300, lineRule: 'auto', after: 120 }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              width: isLandscape ? 16838 : 11906,
              height: isLandscape ? 11906 : 16838
            },
            margin: isLandscape ? MARGIN_LANDSCAPE : MARGIN_PORTRAIT
          }
        },
        headers: {
          default: header
        },
        footers: {
          default: footer
        },
        children: bodyElements
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputDocxPath, buffer);
  console.log(`✓ Generated: ${outputDocxPath} (${Math.round(buffer.length / 1024)} KB)`);
}

/**
 * Execute batch conversion
 */
async function run() {
  const docsDir = path.join('D:', 'Quản lý dự án phần mềm', 'docs');

  const filesToConvert = [
    {
      md: '01_Final_Technical_Report.md',
      docx: '01_Final_Technical_Report.docx',
      options: { isFinalReport: true, title: 'Báo Cáo Tổng Kết Kỹ Thuật' }
    },
    {
      md: '02_Project_Charter_Signed.md',
      docx: '02_Project_Charter_Signed.docx',
      options: { title: 'Điều Lệ Dự Án (Project Charter)' }
    },
    {
      md: '03_WBS_and_WBS_Dictionary.md',
      docx: '03_WBS_and_WBS_Dictionary.docx',
      options: { title: 'Cơ Cấu Phân Rã & Từ Điển WBS' }
    },
    {
      md: '04_Risk_Register_Evolution.md',
      docx: '04_Risk_Register_Evolution.docx',
      options: { isLandscape: true, title: 'Bảng Theo Dõi Rủi Ro (Risk Register)' }
    },
    {
      md: '05_Sprint_Retrospectives.md',
      docx: '05_Sprint_Retrospectives.docx',
      options: { title: 'Biên Bản Họp Cải Tiến (Sprint Retrospectives)' }
    },
    {
      md: '06_Scope_Change_Control_Record.md',
      docx: '06_Scope_Change_Control_Record.docx',
      options: { title: 'Hồ Sơ Quản Lý Thay Đổi (Change Control)' }
    },
    {
      md: '08_Presentation_Slide_Deck.md',
      docx: '08_Presentation_Slide_Deck.docx',
      options: { title: 'Kịch Bản Bảo Vệ & Slide Deck' }
    },
    {
      md: '00_Project_Overview_and_Links.md',
      docx: '00_Project_Overview_and_Links.docx',
      options: { title: 'Tổng Quan Dự Án & Danh Mục Link' }
    }
  ];

  console.log(`Starting conversion of ${filesToConvert.length} documents into Microsoft Word (.docx)...`);
  console.log(`Font standard: ${FONT_PRIMARY}`);

  for (const item of filesToConvert) {
    const inputPath = path.join(docsDir, item.md);
    const outputPath = path.join(docsDir, item.docx);

    if (fs.existsSync(inputPath)) {
      await convertFile(inputPath, outputPath, item.options);
    } else {
      console.warn(`File not found: ${inputPath}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`All Word documents generated successfully!`);
}

if (require.main === module) {
run().catch(err => {
  console.error('Error during conversion:', err);
  process.exit(1);
});

}
module.exports = { convertFile };
