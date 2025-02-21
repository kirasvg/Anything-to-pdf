// Type definitions for html-pdf-node
// Filename: types/html-pdf-node/index.d.ts

declare module 'html-pdf-node' {
    /**
     * Options for PDF generation
     */
    export interface PDFOptions {
      /** Page format: A0-A9, B0-B10, C0-C10, RA0-RA4, SRA0-SRA4, Executive, Legal, Letter, Tabloid or custom size (width x height in mm) */
      format?: string;
      /** Page width in pixels, overrides format */
      width?: number | string;
      /** Page height in pixels, overrides format */
      height?: number | string;
      /** Scale of the webpage rendering, defaults to 1 */
      scale?: number;
      /** Print background graphics, defaults to false */
      printBackground?: boolean;
      /** Landscape orientation, defaults to false */
      landscape?: boolean;
      /** Margins in pixels (top, right, bottom, left) */
      margin?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
      };
      /** Page ranges to print, e.g., '1-5, 8, 11-13' */
      pageRanges?: string;
      /** Header template HTML string or file path */
      headerTemplate?: string;
      /** Footer template HTML string or file path */
      footerTemplate?: string;
      /** Paper path for saving PDF */
      path?: string;
      /** Prefer page size as defined by CSS, defaults to false */
      preferCSSPageSize?: boolean;
      /** PDF metadata */
      displayHeaderFooter?: boolean;
      /** Timeout in milliseconds, defaults to 30000 */
      timeout?: number;
    }
  
    /**
     * HTML content to convert to PDF
     */
    export interface FileContent {
      /** HTML content as string */
      content?: string;
      /** URL to load HTML from */
      url?: string;
    }
  
    /**
     * Generate PDF from HTML content or URL
     * @param file - HTML content or URL
     * @param options - PDF generation options
     * @returns Promise resolving to a Buffer containing the PDF data
     */
    export function generatePdf(
      file: FileContent,
      options?: PDFOptions
    ): Promise<Buffer>;
  }