 
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const searchPDF = require('./search');

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-3.6-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});

const chatbot = async (question, source) => {
  const results = await searchPDF(question, source);

  if (!results.length) {
    return {
      answer: 'I could not find relevant information in this PDF.',
      sources: []
    };
  }

  const context = results
    .map((item) => `[Chunk ${item.chunkIndex}]\n${item.content}`)
    .join('\n\n');

  const prompt = `
You are an AI assistant that answers questions using uploaded PDF documents.

Use only the provided context.
If the answer is unavailable, clearly say so.
Do not invent facts.

PDF Context:
${context}

User Question:
${question}

Answer:
`;

  const response = await model.invoke(prompt);

  return {
    answer: response.content,
    sources: results.map((item) => ({
      filename: item.source,
      chunkIndex: item.chunkIndex
    }))
  };
};

module.exports = chatbot;


