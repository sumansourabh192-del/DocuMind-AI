const supabase = require('./supabaseClient');
const embeddings = require('./embeddings');

const vectorStore = {
  async addDocuments(documents) {
    if (!documents.length) return;

    const texts = documents.map((doc) => doc.pageContent);
    const vectors = await embeddings.embedDocuments(texts);

    const rows = documents.map((doc, index) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      embedding: vectors[index]
    }));

    const { error } = await supabase
      .from('documents')
      .insert(rows);

    if (error) throw error;
  },

  async similaritySearch(query, limit = 3, filter = {}) {
    const queryEmbedding = await embeddings.embedQuery(query);

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: limit,
      filter
    });

    if (error) throw error;

    return (data || []).map((item) => ({
      pageContent: item.content,
      metadata: item.metadata
    }));
  },

  async delete({ filter = {} } = {}) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .contains('metadata', filter);

    if (error) throw error;
  }
};

module.exports = vectorStore;
