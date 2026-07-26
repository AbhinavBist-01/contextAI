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
 * Embeds both the user query and HyDE answer into separate 1024-dim vectors.
 */
async function buildQueryVectors(
  userQuery: string,
  hydeAnswer: string,
): Promise<{ queryVector: number[]; hydeVector: number[] }> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    dimensions: VECTOR_DIMENSION,
    input: [userQuery, hydeAnswer],
  });

  return {
    queryVector: response.data[0]!.embedding,
    hydeVector: response.data[1]!.embedding,
  };
}

// ── Step 3: Dual Semantic Search in Pinecone ─────────────────────────────────

async function semanticSearch(
  queryVector: number[],
  hydeVector: number[],
  userId: string,
): Promise<SourceCitation[]> {
  const namespacedIndex = index.namespace(userId);

  // Run searches in parallel: one for direct query, one for HyDE
  const [directResults, hydeResults] = await Promise.all([
    namespacedIndex.query({
      vector: queryVector,
      topK: 6,
      includeMetadata: true,
    }),
    namespacedIndex.query({
      vector: hydeVector,
      topK: 6,
      includeMetadata: true,
    }),
  ]);

  const combinedMatches = [
    ...(directResults.matches ?? []),
    ...(hydeResults.matches ?? []),
  ];

  // Deduplicate matches based on metadata text / id
  const seenTexts = new Set<string>();
  const citations: SourceCitation[] = [];

  for (const match of combinedMatches) {
    if (!match.metadata) continue;
    const m = match.metadata as Record<string, string | number>;
    const text = String(m.text ?? "").trim();
    if (!text || seenTexts.has(text)) continue;

    seenTexts.add(text);
    citations.push({
      sourceName: String(m.sourceName ?? ""),
      sourceType: String(m.sourceType ?? ""),
      ...(m.url ? { url: String(m.url) } : {}),
      ...(m.heading ? { heading: String(m.heading) } : {}),
      ...(m.startTime ? { startTime: String(m.startTime) } : {}),
      ...(m.endTime ? { endTime: String(m.endTime) } : {}),
      ...(m.pageHint ? { pageHint: Number(m.pageHint) } : {}),
      text,
    });

    if (citations.length >= 8) break; // Limit to top 8 distinct chunks
  }

  return citations;
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
        content: `You are ContextAI, an expert AI research assistant that synthesizes answers strictly based on the user's uploaded sources.

Guidelines:
- Provide a clear, accurate, and comprehensive answer using the context provided below.
- If the user asks for a summary, overview, key concepts, or general explanation, synthesize the main topics from the provided context chunks.
- Always cite the source name when introducing information (e.g., "According to [source name]...").
- Do NOT invent facts or include information that is unsupported by the context chunks.
- If the context chunks contain NO information related to the question whatsoever, state: "I couldn't find relevant information in your sources."

Context:
${context}`,
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
    temperature: 0.3,
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
 *   userQuery → HyDE answer → embed both
 *   → Dual Pinecone semantic search (direct query + HyDE vector)
 *   → Deduplicate top 8 chunks → grounded GPT answer with citations
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

  // 2. Embed both query + HyDE
  const { queryVector, hydeVector } = await buildQueryVectors(userQuery, hydeAnswer);
  console.log(`[query] Query vectors built`);

  // 3. Dual semantic search in user's Pinecone namespace
  const citations = await semanticSearch(queryVector, hydeVector, userId);
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
