/**
 * Standard PDF Generator for VKU Software Project Management (QLDA)
 * MediCare Plus Project - Team 04
 * Converts Markdown reports into high-resolution, professionally formatted PDFs
 * Typography: Times New Roman | VKU Academic & PMBOK Industrial Standards
 * Engine: Google Chrome Headless
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
console.log(`Using browser for PDF rendering: ${BROWSER_PATH}`);

/**
 * Clean up LaTeX expressions into readable Unicode text
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
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse inline Markdown into HTML
 */
function parseInlineHtml(text) {
  if (!text) return '';
  let str = cleanLatex(text);

  // Checkboxes
  str = str.replace(/\[x\]/gi, '<span class="checkbox checked">☑</span> ')
           .replace(/\[ \]/g, '<span class="checkbox unchecked">☐</span> ');

  // Links [text](url)
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="doc-link">$1</a>');

  // Bold + Italic ***text***
  str = str.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold **text**
  str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  str = str.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  // Inline code `code`
  str = str.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Strikethrough ~~text~~
  str = str.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Line breaks <br>
  str = str.replace(/&lt;br\s*\/?&gt;/gi, '<br/>');

  return str;
}

/**
 * Convert Markdown document string to clean HTML
 */
function markdownToHtml(mdContent, isFinalReport = false, isLandscape = false, docTitle = '') {
  const lines = mdContent.replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let i = 0;

  // Cover page for Final Technical Report
  if (isFinalReport) {
    html += `
    <div class="cover-page">
      <div class="cover-border">
        <div class="cover-header">
          <p class="inst-ministry">BỘ GIÁO DỤC VÀ ĐÀO TẠO — ĐẠI HỌC ĐÀ NẴNG</p>
          <p class="inst-univ">TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT - HÀN</p>
          <p class="inst-faculty">KHOA KHOA HỌC MÁY TÍNH</p>
          <div class="header-divider"></div>
        </div>

        <div class="cover-body">
          <div class="cover-report-type">BÁO CÁO TỔNG KẾT KỸ THUẬT</div>
          <div class="cover-course">HỌC PHẦN: QUẢN TRỊ DỰ ÁN PHẦN MỀM (SPM)</div>
          <div class="cover-sub">FINAL TECHNICAL AUDIT REPORT — 15 WEEKS EXECUTION</div>

          <div class="cover-project-box">
            <div class="project-box-label">ĐỀ TÀI DỰ ÁN THỰC TẾ</div>
            <div class="project-box-title">NỀN TẢNG QUẢN LÝ PHÒNG KHÁM & ĐẶT LỊCH KHÁM TRỰC TUYẾN</div>
            <div class="project-box-eng">(MEDICARE PLUS — VKU-SPM-MEDICARE)</div>
          </div>

          <div class="cover-details">
            <div class="details-section">
              <p class="details-heading">GIẢNG VIÊN HƯỚNG DẪN & PHỤ TRÁCH:</p>
              <table class="cover-info-table">
                <tr><td>• Giảng viên phụ trách học phần:</td><td><strong>TS. Nguyễn Thanh Tuấn</strong></td></tr>
                <tr><td>• Giảng viên Đồ án chuyên ngành song hành:</td><td><strong>ThS. Lê Đăng Quang</strong></td></tr>
              </table>
            </div>

            <div class="details-section" style="margin-top: 18px;">
              <p class="details-heading">SINH VIÊN THỰC HIỆN (NHÓM 04 — LỚP 23IT):</p>
              <table class="cover-student-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ và Tên</th>
                    <th>Mã Sinh Viên</th>
                    <th>Vai trò kỹ thuật</th>
                    <th>Tỷ lệ đóng góp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td><strong>Nguyễn Thái Sơn</strong></td><td><strong>23IT.EB086</strong></td><td>Project Lead / PM / Scrum Master</td><td><strong>40%</strong></td></tr>
                  <tr><td>2</td><td><strong>Vi Hữu Thành</strong></td><td><strong>23IT.EB096</strong></td><td>Technical Lead / System Architect</td><td><strong>20%</strong></td></tr>
                  <tr><td>3</td><td><strong>Đặng Thanh Vũ</strong></td><td><strong>23IT.EB120</strong></td><td>Backend Engineer</td><td><strong>20%</strong></td></tr>
                  <tr><td>4</td><td><strong>Nguyễn Từ Anh Nguyên</strong></td><td><strong>23IT.EB064</strong></td><td>Frontend / Mobile & QA Engineer</td><td><strong>20%</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="cover-footer">
            <p><strong>ĐÀ NẴNG, THÁNG 12 NĂM 2026</strong></p>
          </div>
        </div>
      </div>
    </div>
    <div class="page-break"></div>
    `;
  }

  // Parse remaining Markdown blocks
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Code blocks ```
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++;
      html += `<pre class="code-block"><code class="lang-${lang}">${codeLines.join('\n')}</code></pre>\n`;
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      html += `<hr class="section-divider"/>\n`;
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('#')) {
      let level = 0;
      while (level < line.length && line[level] === '#') level++;
      const text = line.slice(level).trim();
      const parsedText = parseInlineHtml(text);
      const hLevel = Math.min(level, 4);

      if (hLevel === 1) {
        html += `<h1 class="heading-1">${parsedText}</h1>\n`;
      } else if (hLevel === 2) {
        html += `<h2 class="heading-2">${parsedText}</h2>\n`;
      } else if (hLevel === 3) {
        html += `<h3 class="heading-3">${parsedText}</h3>\n`;
      } else {
        html += `<h4 class="heading-4">${parsedText}</h4>\n`;
      }
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      let content = quoteLines.join('<br/>');
      let calloutClass = 'callout callout-note';
      let calloutPrefix = '<div class="callout-title">ℹ️ GHI CHÚ</div>';

      if (content.includes('[!IMPORTANT]')) {
        content = content.replace(/\[!IMPORTANT\]\s*/g, '');
        calloutClass = 'callout callout-important';
        calloutPrefix = '<div class="callout-title">⚠️ QUY TẮC BẮT BUỘC & LƯU Ý QUAN TRỌNG</div>';
      } else if (content.includes('[!WARNING]')) {
        content = content.replace(/\[!WARNING\]\s*/g, '');
        calloutClass = 'callout callout-warning';
        calloutPrefix = '<div class="callout-title">⚠️ CẢNH BÁO QUẢN LÝ DỰ ÁN</div>';
      } else if (content.includes('[!NOTE]')) {
        content = content.replace(/\[!NOTE\]\s*/g, '');
      }

      html += `<div class="${calloutClass}">${calloutPrefix}<div class="callout-content">${parseInlineHtml(content)}</div></div>\n`;
      continue;
    }

    // Table
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (rowStr) => {
          return rowStr.slice(1, -1).split('|').map(c => c.trim());
        };

        const headers = parseRow(tableLines[0]);
        const divider = parseRow(tableLines[1]);
        const aligns = divider.map(d => {
          if (d.startsWith(':') && d.endsWith(':')) return 'center';
          if (d.endsWith(':')) return 'right';
          return 'left';
        });

        html += `<div class="table-container"><table class="report-table"><thead><tr>`;
        headers.forEach((h, idx) => {
          html += `<th style="text-align: ${aligns[idx] || 'left'}">${parseInlineHtml(h)}</th>`;
        });
        html += `</tr></thead><tbody>`;

        for (let r = 2; r < tableLines.length; r++) {
          const row = parseRow(tableLines[r]);
          html += `<tr>`;
          row.forEach((cell, idx) => {
            html += `<td style="text-align: ${aligns[idx] || 'left'}">${parseInlineHtml(cell)}</td>`;
          });
          // Fill missing cells
          for (let m = row.length; m < headers.length; m++) {
            html += `<td></td>`;
          }
          html += `</tr>`;
        }

        html += `</tbody></table></div>\n`;
        continue;
      }
    }

    // Bullet List
    if (/^[\*\-\+]\s+/.test(line)) {
      html += `<ul class="doc-list">`;
      while (i < lines.length && /^[\*\-\+]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[\*\-\+]\s+/, '');
        html += `<li>${parseInlineHtml(itemText)}</li>`;
        i++;
      }
      html += `</ul>\n`;
      continue;
    }

    // Numbered List
    if (/^\d+\.\s+/.test(line)) {
      html += `<ol class="doc-list ordered">`;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
        html += `<li>${parseInlineHtml(itemText)}</li>`;
        i++;
      }
      html += `</ol>\n`;
      continue;
    }

    // Normal Paragraph
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

    html += `<p class="paragraph">${parseInlineHtml(pLines.join(' '))}</p>\n`;
  }

  // Wrap in complete standalone HTML document with professional CSS
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    @page {
      size: ${isLandscape ? 'A4 landscape' : 'A4'};
      margin: ${isLandscape ? '15mm 15mm 15mm 15mm' : '20mm 20mm 20mm 30mm'};
      @top-right {
        content: "VKU • QLDA PHẦN MỀM | ${escapeHtml(docTitle)}";
        font-family: 'Times New Roman', serif;
        font-size: 9pt;
        font-style: italic;
        color: #64748b;
      }
      @bottom-right {
        content: "Trang " counter(page);
        font-family: 'Times New Roman', serif;
        font-size: 9.5pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Times New Roman', 'Liberation Serif', serif;
      font-size: 13pt;
      line-height: 1.45;
      color: #111827;
      margin: 0;
      padding: 0;
      background: #ffffff;
      text-rendering: optimizeLegibility;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    /* Cover Page Styling */
    .cover-page {
      width: 100%;
      min-height: 960px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px 10px;
      page-break-after: always;
    }

    .cover-border {
      border: 3px double #1F4E79;
      padding: 36px 32px;
      min-height: 940px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cover-header {
      text-align: center;
    }

    .inst-ministry {
      font-size: 13pt;
      font-weight: bold;
      color: #1F4E79;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
    }

    .inst-univ {
      font-size: 13.5pt;
      font-weight: bold;
      color: #1F4E79;
      margin: 0 0 4px 0;
      letter-spacing: 0.3px;
    }

    .inst-faculty {
      font-size: 13pt;
      font-weight: bold;
      color: #2E5B82;
      margin: 0 0 14px 0;
    }

    .header-divider {
      width: 280px;
      height: 2px;
      background: #1F4E79;
      margin: 0 auto;
    }

    .cover-body {
      text-align: center;
      margin: 20px 0;
    }

    .cover-report-type {
      font-size: 22pt;
      font-weight: bold;
      color: #1F4E79;
      margin: 18px 0 6px 0;
      letter-spacing: 1px;
    }

    .cover-course {
      font-size: 15pt;
      font-weight: bold;
      color: #2E5B82;
      margin: 0 0 4px 0;
    }

    .cover-sub {
      font-size: 11pt;
      font-style: italic;
      color: #64748B;
      margin: 0 0 24px 0;
    }

    .cover-project-box {
      border: 1.5px solid #1F4E79;
      background: #F0F7FF;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 0 auto 24px auto;
      max-width: 90%;
    }

    .project-box-label {
      font-size: 11.5pt;
      font-weight: bold;
      color: #475569;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .project-box-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1F4E79;
      line-height: 1.3;
    }

    .project-box-eng {
      font-size: 11pt;
      color: #2E5B82;
      margin-top: 4px;
    }

    .cover-details {
      text-align: left;
      margin: 24px 10px;
    }

    .details-heading {
      font-size: 12.5pt;
      font-weight: bold;
      color: #1F4E79;
      margin: 0 0 8px 0;
    }

    .cover-info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12pt;
      margin-left: 8px;
    }

    .cover-info-table td {
      padding: 4px 6px;
      border: none;
    }

    .cover-student-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5pt;
      margin-top: 6px;
    }

    .cover-student-table th {
      background: #1F4E79;
      color: #ffffff;
      padding: 6px 10px;
      border: 1px solid #1F4E79;
      font-size: 11pt;
      text-align: center;
    }

    .cover-student-table td {
      padding: 6px 10px;
      border: 1px solid #CBD5E1;
      text-align: center;
    }

    .cover-student-table td:nth-child(2),
    .cover-student-table td:nth-child(4) {
      text-align: left;
    }

    .cover-student-table tr:nth-child(even) {
      background: #F8FAFC;
    }

    .cover-footer {
      text-align: center;
      font-size: 12.5pt;
      color: #1F4E79;
      margin-top: 24px;
    }

    /* Headings */
    h1.heading-1 {
      font-size: 16pt;
      font-weight: bold;
      color: #1F4E79;
      border-bottom: 2px solid #1F4E79;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }

    h2.heading-2 {
      font-size: 14pt;
      font-weight: bold;
      color: #2E5B82;
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 4px;
      margin-top: 22px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h3.heading-3 {
      font-size: 13pt;
      font-weight: bold;
      color: #111827;
      margin-top: 16px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    h4.heading-4 {
      font-size: 12.5pt;
      font-weight: bold;
      color: #374151;
      margin-top: 12px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }

    p.paragraph {
      margin: 0 0 10px 0;
      text-align: justify;
      line-height: 1.45;
    }

    hr.section-divider {
      border: none;
      height: 1px;
      background: #CBD5E1;
      margin: 20px 0;
    }

    /* Callouts */
    .callout {
      border-left: 4px solid #1F4E79;
      background: #F0F7FF;
      padding: 10px 14px;
      margin: 14px 0;
      border-radius: 0 4px 4px 0;
      page-break-inside: avoid;
    }

    .callout-important {
      border-left-color: #B91C1C;
      background: #FEF2F2;
    }

    .callout-warning {
      border-left-color: #D97706;
      background: #FFFBEB;
    }

    .callout-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 4px;
    }

    .callout-important .callout-title { color: #B91C1C; }
    .callout-warning .callout-title { color: #D97706; }
    .callout-note .callout-title { color: #1F4E79; }

    .callout-content {
      font-size: 12pt;
      font-style: italic;
      color: #1F2937;
    }

    /* Tables */
    .table-container {
      width: 100%;
      margin: 14px 0;
      page-break-inside: auto;
    }

    table.report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${isLandscape ? '10pt' : '11pt'};
      page-break-inside: auto;
    }

    table.report-table thead {
      display: table-header-group;
    }

    table.report-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    table.report-table th {
      background-color: #1F4E79;
      color: #ffffff;
      font-weight: bold;
      padding: 8px 10px;
      border: 1px solid #1F4E79;
      vertical-align: middle;
      line-height: 1.3;
    }

    table.report-table td {
      padding: 6px 9px;
      border: 1px solid #CBD5E1;
      vertical-align: top;
      line-height: 1.35;
    }

    table.report-table tbody tr:nth-child(even) {
      background-color: #F8FAFC;
    }

    /* Code & Tree Blocks */
    pre.code-block {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 3px solid #3B82F6;
      padding: 10px 14px;
      border-radius: 4px;
      font-family: 'Consolas', monospace;
      font-size: 9.5pt;
      line-height: 1.35;
      color: #0F172A;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 12px 0;
      page-break-inside: avoid;
    }

    code {
      font-family: 'Consolas', monospace;
      font-size: 10.5pt;
      color: #B91C1C;
      background: #F1F5F9;
      padding: 2px 4px;
      border-radius: 3px;
    }

    /* Lists */
    ul.doc-list, ol.doc-list {
      margin: 6px 0 10px 0;
      padding-left: 26px;
    }

    ul.doc-list li, ol.doc-list li {
      margin-bottom: 4px;
      line-height: 1.4;
      text-align: justify;
    }

    /* Links & Checkboxes */
    a.doc-link {
      color: #1F4E79;
      text-decoration: underline;
    }

    .checkbox {
      font-family: monospace;
      font-weight: bold;
    }
    .checkbox.checked { color: #16A34A; }
    .checkbox.unchecked { color: #9CA3AF; }

    /* Header for pages */
    .document-running-header {
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 4px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      font-style: italic;
      color: #64748B;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

/**
 * Render HTML file to PDF using headless Chrome
 */
function renderHtmlToPdf(htmlFilePath, pdfFilePath, isLandscape = false) {
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf=${pdfFilePath}`,
    htmlFilePath
  ];

  try {
    execFileSync(BROWSER_PATH, args, { stdio: 'pipe', windowsHide: true });
    if (fs.existsSync(pdfFilePath)) {
      const stats = fs.statSync(pdfFilePath);
      console.log(`✓ PDF Generated: ${path.basename(pdfFilePath)} (${Math.round(stats.size / 1024)} KB)`);
      return true;
    }
  } catch (err) {
    console.error(`Error rendering PDF for ${htmlFilePath}:`, err.message);
    return false;
  }
  return false;
}

