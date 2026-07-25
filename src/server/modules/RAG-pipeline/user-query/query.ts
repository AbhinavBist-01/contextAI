import "dotenv/config";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

// ── Clients ───────────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

// ── Constants ─────────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = "text-embedding-3-small";
const VECTOR_DIMENSION = Number(process.env.VECTOR_DIMENSION) || 1024;
const TOP_K = 5; // number of relevant chunks to retrieve

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QueryOptions {
  userQuery: string;
  userId: string; // Clerk userId — scopes search to user's namespace
  hasSources: boolean; // if false, answer directly from AI without RAG
}

export interface SourceCitation {
  sourceName: string;
  sourceType: string;
  url?: string;
  heading?: string;
  startTime?: string;
  endTime?: string;
  pageHint?: number;
  text: string; // the raw chunk text that was used
}

export interface QueryResult {
  answer: string;
  citations: SourceCitation[];
  usedRAG: boolean; // true if answered from sources, false if answered directly
}

// ── Step 1: HyDE — Generate a Hypothetical Answer ────────────────────────────

/**
 * HyDE (Hypothetical Document Embeddings):
 * Instead of embedding the raw user query (which is short and vague),
 * we ask the LLM to generate a hypothetical 3-5 line answer.
 * This hypothetical answer is richer and closer in embedding space
 * to the actual stored chunks — producing much better semantic matches.
 */
async function generateHyDE(userQuery: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Given a user question, write a concise hypothetical answer of 3-5 lines as if you had access to a relevant document. This answer will be used for semantic search — do not say you don't know, just generate a plausible answer.",
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content?.trim() ?? userQuery;
}

// ── Step 2: Embed query + HyDE answer ────────────────────────────────────────

/**
 * Embeds both the original user query and the HyDE answer,
 * then averages them to get a single combined query vector.
 * This gives the best of both — specificity of the query + richness of HyDE.
 */
async function buildQueryVector(
  userQuery: string,
  hydeAnswer: string,
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    dimensions: VECTOR_DIMENSION,
    input: [userQuery, hydeAnswer],
  });

  const queryVec = response.data[0]!.embedding;
  const hydeVec = response.data[1]!.embedding;

  // Average the two vectors element-wise
  return queryVec.map((val, i) => (val + hydeVec[i]!) / 2);
}

// ── Step 3: Semantic Search in Pinecone ──────────────────────────────────────

async function semanticSearch(
  queryVector: number[],
  userId: string,
): Promise<SourceCitation[]> {
  const namespacedIndex = index.namespace(userId);

  const results = await namespacedIndex.query({
    vector: queryVector,
    topK: TOP_K,
    includeMetadata: true,
  });

  return (results.matches ?? [])
    .filter((match) => match.metadata)
    .map((match) => {
      const m = match.metadata as Record<string, string | number>;
      return {
        sourceName: String(m.sourceName ?? ""),
        sourceType: String(m.sourceType ?? ""),
        ...(m.url ? { url: String(m.url) } : {}),
        ...(m.heading ? { heading: String(m.heading) } : {}),
        ...(m.startTime ? { startTime: String(m.startTime) } : {}),
        ...(m.endTime ? { endTime: String(m.endTime) } : {}),
        ...(m.pageHint ? { pageHint: Number(m.pageHint) } : {}),
        text: String(m.text ?? ""),
      };
    });
}

// ── Step 4: Generate Final Grounded Answer ───────────────────────────────────

async function generateAnswer(
  userQuery: string,
  chunks: SourceCitation[],
): Promise<string> {
  const context = chunks
    .map((c, i) => `[Source ${i + 1} — ${c.sourceName}]:\n${c.text}`)
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are ContextAI, a helpful assistant that answers questions strictly based on the provided source chunks.

Rules:
- Answer only from the context provided below.
- If the context does not contain enough information to answer the question, say: "I couldn't find relevant information in your sources."
- Be concise and specific.
- Reference the source name when citing information (e.g. "According to [source name]...").
- Do NOT make up information outside the provided context.
- Do not include any hate speech, offensive content, or personal opinions.

Context:
${context}`,
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ??
    "Sorry, I could not generate an answer."
  );
}

// ── Step 5: Direct AI Answer (no sources) ────────────────────────────────────

async function generateDirectAnswer(userQuery: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are ContextAI, a helpful AI assistant. The user has not uploaded any sources yet. Answer their question directly and helpfully. Keep your answer concise.",
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
    temperature: 0.5,
    max_tokens: 600,
  });

  return (
    completion.choices[0]?.message?.content?.trim() ??
    "Sorry, I could not generate an answer."
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Full query pipeline:
 *
 * IF user has sources:
 *   userQuery → HyDE answer → embed both → average vector
 *   → Pinecone semantic search (namespaced by userId)
 *   → grounded GPT answer with citations
 *
 * IF no sources:
 *   userQuery → direct GPT answer (no RAG)
 */
export async function runQuery(options: QueryOptions): Promise<QueryResult> {
  const { userQuery, userId, hasSources } = options;

  // No sources uploaded — answer directly from AI
  if (!hasSources) {
    const answer = await generateDirectAnswer(userQuery);
    return { answer, citations: [], usedRAG: false };
  }

  // ── RAG Pipeline ──────────────────────────────────────────────────────────

  // 1. HyDE — generate a hypothetical answer
  const hydeAnswer = await generateHyDE(userQuery);
  console.log(`[query] HyDE answer generated`);

  // 2. Embed both query + HyDE and average
  const queryVector = await buildQueryVector(userQuery, hydeAnswer);
  console.log(`[query] Query vector built`);

  // 3. Semantic search in user's Pinecone namespace
  const citations = await semanticSearch(queryVector, userId);
  console.log(`[query] Retrieved ${citations.length} relevant chunks`);

  // 4. If no relevant chunks found, fall back to direct answer
  if (citations.length === 0) {
    const answer = await generateDirectAnswer(userQuery);
    return { answer, citations: [], usedRAG: false };
  }

  // 5. Generate grounded answer from retrieved chunks
  const answer = await generateAnswer(userQuery, citations);
  console.log(`[query] Answer generated`);

  return { answer, citations, usedRAG: true };
}
