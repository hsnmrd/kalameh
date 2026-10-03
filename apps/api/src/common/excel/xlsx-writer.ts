import * as zlib from 'node:zlib';

export function buildXlsxBuffer(
  headers: string[],
  rows: string[][],
  isRtl = true,
  sheetTitle?: string,
): Buffer {
  const sharedStrings: string[] = [];
  const getSharedStringIndex = (text: string): number => {
    let idx = sharedStrings.indexOf(text);
    if (idx === -1) {
      sharedStrings.push(text);
      idx = sharedStrings.length - 1;
    }
    return idx;
  };

  let sheetDataXml = '<row r="1" ht="28" customHeight="1">';
  headers.forEach((h, colIdx) => {
    const colLetter = String.fromCharCode(65 + colIdx);
    const strIdx = getSharedStringIndex(h);
    sheetDataXml += `<c r="${colLetter}1" t="s" s="1"><v>${strIdx}</v></c>`;
  });
  sheetDataXml += '</row>';

  rows.forEach((row, rowIdx) => {
    const rNum = rowIdx + 2;
    sheetDataXml += `<row r="${rNum}">`;
    row.forEach((cellVal, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx);
      if (cellVal !== undefined && cellVal !== '') {
        const strIdx = getSharedStringIndex(cellVal);
        sheetDataXml += `<c r="${colLetter}${rNum}" t="s"><v>${strIdx}</v></c>`;
      }
    });
    sheetDataXml += '</row>';
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews>
  <sheetView tabSelected="1" workbookViewId="0" rightToLeft="${isRtl ? '1' : '0'}"/>
</sheetViews>
<sheetFormatPr defaultRowHeight="20"/>
<cols>
  ${headers
    .map(
      (_, idx) =>
        `<col min="${idx + 1}" max="${idx + 1}" width="22" customWidth="1"/>`,
    )
    .join('\n    ')}
</cols>
<sheetData>
  ${sheetDataXml}
</sheetData>
</worksheet>`;

  let sstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">`;
  sharedStrings.forEach((str) => {
    const escaped = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    sstXml += `<si><t>${escaped}</t></si>`;
  });
  sstXml += '</sst>';

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const effectiveSheetTitle = sheetTitle || (isRtl ? 'کاربران' : 'Users');

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
  <sheet name="${effectiveSheetTitle}" sheetId="1" r:id="rId1"/>
</sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
  <font><name val="Vazirmatn"/><sz val="11"/></font>
  <font><b/><name val="Vazirmatn"/><sz val="11"/><color rgb="FFFFFFFF"/></font>
</fonts>
<fills count="3">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF3B82F6"/></patternFill></fill>
</fills>
<borders count="1">
  <border><left/><right/><top/><bottom/></border>
</borders>
<cellStyleXfs count="1">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
</cellStyleXfs>
<cellXfs count="2">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
    <alignment horizontal="center" vertical="center"/>
  </xf>
</cellXfs>
</styleSheet>`;

  return createZipPackage({
    '[Content_Types].xml': contentTypesXml,
    '_rels/.rels': rootRelsXml,
    'xl/workbook.xml': workbookXml,
    'xl/_rels/workbook.xml.rels': workbookRelsXml,
    'xl/worksheets/sheet1.xml': sheetXml,
    'xl/sharedStrings.xml': sstXml,
    'xl/styles.xml': stylesXml,
  });
}

/**
 * Minimal ZIP archive creator for OpenXML spreadsheet packages using standard zlib.
 */
function createZipPackage(files: Record<string, string>): Buffer {
  const entries: {
    name: string;
    compressedData: Buffer;
    crc: number;
    uncompressedSize: number;
    offset: number;
  }[] = [];

  const localHeaders: Buffer[] = [];
  let currentOffset = 0;

  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content, 'utf-8');
    const crc = computeCrc32(data);
    const compressedData = zlib.deflateRawSync(data);

    const nameBuffer = Buffer.from(name, 'utf-8');
    const localHeader = Buffer.alloc(30 + nameBuffer.length);

    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4); // Version needed (2.0)
    localHeader.writeUInt16LE(0, 6); // General purpose bit flag
    localHeader.writeUInt16LE(8, 8); // Compression method (deflate)
    localHeader.writeUInt16LE(0, 10); // Last mod time
    localHeader.writeUInt16LE(0, 12); // Last mod date
    localHeader.writeUInt32LE(crc, 14); // CRC32
    localHeader.writeUInt32LE(compressedData.length, 18); // Compressed size
    localHeader.writeUInt32LE(data.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // File name length
    localHeader.writeUInt16LE(0, 28); // Extra field length
    nameBuffer.copy(localHeader, 30);

    entries.push({
      name,
      compressedData,
      crc,
      uncompressedSize: data.length,
      offset: currentOffset,
    });

    localHeaders.push(localHeader, compressedData);
    currentOffset += localHeader.length + compressedData.length;
  }

  const centralDirectoryStart = currentOffset;
  const centralHeaders: Buffer[] = [];

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, 'utf-8');
    const cdHeader = Buffer.alloc(46 + nameBuffer.length);

    cdHeader.writeUInt32LE(0x02014b50, 0); // Signature
    cdHeader.writeUInt16LE(20, 4); // Version made by
    cdHeader.writeUInt16LE(20, 6); // Version needed
    cdHeader.writeUInt16LE(0, 8); // General purpose bit flag
    cdHeader.writeUInt16LE(8, 10); // Compression method
    cdHeader.writeUInt16LE(0, 12); // Last mod time
    cdHeader.writeUInt16LE(0, 14); // Last mod date
    cdHeader.writeUInt32LE(entry.crc, 16); // CRC-32
    cdHeader.writeUInt32LE(entry.compressedData.length, 20); // Compressed size
    cdHeader.writeUInt32LE(entry.uncompressedSize, 24); // Uncompressed size
    cdHeader.writeUInt16LE(nameBuffer.length, 28); // File name length
    cdHeader.writeUInt16LE(0, 30); // Extra field length
    cdHeader.writeUInt16LE(0, 32); // File comment length
    cdHeader.writeUInt16LE(0, 34); // Disk number start
    cdHeader.writeUInt16LE(0, 36); // Internal file attributes
    cdHeader.writeUInt32LE(0, 38); // External file attributes
    cdHeader.writeUInt32LE(entry.offset, 42); // Relative offset of local header
    nameBuffer.copy(cdHeader, 46);

    centralHeaders.push(cdHeader);
    currentOffset += cdHeader.length;
  }

  const centralDirectorySize = currentOffset - centralDirectoryStart;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk with start of CD
  eocd.writeUInt16LE(entries.length, 8); // Total entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // Total entries
  eocd.writeUInt32LE(centralDirectorySize, 12); // Size of CD
  eocd.writeUInt32LE(centralDirectoryStart, 16); // Offset of start of CD
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

function computeCrc32(buf: Buffer): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();
