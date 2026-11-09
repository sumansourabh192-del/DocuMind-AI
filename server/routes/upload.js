const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const extractPDFText = require('../utils/pdfExtractor');
const splitText = require('../utils/textChunker');
const vectorStore = require('../utils/vectorStore');
const supabase = require('../utils/supabaseClient');

const router = express.Router();
const bucket = process.env.SUPABASE_STORAGE_BUCKET;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' &&
      path.extname(file.originalname).toLowerCase() === '.pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// List PDFs stored in Supabase Storage
router.get('/documents', async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    const documents = (data || [])
      .filter((file) => file.name.toLowerCase().endsWith('.pdf'))
      .map((file) => ({
        filename: file.name,
        size: file.metadata?.size || 0,
        uploadedAt: file.created_at
      }));

    res.status(200).json({ documents });
  } catch (error) {
    console.error('Document listing error:', error);
    res.status(500).json({ message: 'Failed to retrieve documents.' });
  }
});

// Upload PDF
router.post('/pdf', upload.single('pdf'), async (req, res) => {
  let tempPath;
  let storageUploaded = false;
  let filename;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Please upload a PDF file.'
      });
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    filename = `${Date.now()}-${safeName}`;

    tempPath = path.join(os.tmpdir(), filename);
    await fs.promises.writeFile(tempPath, req.file.buffer);

    const extractedText = await extractPDFText(tempPath);

    if (!extractedText.trim()) {
      return res.status(400).json({
        message: 'No readable text found in this PDF.'
      });
    }

    const chunks = await splitText(extractedText);

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .upload(filename, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (storageError) throw storageError;

    storageUploaded = true;

    const documents = chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: {
        source: filename,
        chunkIndex: index
      }
    }));

    await vectorStore.addDocuments(documents);

    res.status(201).json({
      message: 'PDF uploaded and stored successfully!',
      filename,
      size: req.file.size,
      chunkCount: chunks.length
    });
  } catch (error) {
    console.error('PDF processing error:', error);

    if (storageUploaded && filename) {
      await supabase.storage.from(bucket).remove([filename]);
    }

    res.status(500).json({
      message: 'PDF processing failed.',
      error: error.message
    });
  } finally {
    if (tempPath) {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  }
});

// Delete PDF and its vector chunks
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

    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { search: filename });

    if (listError) throw listError;

    if (!files || !files.some((file) => file.name === filename)) {
      return res.status(404).json({
        message: 'PDF document not found.'
      });
    }

    await vectorStore.delete({
      filter: { source: filename }
    });

    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([filename]);

    if (storageError) throw storageError;

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
