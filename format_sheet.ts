/**
 * format_sheet.ts
 * Formats both the main cases sheet and the Attachments sheet.
 * Safe to run multiple times (clears existing conditional rules + banding first).
 * Run with: npx tsx format_sheet.ts
 */
import { google } from "googleapis";
import * as dotenv from 'dotenv';
dotenv.config();

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function main() {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

    // ── Get sheet metadata ──
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const allSheets = meta.data.sheets ?? [];

    const mainSheet = allSheets[0];
    const mainSheetId = mainSheet?.properties?.sheetId ?? 0;
    const mainTitle = mainSheet?.properties?.title ?? "Sheet1";

    const attachSheet = allSheets.find(s =>
        s.properties?.title === "Attachments" || s.properties?.title === "เอกสาร"
    );
    const attachSheetId = attachSheet?.properties?.sheetId;
    const attachTitle = attachSheet?.properties?.title;

    console.log(`📋 Main sheet: "${mainTitle}" (id=${mainSheetId})`);
    if (attachSheet) console.log(`📎 Attachments sheet: "${attachTitle}" (id=${attachSheetId})`);

    // ── Step 1: Clear existing conditional format rules on main sheet ──
    console.log("\n1️⃣  Clearing existing conditional format rules...");
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteConditionalFormatRule: {
                        sheetId: mainSheetId,
                        index: 0
                    }
                }]
            }
        });
        // delete more rules until error
        for (let i = 0; i < 20; i++) {
            try {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{ deleteConditionalFormatRule: { sheetId: mainSheetId, index: 0 } }]
                    }
                });
            } catch { break; }
        }
    } catch { /* no rules to delete */ }

    // ── Step 2: Clear existing banding ──
    console.log("2️⃣  Clearing existing banding...");
    const fullMeta = await sheets.spreadsheets.get({ spreadsheetId });
    
    const clearBanding = async (sId: number) => {
        const sData = fullMeta.data.sheets?.find(s => s.properties?.sheetId === sId);
        const existingBanding = sData?.bandedRanges ?? [];
        for (const band of existingBanding) {
            const bandId = band.bandedRangeId;
            if (bandId !== undefined) {
                try {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: { requests: [{ deleteBanding: { bandedRangeId: bandId } }] }
                    });
                } catch { /* ignore */ }
            }
        }
    };

    await clearBanding(mainSheetId);
    if (attachSheetId !== undefined && attachSheetId !== null) await clearBanding(attachSheetId);

    // ── Step 3: Format main sheet ──
    console.log("3️⃣  Applying main sheet formatting...");
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                // Header row: dark navy + white bold
                {
                    repeatCell: {
                        range: { sheetId: mainSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 16 },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.122, green: 0.188, blue: 0.412 },
                                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 },
                                horizontalAlignment: "CENTER",
                                verticalAlignment: "MIDDLE",
                            }
                        },
                        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
                    }
                },
                // Set text color to dark for ALL data rows to ensure visibility against light banding
                {
                    repeatCell: {
                        range: { sheetId: mainSheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 16 },
                        cell: {
                            userEnteredFormat: {
                                textFormat: { foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 } } // near black
                            }
                        },
                        fields: "userEnteredFormat(textFormat.foregroundColor)"
                    }
                },
                // Date column A: format as DD/MM/YYYY HH:MM:SS (text already formatted by sync script)
                {
                    repeatCell: {
                        range: { sheetId: mainSheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
                        cell: {
                            userEnteredFormat: {
                                numberFormat: { type: "TEXT" },
                                horizontalAlignment: "CENTER",
                            }
                        },
                        fields: "userEnteredFormat(numberFormat,horizontalAlignment)"
                    }
                },
                // Freeze header row
                {
                    updateSheetProperties: {
                        properties: { sheetId: mainSheetId, gridProperties: { frozenRowCount: 1 } },
                        fields: "gridProperties.frozenRowCount"
                    }
                },
                // Alternating row banding (new unique ID)
                {
                    addBanding: {
                        bandedRange: {
                            bandedRangeId: 7777,
                            range: { sheetId: mainSheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 16 },
                            rowProperties: {
                                firstBandColor: { red: 1, green: 1, blue: 1 },
                                secondBandColor: { red: 0.937, green: 0.945, blue: 1.0 },
                            }
                        }
                    }
                },
                // Auto-resize columns
                {
                    autoResizeDimensions: {
                        dimensions: { sheetId: mainSheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 16 }
                    }
                },
            ]
        }
    });

    // ── Step 4: Conditional formatting for สถานะ (column K = index 10) ──
    console.log("4️⃣  Adding conditional formatting (สถานะ + ระดับ + หมวดหมู่)...");
    const DARK = { red: 0.102, green: 0.102, blue: 0.18 }; // near-black for light backgrounds
    const WHITE = { red: 1, green: 1, blue: 1 };

    const statusRules = [
        { text: "เปิด",             bg: { red: 1.0, green: 0.82, blue: 0.82 }, fg: DARK },
        { text: "กำลังดำเนินการ",    bg: { red: 1.0, green: 0.92, blue: 0.6  }, fg: DARK },
        { text: "รอข้อมูลเพิ่มเติม", bg: { red: 0.95, green: 0.85, blue: 1.0 }, fg: DARK },
        { text: "แก้ไขแล้ว",        bg: { red: 0.72, green: 0.95, blue: 0.72 }, fg: DARK },
        { text: "ปิดเคส",           bg: { red: 0.60, green: 0.90, blue: 0.60 }, fg: DARK },
    ];
    const priorityRules = [
        { text: "วิกฤต", bg: { red: 0.9, green: 0.3, blue: 0.3 }, fg: WHITE },
        { text: "สูง",   bg: { red: 1.0, green: 0.75, blue: 0.3 }, fg: DARK },
    ];

    // หมวดหมู่ colors (column I = index 8)
    const categoryRules = [
        { text: "ปัญหาทั่วไป",        bg: { red: 0.85, green: 0.92, blue: 1.0  }, fg: DARK },
        { text: "ปัญหาทางเทคนิค",      bg: { red: 1.0,  green: 0.88, blue: 0.75 }, fg: DARK },
        { text: "ระบบล่ม",            bg: { red: 1.0,  green: 0.75, blue: 0.75 }, fg: DARK },
        { text: "ซอฟต์แวร์",           bg: { red: 0.75, green: 0.92, blue: 1.0  }, fg: DARK },
        { text: "ฮาร์ดแวร์",           bg: { red: 0.92, green: 1.0,  blue: 0.80 }, fg: DARK },
        { text: "เครือข่าย",          bg: { red: 1.0,  green: 0.92, blue: 0.75 }, fg: DARK },
        { text: "บัญชีผู้ใช้",         bg: { red: 0.88, green: 0.88, blue: 1.0  }, fg: DARK },
        { text: "ฐานข้อมูล",          bg: { red: 0.75, green: 1.0,  blue: 0.90 }, fg: DARK },
        { text: "รายงาน",             bg: { red: 1.0,  green: 0.95, blue: 0.70 }, fg: DARK },
        { text: "อื่นๆ",              bg: { red: 0.93, green: 0.93, blue: 0.93 }, fg: DARK },
    ];


    const conditionalRequests: any[] = [];

    // สถานะ rules (col K)
    statusRules.forEach(rule => {
        conditionalRequests.push({
            addConditionalFormatRule: {
                rule: {
                    ranges: [{ sheetId: mainSheetId, startRowIndex: 1, startColumnIndex: 10, endColumnIndex: 11 }],
                    booleanRule: {
                        condition: { type: "TEXT_CONTAINS", values: [{ userEnteredValue: rule.text }] },
                        format: {
                            backgroundColor: rule.bg,
                            textFormat: { bold: true, foregroundColor: rule.fg }
                        }
                    }
                },
                index: 0
            }
        });
    });

    // ระดับ rules (col J)
    priorityRules.forEach(rule => {
        conditionalRequests.push({
            addConditionalFormatRule: {
                rule: {
                    ranges: [{ sheetId: mainSheetId, startRowIndex: 1, startColumnIndex: 9, endColumnIndex: 10 }],
                    booleanRule: {
                        condition: { type: "TEXT_CONTAINS", values: [{ userEnteredValue: rule.text }] },
                        format: {
                            backgroundColor: rule.bg,
                            textFormat: { bold: true, foregroundColor: rule.fg }
                        }
                    }
                },
                index: 0
            }
        });
    });

    // หมวดหมู่ rules (col I)
    categoryRules.forEach(rule => {
        conditionalRequests.push({
            addConditionalFormatRule: {
                rule: {
                    ranges: [{ sheetId: mainSheetId, startRowIndex: 1, startColumnIndex: 8, endColumnIndex: 9 }],
                    booleanRule: {
                        condition: { type: "TEXT_CONTAINS", values: [{ userEnteredValue: rule.text }] },
                        format: { 
                            backgroundColor: rule.bg,
                            textFormat: { foregroundColor: rule.fg }
                        }
                    }
                },
                index: 0
            }
        });
    });

    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: conditionalRequests } });

    // ── Step 5: Format Attachments sheet ──
    if (attachSheet && attachSheetId !== undefined) {
        console.log(`5️⃣  Formatting Attachments sheet "${attachTitle}"...`);

        // ensure header text
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${attachTitle}'!A1:E1`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [["วันที่/เวลา", "Case ID", "เบอร์โทร", "ชื่อไฟล์", "URL/ลิงก์ไฟล์"]] },
        });

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    // Header row: same navy style
                    {
                        repeatCell: {
                            range: { sheetId: attachSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.122, green: 0.188, blue: 0.412 },
                                    textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 },
                                    horizontalAlignment: "CENTER",
                                }
                            },
                            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
                        }
                    },
                    // Set text color to dark for all data rows
                    {
                        repeatCell: {
                            range: { sheetId: attachSheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
                            cell: {
                                userEnteredFormat: {
                                    textFormat: { foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 } } // near black
                                }
                            },
                            fields: "userEnteredFormat(textFormat.foregroundColor)"
                        }
                    },
                    // Date column A: text centered
                    {
                        repeatCell: {
                            range: { sheetId: attachSheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
                            cell: {
                                userEnteredFormat: {
                                    numberFormat: { type: "TEXT" },
                                    horizontalAlignment: "CENTER",
                                }
                            },
                            fields: "userEnteredFormat(numberFormat,horizontalAlignment)"
                        }
                    },
                    // Freeze header
                    {
                        updateSheetProperties: {
                            properties: { sheetId: attachSheetId, gridProperties: { frozenRowCount: 1 } },
                            fields: "gridProperties.frozenRowCount"
                        }
                    },
                    // Alternating rows
                    {
                        addBanding: {
                            bandedRange: {
                                bandedRangeId: 7778,
                                range: { sheetId: attachSheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
                                rowProperties: {
                                    firstBandColor: { red: 1, green: 1, blue: 1 },
                                    secondBandColor: { red: 0.937, green: 0.945, blue: 1.0 },
                                }
                            }
                        }
                    },
                    { autoResizeDimensions: { dimensions: { sheetId: attachSheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 5 } } },
                ]
            }
        });
    }

    console.log("\n✅ Done!");
    console.log("   เคสที่แจ้งมา: header navy, frozen, banding, สถานะ/ระดับ/หมวดหมู่ colors, date text format");
    if (attachSheet) console.log("   Attachments: header navy, frozen, banding, date text format");
}

main().catch(console.error);
