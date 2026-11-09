const { Chroma } = require('@langchain/community/vectorstores/chroma');
const embeddings = require('./embeddings');

const vectorStore = new Chroma(embeddings, {
  collectionName: 'pdf_documents',
  url: 'http://localhost:8000',
});

module.exports = vectorStore;
