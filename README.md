# Anything to PDF Converter

A Next.js web application that allows users to convert various file formats into PDF documents.

## Features

- Convert multiple file formats to PDF:
  - Text files (.txt, .rtf)
  - Image files (.jpg, .png, .gif, .bmp)
  - Document files (.docx, .odt, .pptx, .xlsx)
  - HTML files (.html)
  - Web page URLs
- Drag and drop file upload
- Multiple file conversion
- Web URL to PDF conversion
- Modern and responsive UI
- Real-time conversion status
- Automatic file download after conversion

## Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anything-to-pdfs
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Upload Files:
   - Drag and drop files into the upload area
   - Click the upload area to select files from your computer
   - Supported formats: .txt, .rtf, .jpg, .png, .gif, .bmp, .docx, .odt, .pptx, .xlsx, .html

2. Convert Web Pages:
   - Enter a valid URL in the input field
   - Click the link icon or press Enter to convert

3. Convert Files:
   - After uploading files or entering a URL, click the "Convert to PDF" button
   - Wait for the conversion to complete
   - The converted PDF will automatically download

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [mammoth](https://github.com/mwilliamson/mammoth.js) - DOCX to HTML conversion
- [html-pdf-node](https://www.npmjs.com/package/html-pdf-node) - HTML to PDF conversion
- [react-dropzone](https://react-dropzone.js.org/) - File upload handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
