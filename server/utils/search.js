const vectorStore = require('./vectorStore');

const searchPDF = async (question, source) => {
  if (!source) {
    throw new Error('A PDF source is required for document-specific search.');
  }

  const results = await vectorStore.similaritySearch(
    question,
    3,
    { source }
  );

  return results.map((doc) => ({
    content: doc.pageContent,
    source: doc.metadata.source,
    chunkIndex: doc.metadata.chunkIndex
  }));
};

module.exports = searchPDF;
