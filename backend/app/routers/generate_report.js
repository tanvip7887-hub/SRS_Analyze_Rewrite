const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
    LevelFormat, PageNumber, Footer, Header, PageBreak,
} = require('docx');
const fs = require('fs');

const data = JSON.parse(process.argv[2]);
const outputPath = process.argv[3];

const {
    projectName,
    generatedAt,
    stats,
    duplicateGroups,
    ambiguousReqs,
    cleanReqs,
} = data;

// ─── Colours ────────────────────────────────────────────────────────────────
const C = {
    gold: 'C49A3C',
    red: 'EF4444',
    yellow: 'F59E0B',
    green: '22C55E',
    blue: '3B82F6',
    purple: '8B5CF6',
    dark: '1E2433',
    mid: '374151',
    light: '6B7280',
    white: 'FFFFFF',
    offwhite: 'F9FAFB',
    border: 'E5E7EB',
};

const border = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const gap = (pts = 120) => new Paragraph({ children: [new TextRun('')], spacing: { before: pts, after: 0 } });

const pill = (text, color) => new TextRun({
    text: `  ${text}  `,
    font: 'Arial',
    size: 16,
    color: C.white,
    bold: true,
    shading: { fill: color, type: ShadingType.CLEAR },
});

const statRow = (label, value, color) => new TableRow({
    children: [
        new TableCell({
            borders,
            width: { size: 6800, type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            shading: { fill: C.offwhite, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 20, color: C.mid })] })],
        }),
        new TableCell({
            borders,
            width: { size: 2560, type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            shading: { fill: C.white, type: ShadingType.CLEAR },
            children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: String(value), font: 'Arial', size: 22, bold: true, color: color || C.dark })],
            })],
        }),
    ],
});

const sectionHeading = (text, num) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.gold, space: 6 } },
    children: [
        new TextRun({ text: `${num}  `, font: 'Arial', size: 28, bold: true, color: C.gold }),
        new TextRun({ text, font: 'Arial', size: 28, bold: true, color: C.dark }),
    ],
});

const subHeading = (text) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: C.mid })],
});

const bodyText = (text, options = {}) => new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 20, color: C.mid, ...options })],
});

const reqIdRun = (id, type) => {
    const color = type === 'FR' ? C.gold : type === 'NFR' ? C.blue : C.purple;
    return new TextRun({ text: id, font: 'Courier New', size: 18, bold: true, color });
};

const flagRun = (flag) => new TextRun({
    text: `  ${flag}  `,
    font: 'Arial',
    size: 16,
    color: C.red,
    shading: { fill: 'FEF2F2', type: ShadingType.CLEAR },
});

