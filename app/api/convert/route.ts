import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';
import * as htmlPdf from 'html-pdf-node';
import sharp from 'sharp';

async function convertImageToPdf(buffer: ArrayBuffer, fileType: string): Promise<Uint8Array> {
  try {
    const imageBuffer = Buffer.from(buffer);
    
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }

    const A4_WIDTH = 794;
    const A4_HEIGHT = 1123;
    const MARGIN = 40;

    const aspectRatio = metadata.width / metadata.height;
    let targetWidth = A4_WIDTH - (2 * MARGIN);
    let targetHeight = targetWidth / aspectRatio;

    if (targetHeight > (A4_HEIGHT - (2 * MARGIN))) {
      targetHeight = A4_HEIGHT - (2 * MARGIN);
      targetWidth = targetHeight * aspectRatio;
    }

    const resizedImage = await image
      .resize(Math.round(targetWidth), Math.round(targetHeight), {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

    const imageEmbed = fileType === 'image/png'
      ? await pdfDoc.embedPng(resizedImage)
      : await pdfDoc.embedJpg(resizedImage);

    const x = (A4_WIDTH - targetWidth) / 2;
    const y = (A4_HEIGHT - targetHeight) / 2;

    page.drawImage(imageEmbed, {
      x,
      y,
      width: targetWidth,
      height: targetHeight
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error in convertImageToPdf:', error);
    throw error;
  }
}

async function convertFileToPdf(file: File): Promise<Uint8Array> {
  const fileBuffer = await file.arrayBuffer();
  const fileType = file.type;

  try {
    switch (fileType) {
      case 'text/plain':
      case 'text/rtf': {
        const pdfDoc = await PDFDocument.create();
        const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const page = pdfDoc.addPage([595.276, 841.890]); // A4 size in points
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const margin = 50;
        const maxWidth = page.getWidth() - 2 * margin;

        const text = new TextDecoder().decode(fileBuffer);
        const words = text.split(/\s+/);
        let line = '';
        let y = page.getHeight() - margin;
        let currentPage = page;

        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const width = timesRomanFont.widthOfTextAtSize(testLine, fontSize);

          if (width > maxWidth) {
            currentPage.drawText(line, {
              x: margin,
              y,
              size: fontSize,
              font: timesRomanFont,
              color: rgb(0, 0, 0),
            });
            
            y -= lineHeight;
            line = word;

            if (y < margin) {
              currentPage = pdfDoc.addPage([595.276, 841.890]);
              y = currentPage.getHeight() - margin;
            }
          } else {
            line = testLine;
          }
        }

        if (line) {
          currentPage.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font: timesRomanFont,
            color: rgb(0, 0, 0),
          });
        }

        return await pdfDoc.save();
      }

      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/webp':
      case 'image/bmp': {
        return await convertImageToPdf(fileBuffer, fileType);
      }

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        // Fix: use the correct mammoth input format
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer: fileBuffer });
        const options = { format: 'A4' };
        const file = { content: html };
        
        // Fix: Properly handle the Buffer type returned by generatePdf
        const pdfBuffer = await htmlPdf.generatePdf(file, options) as Buffer;
        
        // Convert Buffer to Uint8Array
        return new Uint8Array(pdfBuffer.buffer.slice(
          pdfBuffer.byteOffset,
          pdfBuffer.byteOffset + pdfBuffer.byteLength
        ));
      }

      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error converting file to PDF:', error);
    throw error;
  }
}

async function convertUrlToPdf(url: string): Promise<Uint8Array> {
  try {
    const options = { format: 'A4' };
    const file = { url };
    
    // Fix: Properly handle the Buffer type
    const pdfBuffer = await htmlPdf.generatePdf(file, options) as Buffer;
    
    // Convert Buffer to Uint8Array
    return new Uint8Array(pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ));
  } catch (error) {
    console.error('Error converting URL to PDF:', error);
    throw error;
  }
}

async function mergePdfs(pdfByteArrays: Uint8Array[]): Promise<Uint8Array> {
  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfBytes of pdfByteArrays) {
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    return await mergedPdf.save();
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('file') as File[];
    const url = formData.get('url') as string;

    if (files.length === 0 && !url) {
      return NextResponse.json(
        { error: 'No files or URL provided' },
        { status: 400 }
      );
    }

    const pdfPromises: Promise<Uint8Array>[] = [];

    if (url) {
      pdfPromises.push(convertUrlToPdf(url));
    }

    for (const file of files) {
      pdfPromises.push(convertFileToPdf(file));
    }

    const pdfByteArrays = await Promise.all(pdfPromises);
    const finalPdfBytes = await mergePdfs(pdfByteArrays);

    return new NextResponse(finalPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=converted.pdf',
      },
    });
  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert to PDF' },
      { status: 500 }
    );
  }
}