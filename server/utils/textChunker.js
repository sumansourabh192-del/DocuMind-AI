const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

const splitText = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitText(text);

  return chunks;
};

module.exports = splitText;