'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType, Link, Download, Sparkles, FileText, Plus } from 'lucide-react';
import { convertToPdf } from './utils/convert';
import { motion } from 'framer-motion';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [convertedFiles, setConvertedFiles] = useState<string[]>([]);

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup any existing object URLs
      convertedFiles.forEach(url => {
        window.URL.revokeObjectURL(url);
      });
    };
  }, [convertedFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.rtf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/html': ['.html'],
    },
  });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    setConverting(true);
    try {
      await convertToPdf(url);
      setUrl('');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to convert URL');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = useCallback((url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `converted-${Date.now()}-${index + 1}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  const handleConversion = async () => {
    if (files.length === 0 && !url) {
      setError('Please upload files or enter a URL');
      return;
    }
    setConverting(true);
    setError('');
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('file', file);
      });
      if (url) {
        formData.append('url', url);
      }

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert');
      }

      const pdfBlob = await response.blob();
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      setConvertedFiles(prev => [...prev, pdfUrl]);
      setFiles([]);
      setUrl('');
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert files');
    } finally {
      setConverting(false);
    }
  };

  return (
    <motion.main
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8"
      role="main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-full mb-4"
          >
            <Sparkles className="h-6 w-6 text-purple-600" />
          </motion.div>
          <header className="mb-8">
            <h1 
              className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600" 
              itemProp="headline"
            >
              Convert Any File to PDF Online
            </h1>
            <p className="text-center text-gray-600 mt-4 text-lg" itemProp="description">
              Transform your files into professional PDFs instantly ✨
            </p>
          </header>
        </div>
        {/* File Upload Section */}
        <section className="mb-8" aria-label="File upload area">
          <div {...getRootProps()} className="relative">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                ${isDragActive ? 'border-purple-500 bg-purple-50 shadow-lg' : 'border-gray-300 hover:border-purple-400 hover:shadow-md'}`}
              role="button"
              aria-label="Drag and drop files or click to select"
            >
              <input {...getInputProps()} />
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: isDragActive ? 1.1 : 1,
                    rotate: isDragActive ? 180 : 0
                  }}
                  transition={{ type: 'spring' }}
                >
                  <Upload className="mx-auto h-16 w-16 text-purple-500 mb-4" />
                </motion.div>
                {isDragActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-purple-100 animate-ping" />
                  </motion.div>
                )}
              </div>
              <p className="text-lg text-gray-600">
                {isDragActive
                  ? 'Drop the files here...'
                  : 'Drag & drop files here, or click to select files'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: .txt, .rtf, .jpg, .png, .gif, .bmp, .docx, .odt, .pptx, .xlsx, .html
              </p>
            </motion.div>
          </div>
        </section>

        {/* File List */}
        {files.length > 0 && (
          <section className="mb-8" aria-label="Selected files">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileType className="h-5 w-5 text-purple-500" />
                Selected Files ({files.length})
              </h2>
              <motion.ul 
                className="space-y-3"
                role="list"
              >
                {files.map((file, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileType className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <svg
                        className="h-5 w-5 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </section>
        )}

        {/* URL Input Section */}
        <section className="mb-8" aria-label="URL input area">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Link className="h-5 w-5 text-purple-500" />
              Add URL
            </h2>
            <form onSubmit={handleUrlSubmit} className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
                placeholder="Enter any webpage URL to convert"
                className="flex-1 px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Webpage URL input"
                disabled={converting}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={converting || !url}
                aria-label="Add URL to conversion list"
              >
                <Plus className="h-5 w-5" />
                Add
              </button>
            </form>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        {/* Convert Button */}
        <section className="mb-8 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConversion}
            disabled={converting || (files.length === 0 && !url)}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all
              ${converting || (files.length === 0 && !url)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg'
              }`}
          >
            {converting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Converting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Convert to PDF
              </span>
            )}
          </motion.button>
        </section>

        {/* Converted Files */}
        {convertedFiles.length > 0 && (
          <section className="mb-8" aria-label="Converted files">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-600">
                <Download className="h-5 w-5" />
                Converted Files
              </h2>
              <motion.ul className="space-y-3">
                {convertedFiles.map((url, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <span className="text-green-700">PDF Document {index + 1}</span>
                    <button
                      onClick={() => handleDownload(url, index)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </section>
        )}
      </motion.div>
    </motion.main>
  );
}
