 const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const extractPDFText = async (filePath) => {
  const data = new Uint8Array(fs.readFileSync(filePath));

  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
};

module.exports = extractPDFText;