export async function convertToPdf(file: File | string) {
  try {
    const formData = new FormData();
    
    if (typeof file === 'string') {
      // Handle URL
      formData.append('url', file);
    } else {
      // Handle File
      formData.append('file', file);
    }

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to convert file');
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create object URL
    const url = window.URL.createObjectURL(pdfBlob);
    
    // Return the URL for later use
    return url;
  } catch (error) {
    console.error('Conversion error:', error);
    throw error;
  }
}
