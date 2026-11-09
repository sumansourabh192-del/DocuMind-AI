const express = require('express');
const chatbot = require('../utils/chatbot');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { question, source } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        message: 'Please provide a valid question.'
      });
    }

    if (!source || typeof source !== 'string') {
      return res.status(400).json({
        message: 'Please upload and select a PDF first.'
      });
    }

    const result = await chatbot(question.trim(), source);

    res.status(200).json(result);

  } catch (error) {
    console.error('Chat API error:', error.message);

    res.status(500).json({
      message: 'Failed to generate an answer.',
      error: error.message
    });
  }
});

module.exports = router;
