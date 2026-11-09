 const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: 'gemini-embedding-001',
  apiKey: process.env.GOOGLE_API_KEY,
});

module.exports = embeddings;
