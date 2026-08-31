export interface PdfColumn<T> {
  title: string;
  value: (item: T) => string | number | null | undefined;
}

const escapeHtml = (value: unknown) => String(value ?? '—')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const exportHtmlToPdf = (title: string, bodyHtml: string): boolean => {
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) return false;

  printWindow.document.write(`<!doctype html>
    <html lang="fa" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { font-family: Tahoma, Arial, sans-serif; color: #172033; margin: 0; direction: rtl; }
        </style>
      </head>
      <body>
        ${bodyHtml}
        <script>window.addEventListener('load', () => { window.print(); });<\/script>
      </body>
    </html>`);
  printWindow.document.close();
  return true;
};

export const exportListToPdf = <T,>(title: string, items: T[], columns: PdfColumn<T>[]): boolean => {
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return false;

  const rows = items.map((item) => `
    <tr>${columns.map((column) => `<td>${escapeHtml(column.value(item))}</td>`).join('')}</tr>
  `).join('');

  printWindow.document.write(`<!doctype html>
    <html lang="fa" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { font-family: Tahoma, Arial, sans-serif; color: #172033; margin: 0; direction: rtl; }
          header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #b0126b; padding-bottom: 10px; margin-bottom: 16px; }
          h1 { font-size: 18px; margin: 0; }
          .meta { color: #64748b; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #541d50; color: white; padding: 9px 7px; border: 1px solid #3f163c; }
          td { padding: 8px 7px; border: 1px solid #d9dee8; vertical-align: top; }
          tr:nth-child(even) td { background: #fff6fb; }
          .empty { text-align: center; padding: 30px; color: #64748b; }
        </style>
      </head>
      <body>
        <header><h1>${escapeHtml(title)}</h1><div class="meta">تعداد: ${escapeHtml(items.length)} مورد</div></header>
        ${items.length ? `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.title)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">موردی برای خروجی وجود ندارد.</div>'}
        <script>window.addEventListener('load', () => { window.print(); });<\/script>
      </body>
    </html>`);
  printWindow.document.close();
  return true;
};
