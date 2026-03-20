import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getPdfContent } from './api';

// Import logo as data URL
import logoUrl from '/devlens-logo.svg';

// Convert SVG to PNG data URL for jsPDF compatibility
async function svgToPngDataUrl(svgUrl, width = 200, height = 200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Fill white background first for visibility
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw the SVG image
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load SVG'));
    img.src = svgUrl;
  });
}

// Color scheme
const COLORS = {
  primary: [52, 152, 219],      // Blue
  secondary: [46, 204, 113],     // Green
  accent: [230, 126, 34],        // Orange
  danger: [231, 76, 60],         // Red
  text: [44, 62, 80],            // Dark gray
  lightText: [127, 140, 141],    // Light gray
  lightBg: [236, 240, 241],      // Very light gray
  white: [255, 255, 255],
};

function setColor(doc, colorArray) {
  doc.setTextColor(colorArray[0], colorArray[1], colorArray[2]);
}

function setFillColor(doc, colorArray) {
  doc.setFillColor(colorArray[0], colorArray[1], colorArray[2]);
}

function addSectionTitle(doc, title, y) {
  setFillColor(doc, COLORS.primary);
  doc.rect(14, y - 5, 182, 8, 'F');
  setColor(doc, COLORS.white);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(title, 16, y + 1);
  return y + 10;
}

function addParagraph(doc, text, y, maxWidth = 182) {
  if (!text) return y;
  setColor(doc, COLORS.text);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 14, y);
  return y + (lines.length * 5) + 4;
}

function addBulletList(doc, items, y, maxWidth = 170) {
  if (!items || items.length === 0) return y;
  setColor(doc, COLORS.text);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  
  let currentY = y;
  items.forEach((item) => {
    // Clean the item of markdown bullet points
    const cleanItem = item.replace(/^[-*•]\s*/, '').trim();
    if (cleanItem.length === 0) return;
    
    const lines = doc.splitTextToSize(cleanItem, maxWidth);
    doc.text('• ' + lines[0], 16, currentY);
    
    for (let i = 1; i < lines.length; i++) {
      currentY += 5;
      doc.text(lines[i], 20, currentY);
    }
    currentY += 5;
  });
  return currentY + 2;
}

