import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionSession, InspectionItemResult } from '../types';
import { SERVICES_CONFIG, PLATFORMS_CONFIG, CONTEXTS_CONFIG, TONE_LEVELS_CONFIG } from '../data/defaultGuides';

export function exportToExcel(session: InspectionSession) {
  const serviceName = SERVICES_CONFIG[session.service]?.title || session.service;
  const platformName = PLATFORMS_CONFIG[session.platform]?.title || session.platform;
  const contextName = CONTEXTS_CONFIG[session.context]?.title || session.context;
  const toneName = TONE_LEVELS_CONFIG[session.toneLevel]?.name || `Level ${session.toneLevel}`;

  // 1. Data Sheet
  const rows = session.items.map((item, index) => {
    const adopted = item.selectedAlt === 1 
      ? item.alt1.text 
      : item.selectedAlt === 2 
      ? item.alt2.text 
      : item.customAdoptedText || '미채택 (대안 1 권장)';

    const violationsStr = item.violations.map(v => `[${v.category}] ${v.title}: ${v.description}`).join('; ');
    const similarCasesStr = item.similarCases.map(s => `[${s.serviceCategory}] ${s.original} -> ${s.revised} (${s.reason})`).join('\n');

    return {
      'No.': index + 1,
      '위치/역할': item.locationLabel || '일반 카피',
      '기존 원본 문구': item.originalText,
      '추천 대안 1 (직관·간결)': item.alt1.text,
      '대안 1 글자수': item.alt1.charCount,
      '추천 대안 2 (친절·공감)': item.alt2.text,
      '대안 2 글자수': item.alt2.charCount,
      '최종 채택 카피': adopted,
      '위배 규칙': violationsStr || '특이 위배 없음',
      '수정 이유 및 해설': item.explanation,
      '과거 유사 개선 사례': similarCasesStr,
      '명확성 점수': item.score.clarity,
      '간결성 점수': item.score.conciseness,
      '톤 적합도': item.score.toneFit,
      '플랫폼 적합도': item.score.platformFit,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = [
    { wch: 6 },  // No
    { wch: 15 }, // 위치
    { wch: 35 }, // 원본
    { wch: 35 }, // 대안1
    { wch: 12 }, // 글자수
    { wch: 35 }, // 대안2
    { wch: 12 }, // 글자수
    { wch: 35 }, // 채택
    { wch: 40 }, // 위배규칙
    { wch: 50 }, // 수정이유
    { wch: 45 }, // 유사사례
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'UX_검수결과');

  // Metadata Sheet
  const metaRows = [
    { '항목': '검수 일시', '내용': new Date(session.timestamp).toLocaleString('ko-KR') },
    { '항목': '서비스 유형', '내용': serviceName },
    { '항목': '플랫폼 디바이스', '내용': platformName },
    { '항목': '상황 맥락', '내용': contextName },
    { '항목': '설정 톤 레벨', '내용': toneName },
    { '항목': '입력 방식', '내용': session.inputMode },
    { '항목': '총 검수 문구 수', '내용': `${session.items.length}개` },
    { '항목': '종합 총평', '내용': session.overallSummary || '-' },
  ];
  const metaWorksheet = XLSX.utils.json_to_sheet(metaRows);
  metaWorksheet['!cols'] = [{ wch: 18 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, metaWorksheet, '검수_프로젝트_정보');

  const filename = `UX_Writing_검수결과_${session.service}_${session.platform}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportToPdf(session: InspectionSession) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const serviceName = SERVICES_CONFIG[session.service]?.title || session.service;
  const platformName = PLATFORMS_CONFIG[session.platform]?.title || session.platform;
  const contextName = CONTEXTS_CONFIG[session.context]?.title || session.context;
  const toneName = TONE_LEVELS_CONFIG[session.toneLevel]?.name || `Level ${session.toneLevel}`;

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('UX Writing Inspection Report', 14, 13);
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Service: ${serviceName}  |  Platform: ${platformName}  |  Context: ${contextName}  |  Tone: ${toneName}`, 14, 21);

  // Summary section
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.text('Project Metadata & Summary', 14, 36);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${new Date(session.timestamp).toLocaleString('ko-KR')}   |   Items Inspected: ${session.items.length}`, 14, 42);

  if (session.overallSummary) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 46, 182, 16, 2, 2, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    const splitSummary = doc.splitTextToSize(`Summary: ${session.overallSummary}`, 174);
    doc.text(splitSummary, 18, 52);
  }

  const startY = session.overallSummary ? 68 : 48;

  // Table Data
  const tableRows = session.items.map((item, idx) => {
    const adopted = item.selectedAlt === 1 
      ? item.alt1.text 
      : item.selectedAlt === 2 
      ? item.alt2.text 
      : item.customAdoptedText || item.alt1.text;

    const violations = item.violations.map(v => `[${v.category}] ${v.title}`).join(', ');

    return [
      String(idx + 1),
      item.locationLabel || 'Copy',
      item.originalText,
      item.alt1.text,
      item.alt2.text,
      adopted,
      violations || 'Passed',
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [['#', 'Target', 'Original Copy', 'Alt 1 (Concise)', 'Alt 2 (Friendly)', 'Adopted', 'Violations']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18 },
      2: { cellWidth: 38 },
      3: { cellWidth: 38 },
      4: { cellWidth: 38 },
      5: { cellWidth: 35 },
      6: { cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const filename = `UX_Writing_Report_${session.service}_${session.platform}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
