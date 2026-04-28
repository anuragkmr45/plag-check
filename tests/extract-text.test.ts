import { describe, expect, it } from "vitest";
import {
  UnsupportedExtractionTypeError,
  extractTextFromDocx,
  extractTextFromFile,
  extractTextFromPdf,
  extractTextFromTxt
} from "../src/features/extraction/extract-text";

describe("text extraction", () => {
  it("extracts text from TXT buffers", () => {
    const result = extractTextFromTxt(
      Buffer.from("\uFEFFHello TXT world\nSecond line", "utf8")
    );

    expect(result).toEqual({
      charCount: 27,
      extractionMethod: "txt",
      rawText: "Hello TXT world\nSecond line",
      wordCount: 5
    });
  });

  it("extracts text from DOCX buffers", async () => {
    const result = await extractTextFromDocx(
      createMinimalDocx("Hello DOCX world")
    );

    expect(result.extractionMethod).toBe("docx");
    expect(result.rawText).toContain("Hello DOCX world");
    expect(result.wordCount).toBe(3);
    expect(result.charCount).toBeGreaterThanOrEqual("Hello DOCX world".length);
  });

  it("extracts text from PDF buffers", async () => {
    const result = await extractTextFromPdf(createMinimalPdf("Hello PDF world"));

    expect(result.extractionMethod).toBe("pdf");
    expect(result.rawText).toContain("Hello PDF world");
    expect(result.wordCount).toBeGreaterThanOrEqual(3);
    expect(result.charCount).toBeGreaterThanOrEqual("Hello PDF world".length);
  });

  it("dispatches extraction by MIME type or filename", async () => {
    await expect(
      extractTextFromFile({
        buffer: Buffer.from("Plain text"),
        mimeType: "text/plain; charset=utf-8"
      })
    ).resolves.toMatchObject({
      extractionMethod: "txt",
      rawText: "Plain text"
    });

    await expect(
      extractTextFromFile({
        buffer: createMinimalDocx("Filename DOCX text"),
        filename: "paper.docx"
      })
    ).resolves.toMatchObject({
      extractionMethod: "docx"
    });

    await expect(
      extractTextFromFile({
        buffer: Buffer.from("legacy doc"),
        filename: "paper.doc"
      })
    ).rejects.toThrow(UnsupportedExtractionTypeError);
  });
});

function createMinimalDocx(text: string): Buffer {
  return createStoredZip([
    {
      path: "[Content_Types].xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    },
    {
      path: "_rels/.rels",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    },
    {
      path: "word/document.xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>
  </w:body>
</w:document>`
    }
  ]);
}

function createStoredZip(entries: { path: string; text: string }[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const data = Buffer.from(entry.text, "utf8");
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30 + name.length);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    name.copy(localHeader, 30);

    localParts.push(localHeader, data);

    const centralHeader = Buffer.alloc(46 + name.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    name.copy(centralHeader, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function createMinimalPdf(text: string): Buffer {
  const stream = `BT
/F1 18 Tf
72 720 Td
(${escapePdfText(text)}) Tj
ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>
stream
${stream}
endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
${offsets.map((value) => `${String(value).padStart(10, "0")} 00000 n `).join("\n")}
trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  return Buffer.from(pdf, "latin1");
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ byte) & 0xff]!;
  }

  return (crc ^ 0xffffffff) >>> 0;
}

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapePdfText(text: string): string {
  return text.replace(/[()\\]/g, "\\$&");
}