// ─── Cover Page ───────────────────────────────────────────────────────────────
const coverPage = [
    gap(2400),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: 'REQIFY', font: 'Arial', size: 56, bold: true, color: C.gold })],
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480 },
        children: [new TextRun({ text: 'SRS Analysis Report', font: 'Arial', size: 32, color: C.light })],
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: projectName, font: 'Arial', size: 40, bold: true, color: C.dark })],
    }),
    new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: `Generated: ${new Date(generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, font: 'Arial', size: 20, color: C.light })],
    }),
    gap(480),
    // Stat summary on cover
    new Table({
        width: { size: 5760, type: WidthType.DXA },
        columnWidths: [1440, 1440, 1440, 1440],
        alignment: AlignmentType.CENTER,
        rows: [
            new TableRow({
                children: [
                    { label: 'Requirements', val: stats.total, color: C.gold },
                    { label: 'Dup Groups', val: stats.dupGroups, color: C.yellow },
                    { label: 'Ambiguous', val: stats.ambig, color: C.red },
                    { label: 'Clean', val: stats.clean, color: C.green },
                ].map(s => new TableCell({
                    borders,
                    width: { size: 1440, type: WidthType.DXA },
                    margins: { top: 160, bottom: 160, left: 120, right: 120 },
                    shading: { fill: C.offwhite, type: ShadingType.CLEAR },
                    children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(s.val), font: 'Arial', size: 40, bold: true, color: s.color })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.label, font: 'Arial', size: 16, color: C.light })] }),
                    ],
                })),
            }),
        ],
    }),
    gap(200),
    new Paragraph({ children: [new PageBreak()] }),
];

// ─── Section 1: Executive Summary ────────────────────────────────────────────
const summarySection = [
    sectionHeading('Executive Summary', '1.'),
    gap(80),
    new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [6800, 2560],
        rows: [
            statRow('Total Requirements Analysed', stats.total, C.dark),
            statRow('Duplicate Groups Found', stats.dupGroups, C.yellow),
            statRow('Duplicate Requirements', stats.dups, C.yellow),
            statRow('Ambiguous Requirements', stats.ambig, C.red),
            statRow('Clean Requirements', stats.clean, C.green),
            statRow('Ambiguous Reviewed', stats.reviewed, C.purple),
        ],
    }),
    gap(160),
    bodyText(
        `This report provides a comprehensive analysis of the ${projectName} Software Requirements Specification. ` +
        `${stats.clean} requirements (${Math.round(stats.clean / stats.total * 100)}%) are clean and well-formed. ` +
        `${stats.ambig} requirements require attention due to ambiguous language, and ${stats.dupGroups} groups of duplicate requirements were identified.`
    ),
    gap(200),
    new Paragraph({ children: [new PageBreak()] }),
];

// ─── Section 2: Duplicate Requirements ───────────────────────────────────────
const buildDuplicatesSection = () => {
    const items = [
        sectionHeading('Duplicate Requirements', '2.'),
        gap(80),
    ];

    if (!duplicateGroups.length) {
        items.push(bodyText('No duplicate requirements were detected.', { color: C.green }));
        items.push(gap(200));
        items.push(new Paragraph({ children: [new PageBreak()] }));
        return items;
    }

    items.push(bodyText(
        `${duplicateGroups.length} groups of semantically similar requirements were identified using cosine similarity analysis. ` +
        `Review each group and keep the most complete and precise version.`
    ));
    items.push(gap(160));

    duplicateGroups.forEach((group, gi) => {
        const isResolved = group.members.some(m => m.review_status === 'removed');

        items.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
                new TextRun({ text: `Group ${gi + 1}`, font: 'Arial', size: 22, bold: true, color: C.dark }),
                new TextRun({ text: '   ' }),
                new TextRun({
                    text: isResolved ? '  Resolved  ' : '  Pending Review  ',
                    font: 'Arial', size: 16, bold: true, color: C.white,
                    shading: { fill: isResolved ? C.green : C.yellow, type: ShadingType.CLEAR },
                }),
            ],
        }));

        const rows = group.members.map(req => {
            const typeColor = req.req_type === 'FR' ? C.gold : C.blue;
            const isKept = req.review_status === 'kept';
            const isRemoved = req.review_status === 'removed';
            const statusText = isKept ? '✓ KEPT' : isRemoved ? '✕ REMOVED' : 'PENDING';
            const statusColor = isKept ? C.green : isRemoved ? C.red : C.yellow;

            return new TableRow({
                children: [
                    new TableCell({
                        borders,
                        width: { size: 1400, type: WidthType.DXA },
                        margins: { top: 100, bottom: 100, left: 140, right: 140 },
                        shading: { fill: C.offwhite, type: ShadingType.CLEAR },
                        children: [
                            new Paragraph({ children: [new TextRun({ text: req.req_id, font: 'Courier New', size: 18, bold: true, color: typeColor })] }),
                            new Paragraph({ children: [new TextRun({ text: statusText, font: 'Arial', size: 15, bold: true, color: statusColor })] }),
                        ],
                    }),
                    new TableCell({
                        borders,
                        width: { size: 7960, type: WidthType.DXA },
                        margins: { top: 100, bottom: 100, left: 140, right: 140 },
                        children: [new Paragraph({ children: [new TextRun({ text: req.original_text || '', font: 'Arial', size: 19, color: isRemoved ? C.light : C.mid })] })],
                    }),
                ],
            });
        });

        items.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1400, 7960], rows }));
        items.push(gap(120));
    });

    items.push(new Paragraph({ children: [new PageBreak()] }));
    return items;
};

// ─── Section 3: Ambiguous Requirements ───────────────────────────────────────
const buildAmbiguousSection = () => {
    const items = [
        sectionHeading('Ambiguous Requirements', '3.'),
        gap(80),
    ];

    if (!ambiguousReqs.length) {
        items.push(bodyText('No ambiguous requirements were detected.', { color: C.green }));
        items.push(gap(200));
        items.push(new Paragraph({ children: [new PageBreak()] }));
        return items;
    }

    items.push(bodyText(
        `${ambiguousReqs.length} requirements were flagged for ambiguous language. Each entry shows the original text, ` +
        `the detected ambiguity flags, ambiguity score, and the AI-generated rewrite where available.`
    ));
    items.push(gap(160));

    ambiguousReqs.forEach((req, i) => {
        const typeColor = req.req_type === 'FR' ? C.gold : C.blue;
        const scoreColor = (req.ambiguity_score || 0) > 0.6 ? C.red : C.yellow;
        const rw = req.rewrites?.[0];
        const decided = rw?.action && rw.action !== 'pending';
        const actionText = decided
            ? (rw.action === 'accepted' ? 'Accepted' : rw.action === 'edited' ? 'Accepted (Edited)' : 'Rejected')
            : 'Pending Review';
        const actionColor = decided
            ? (rw.action === 'rejected' ? C.red : C.green)
            : C.yellow;

        // Req header
        items.push(new Paragraph({
            spacing: { before: 220, after: 80 },
            children: [
                new TextRun({ text: req.req_id, font: 'Courier New', size: 20, bold: true, color: typeColor }),
                new TextRun({ text: '   ' }),
                new TextRun({ text: `Score: ${Math.round((req.ambiguity_score || 0) * 100)}%`, font: 'Arial', size: 17, bold: true, color: scoreColor }),
                new TextRun({ text: '   ' }),
                new TextRun({ text: `  ${actionText}  `, font: 'Arial', size: 15, bold: true, color: C.white, shading: { fill: actionColor, type: ShadingType.CLEAR } }),
            ],
        }));

        // Original text
        items.push(new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [new TextRun({ text: 'Original: ', font: 'Arial', size: 18, bold: true, color: C.light })],
        }));
        items.push(new Paragraph({
            spacing: { before: 0, after: 60 },
            indent: { left: 360 },
            border: { left: { style: BorderStyle.SINGLE, size: 8, color: C.red, space: 12 } },
            children: [new TextRun({ text: req.original_text || '', font: 'Arial', size: 19, color: C.mid })],
        }));

        // Flags
        if (req.ambiguity_flags?.length) {
            items.push(new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [
                    new TextRun({ text: 'Flags: ', font: 'Arial', size: 18, bold: true, color: C.light }),
                    ...req.ambiguity_flags.map(f => new TextRun({
                        text: `  ${f.split(':')[0]}  `,
                        font: 'Arial', size: 15, color: C.red,
                        shading: { fill: 'FEF2F2', type: ShadingType.CLEAR },
                    })).reduce((acc, run, idx) => { acc.push(run); if (idx < req.ambiguity_flags.length - 1) acc.push(new TextRun({ text: ' ' })); return acc; }, []),
                ],
            }));
        }

        // AI rewrite
        if (rw?.ai_rewritten_text) {
            const finalText = rw.final_text || rw.ai_rewritten_text;
            items.push(new Paragraph({
                spacing: { before: 60, after: 40 },
                children: [new TextRun({ text: decided && rw.action !== 'rejected' ? 'Accepted Rewrite: ' : 'AI Rewrite: ', font: 'Arial', size: 18, bold: true, color: C.light })],
            }));
            items.push(new Paragraph({
                spacing: { before: 0, after: 80 },
                indent: { left: 360 },
                border: { left: { style: BorderStyle.SINGLE, size: 8, color: C.green, space: 12 } },
                children: [new TextRun({ text: finalText, font: 'Arial', size: 19, color: C.mid })],
            }));
        }

        if (i < ambiguousReqs.length - 1) {
            items.push(new Paragraph({
                spacing: { before: 60, after: 60 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: C.border, space: 1 } },
                children: [new TextRun({ text: '' })],
            }));
        }
    });

    items.push(gap(200));
    items.push(new Paragraph({ children: [new PageBreak()] }));
    return items;
};

// ─── Section 4: Clean Requirements ───────────────────────────────────────────
const buildCleanSection = () => {
    const items = [
        sectionHeading('Clean Requirements', '4.'),
        gap(80),
        bodyText(`${cleanReqs.length} requirements passed all quality checks and require no further action.`),
        gap(120),
    ];

    const rows = [
        new TableRow({
            tableHeader: true,
            children: [
                new TableCell({ borders, width: { size: 1400, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, shading: { fill: C.dark, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'ID', font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
                new TableCell({ borders, width: { size: 1200, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, shading: { fill: C.dark, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Type', font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
                new TableCell({ borders, width: { size: 6760, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, shading: { fill: C.dark, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: 'Requirement', font: 'Arial', size: 18, bold: true, color: C.white })] })] }),
            ],
        }),
        ...cleanReqs.map((req, i) => {
            const typeColor = req.req_type === 'FR' ? C.gold : req.req_type === 'NFR' ? C.blue : C.purple;
            return new TableRow({
                children: [
                    new TableCell({ borders, width: { size: 1400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 140, right: 140 }, shading: { fill: i % 2 === 0 ? C.offwhite : C.white, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: req.req_id, font: 'Courier New', size: 17, bold: true, color: typeColor })] })] }),
                    new TableCell({ borders, width: { size: 1200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 140, right: 140 }, shading: { fill: i % 2 === 0 ? C.offwhite : C.white, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: req.req_type || '-', font: 'Arial', size: 17, color: typeColor })] })] }),
                    new TableCell({ borders, width: { size: 6760, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 140, right: 140 }, shading: { fill: i % 2 === 0 ? C.offwhite : C.white, type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: req.current_text || req.original_text || '', font: 'Arial', size: 17, color: C.mid })] })] }),
                ],
            });
        }),
    ];

    items.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1400, 1200, 6760], rows }));
    return items;
};

// ─── Assemble Document ────────────────────────────────────────────────────────
const doc = new Document({
    styles: {
        default: { document: { run: { font: 'Arial', size: 20, color: C.mid } } },
        paragraphStyles: [
            {
                id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 28, bold: true, font: 'Arial', color: C.dark },
                paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 }
            },
            {
                id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                run: { size: 22, bold: true, font: 'Arial', color: C.mid },
                paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 }
            },
        ],
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: `${projectName} — SRS Analysis Report  |  `, font: 'Arial', size: 16, color: C.light }),
                        new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: C.light }),
                    ],
                })],
            }),
        },
        children: [
            ...coverPage,
            ...summarySection,
            ...buildDuplicatesSection(),
            ...buildAmbiguousSection(),
            ...buildCleanSection(),
        ],
    }],
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputPath, buffer);
    console.log('OK');
}).catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});