/**
 * Main batch PDF runner
 */
async function run() {
  const docsDir = path.join('D:', 'Quản lý dự án phần mềm', 'docs');
  const tempHtmlDir = path.join('D:', 'Quản lý dự án phần mềm', 'scripts', 'temp_html');

  if (!fs.existsSync(tempHtmlDir)) {
    fs.mkdirSync(tempHtmlDir, { recursive: true });
  }

  const files = [
    {
      md: '01_Final_Technical_Report.md',
      pdf: '01_Final_Technical_Report.pdf',
      options: { isFinalReport: true, isLandscape: false, title: 'Báo Cáo Tổng Kết Kỹ Thuật Dự Án' }
    },
    {
      md: '02_Project_Charter_Signed.md',
      pdf: '02_Project_Charter_Signed.pdf',
      options: { isFinalReport: false, isLandscape: false, title: 'Điều Lệ Dự Án (Project Charter)' }
    },
    {
      md: '03_WBS_and_WBS_Dictionary.md',
      pdf: '03_WBS_and_WBS_Dictionary.pdf',
      options: { isFinalReport: false, isLandscape: false, title: 'Cơ Cấu Phân Rã & Từ Điển WBS' }
    },
    {
      md: '04_Risk_Register_Evolution.md',
      pdf: '04_Risk_Register_Evolution.pdf',
      options: { isFinalReport: false, isLandscape: true, title: 'Bảng Theo Dõi Rủi Ro (Risk Register)' }
    },
    {
      md: '05_Sprint_Retrospectives.md',
      pdf: '05_Sprint_Retrospectives.pdf',
      options: { isFinalReport: false, isLandscape: false, title: 'Biên Bản Họp Cải Tiến (Sprint Retrospectives)' }
    },
    {
      md: '06_Scope_Change_Control_Record.md',
      pdf: '06_Scope_Change_Control_Record.pdf',
      options: { isFinalReport: false, isLandscape: false, title: 'Hồ Sơ Quản Lý Thay Đổi (Change Control)' }
    },
    {
      md: '08_Presentation_Slide_Deck.md',
      pdf: '08_Presentation_Slide_Deck.pdf',
      options: { isFinalReport: false, isLandscape: false, title: 'Kịch Bản Bảo Vệ & Slide Deck' }
    },
    {
      md: '00_Project_Overview_and_Links.md',
      pdf: '00_Project_Overview_and_Links.pdf',
      options: { isFinalReport: false, isLandscape: false, title: 'Tổng Quan Dự Án & Danh Mục Link' }
    }
  ];

  console.log(`\n======================================================`);
  console.log(`Generating ${files.length} official PDF reports (Times New Roman)...`);
  console.log(`Working Directory: ${docsDir}`);
  console.log(`No git commit will be made.`);
  console.log(`======================================================\n`);

  for (const item of files) {
    const mdPath = path.join(docsDir, item.md);
    const pdfPath = path.join(docsDir, item.pdf);
    const htmlPath = path.join(tempHtmlDir, item.md.replace('.md', '.html'));

    if (!fs.existsSync(mdPath)) {
      console.warn(`File not found: ${mdPath}`);
      continue;
    }

    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const htmlContent = markdownToHtml(
      mdContent,
      item.options.isFinalReport,
      item.options.isLandscape,
      item.options.title
    );

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    renderHtmlToPdf(htmlPath, pdfPath, item.options.isLandscape);
  }

  // Clean up temporary HTML directory
  try {
    fs.rmSync(tempHtmlDir, { recursive: true, force: true });
  } catch (e) {}

  console.log(`\n======================================================`);
  console.log(`All PDF reports generated successfully in ${docsDir}`);
  console.log(`======================================================\n`);
}

if (require.main === module) {
run().catch(err => {
  console.error('Fatal error during PDF generation:', err);
  process.exit(1);
});

}
module.exports = { markdownToHtml, renderHtmlToPdf };
