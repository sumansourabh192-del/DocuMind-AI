 
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const extractPDFText = require('../utils/pdfExtractor');
const splitText = require('../utils/textChunker');
const vectorStore = require('../utils/vectorStore');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' &&
    path.extname(file.originalname).toLowerCase() === '.pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Get uploaded PDF documents
router.get('/documents', async (req, res) => {
  try {
    const files = await fs.promises.readdir(uploadsDir);

    const documents = await Promise.all(
      files
        .filter((filename) => filename.toLowerCase().endsWith('.pdf'))
        .map(async (filename) => {
          const filePath = path.join(uploadsDir, filename);
          const stats = await fs.promises.stat(filePath);

          return {
            filename,
            size: stats.size,
            uploadedAt: stats.birthtime
          };
        })
    );

    res.status(200).json({ documents });
  } catch (error) {
    console.error('Document listing error:', error);
    res.status(500).json({ message: 'Failed to retrieve documents.' });
  }
});

// Upload PDF
router.post('/pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Please upload a PDF file.'
      });
    }

    const extractedText = await extractPDFText(req.file.path);

    if (!extractedText.trim()) {
      await fs.promises.unlink(req.file.path);
      return res.status(400).json({
        message: 'No readable text found in this PDF.'
      });
    }

    const chunks = await splitText(extractedText);

    const documents = chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: {
        source: req.file.filename,
        chunkIndex: index
      }
    }));

    await vectorStore.addDocuments(documents);

    res.status(201).json({
      message: 'PDF uploaded and stored successfully!',
      filename: req.file.filename,
      size: req.file.size,
      chunkCount: chunks.length
    });
  } catch (error) {
    console.error('PDF processing error:', error);

    res.status(500).json({
      message: 'PDF processing failed.',
      error: error.message
    });
  }
});

// Delete PDF and its ChromaDB chunks
router.delete('/documents/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    if (
      path.basename(filename) !== filename ||
      path.extname(filename).toLowerCase() !== '.pdf'
    ) {
      return res.status(400).json({
        message: 'Invalid PDF filename.'
      });
    }

    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'PDF document not found.'
      });
    }

    await vectorStore.delete({
      filter: { source: filename }
    });

    await fs.promises.unlink(filePath);

    res.status(200).json({
      message: 'PDF and its stored document chunks deleted successfully.',
      filename
    });
  } catch (error) {
    console.error('PDF deletion error:', error);

    res.status(500).json({
      message: 'Failed to delete PDF.',
      error: error.message
    });
  }
});

module.exports = router;