function formatBulletText(text) {
  if (!text) return [];
  return text
    .split(/[•\n-]/g)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

export async function generatePDFReport(result) {
  if (!result) {
    throw new Error('No analysis result provided');
  }

  const { owner, repo, overallScore, projectStatus, stars, forks, openIssues, readmeScore, topContributors, description, license, languages, url, createdAt, updatedAt, hasWiki, hasIssues, hasProjects, hasDownloads, hasDiscussions, topics } = result;
  
  if (!owner || !repo) {
    throw new Error('Repository owner and name are required');
  }

  // Fetch PDF content from backend
  const pdfContent = await getPdfContent(owner, repo);

  // Create PDF document
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // ==== DevLens Header with Logo ====
  setFillColor(doc, COLORS.primary);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  // Add logo - convert SVG to PNG first
  try {
    const logoPng = await svgToPngDataUrl(logoUrl, 200, 200);
    doc.addImage(logoPng, 'PNG', 14, 3, 18, 18);
  } catch (e) {
    // Fallback if logo fails to load
    console.warn('Logo failed to load:', e);
  }
  
  setColor(doc, COLORS.white);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('DevLens', 36, 12);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Repository Analysis Report', 36, 18);
  
  y = 37;

  // ==== Repository Title ====
  setColor(doc, COLORS.primary);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text(`${repo}`, 14, y);
  y += 10;
  
  setColor(doc, COLORS.lightText);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`by ${owner} | Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, y);
  
  if (description) {
    y += 7;
    setColor(doc, COLORS.text);
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    const descLines = doc.splitTextToSize(description, 182);
    doc.text(descLines, 14, y);
    y += (descLines.length * 4) + 3;
  }
  y += 3;

  // ==== Repository Links ====
  y += 5;
  setColor(doc, COLORS.primary);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Repository URL:', 14, y);
  setColor(doc, COLORS.text);
  doc.setFont(undefined, 'normal');
  doc.text(url || `https://github.com/${owner}/${repo}`, 50, y);
  y += 8;

  // ==== Score Highlight Box ====
  const scoreColor = overallScore >= 80 ? COLORS.secondary : overallScore >= 50 ? COLORS.accent : COLORS.danger;
  setFillColor(doc, scoreColor);
  doc.rect(14, y - 2, 182, 12, 'F');
  setColor(doc, COLORS.white);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`Overall Quality Score: ${overallScore}/100`, 16, y + 6);
  y += 18;

  // ==== Quick Stats Grid ====
  const statsData = [
    ['Status', projectStatus || 'Unknown'],
    ['Stars', stars?.toString() || '0'],
    ['Forks', forks?.toString() || '0'],
    ['Open Issues', openIssues?.toString() || '0'],
    ['README Score', `${readmeScore?.total || 0}/100`],
    ['Contributors', (topContributors?.length || 0).toString()],
    ['License', license || 'Not specified'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: statsData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 102 },
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ==== Executive Summary ====
  y = addSectionTitle(doc, 'Executive Summary', y);
  if (pdfContent?.executiveSummary) {
    y = addParagraph(doc, pdfContent.executiveSummary, y);
  }
  y += 3;

  // Page break check
  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  // ==== Key Highlights ====
  y = addSectionTitle(doc, 'Key Highlights', y);
  if (pdfContent?.keyHighlights) {
    const highlights = formatBulletText(pdfContent.keyHighlights);
    y = addBulletList(doc, highlights, y);
  }
  y += 3;

  // Page break check
  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  // ==== Technical Analysis ====
  y = addSectionTitle(doc, 'Technical Analysis', y);
  if (pdfContent?.technicalAnalysis) {
    y = addParagraph(doc, pdfContent.technicalAnalysis, y);
  }
  y += 3;

  // Page break check
  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  // ==== Community Health ====
  y = addSectionTitle(doc, 'Community Health', y);
  if (pdfContent?.communityHealth) {
    y = addParagraph(doc, pdfContent.communityHealth, y);
  }
  y += 3;

  // Page break check
  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  // ==== Recommendations ====
  y = addSectionTitle(doc, 'Recommendations', y);
  if (pdfContent?.recommendations) {
    const recommendations = formatBulletText(pdfContent.recommendations);
    y = addBulletList(doc, recommendations, y);
  }
  y += 3;

  // Page break check
  if (y > 250) {
    doc.addPage();
    y = 15;
  }

  // ==== README Quality Breakdown ====
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  y = addSectionTitle(doc, 'README Quality Assessment', y);
  
  if (readmeScore && typeof readmeScore === 'object') {
    const readmeMetrics = [
      ['Length Score', `${readmeScore.length || 0}/25`, readmeScore.length >= 20 ? 'Excellent' : readmeScore.length >= 15 ? 'Good' : 'Needs Improvement'],
      ['Structure Score', `${readmeScore.structure || 0}/25`, readmeScore.structure >= 20 ? 'Excellent' : readmeScore.structure >= 15 ? 'Good' : 'Needs Improvement'],
      ['Content Score', `${readmeScore.content || 0}/25`, readmeScore.content >= 20 ? 'Excellent' : readmeScore.content >= 15 ? 'Good' : 'Needs Improvement'],
      ['Clarity Score', `${readmeScore.clarity || 0}/25`, readmeScore.clarity >= 20 ? 'Excellent' : readmeScore.clarity >= 15 ? 'Good' : 'Needs Improvement'],
      ['Overall README', `${readmeScore.total || 0}/100`, readmeScore.total >= 80 ? 'Excellent' : readmeScore.total >= 60 ? 'Good' : 'Needs Work'],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Score', 'Rating']],
      body: readmeMetrics,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 82 },
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBg,
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    y = addParagraph(doc, 'README quality metrics not available for this repository.', y);
    y += 5;
  }

  // ==== Repository Features ====
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  y = addSectionTitle(doc, 'Repository Features & Settings', y);
  
  const featureData = [
    ['Wiki Enabled', hasWiki ? 'Yes' : 'No'],
    ['Issues Enabled', hasIssues ? 'Yes' : 'No'],
    ['Projects Enabled', hasProjects ? 'Yes' : 'No'],
    ['Downloads Available', hasDownloads ? 'Yes' : 'No'],
    ['Discussions Enabled', hasDiscussions ? 'Yes' : 'No'],
    ['Created', createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'],
    ['Last Updated', updatedAt ? new Date(updatedAt).toLocaleDateString() : 'N/A'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Feature', 'Status']],
    body: featureData,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.accent,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg,
    },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 102 },
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  // ==== Topics & Tags ====
  if (topics && topics.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    y = addSectionTitle(doc, 'Topics & Tags', y);
    
    setColor(doc, COLORS.text);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    const topicText = topics.join(' • ');
    const lines = doc.splitTextToSize(topicText, 170);
    doc.text(lines, 16, y);
    y += (lines.length * 5) + 8;
  }

  // ==== Detailed Metrics ====
  y = addSectionTitle(doc, 'Technology Stack', y);
  
  if (languages && Object.keys(languages).length > 0) {
    const langData = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([lang, bytes]) => {
        const bytesNum = parseInt(bytes);
        const kb = (bytesNum / 1024).toFixed(1);
        return [lang, `${kb} KB`];
      });

    autoTable(doc, {
      startY: y,
      head: [['Language', 'Size']],
      body: langData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.accent,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBg,
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 82, halign: 'right' },
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ==== Top Contributors ====
  if (topContributors && topContributors.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 15;
    }

    y = addSectionTitle(doc, 'Top Contributors', y);

    const contribData = topContributors.slice(0, 8).map((contrib) => [
      contrib.login || 'Unknown',
      (contrib.contributions || 0).toString(),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Contributor', 'Contributions']],
      body: contribData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.text,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightBg,
      },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 52, halign: 'right' },
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ==== About This Report ====
  if (y > 240) {
    doc.addPage();
    y = 15;
  }

  y = addSectionTitle(doc, 'About This Report', y);
  
  const reportInfo = [
    'This report was generated by DevLens, an AI-powered repository analysis tool.',
    '',
    'Methodology:',
    '• README Quality: Evaluated based on length, structure, content richness, and clarity',
    '• Technical Analysis: AI-powered assessment of codebase quality and architecture',
    '• Community Health: Analysis of contributor activity, issue management, and project maintenance',
    '• Overall Score: Weighted combination of multiple quality metrics',
    '',
    'Generated on: ' + new Date().toLocaleString(),
    'Report Version: 1.0',
  ];

  setColor(doc, COLORS.text);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  
  reportInfo.forEach(line => {
    if (line === '') {
      y += 4;
      return;
    }
    if (line.startsWith('•')) {
      doc.text(line, 16, y);
    } else if (line.startsWith('Methodology:') || line.startsWith('Generated')) {
      doc.setFont(undefined, 'bold');
      doc.text(line, 14, y);
      doc.setFont(undefined, 'normal');
    } else {
      doc.text(line, 14, y);
    }
    y += 5;
  });
  y += 5;

  // ==== Footer with Page Numbers ====
  const pageCount = doc.getNumberOfPages();
  setFillColor(doc, COLORS.lightBg);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Footer line
    setColor(doc, COLORS.lightText);
    doc.setDrawColor(COLORS.lightText[0], COLORS.lightText[1], COLORS.lightText[2]);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    
    // Footer text
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} | DevLens Repository Analysis | ${owner}/${repo}`,
      14,
      pageHeight - 8
    );
    
    // Report generation timestamp
    doc.setFontSize(7);
    setColor(doc, COLORS.lightText);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // ==== Download PDF ====
  const filename = `${owner}_${repo}_devlens-report.pdf`;
  doc.save(filename);
}
