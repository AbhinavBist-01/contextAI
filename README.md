# ⚡ ContextAI — Autonomous HyDE RAG Research Engine

[![Live App](https://img.shields.io/badge/Live%20Demo-contextai--nrdg.onrender.com-emerald?style=for-the-badge&logo=render)](https://contextai-nrdg.onrender.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v24-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0-000000?style=flat&logo=express)](https://expressjs.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-VectorDB-000000?style=flat)](https://www.pinecone.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat&logo=clerk)](https://clerk.com/)

**ContextAI** is a high-performance, NotebookLM-inspired RAG (Retrieval-Augmented Generation) application that transforms multi-format documents—including PDFs, Web documentation URLs, YouTube videos, and VTT files—into an interactive, isolated AI knowledge vault.

🔗 **Live Application URL**: [https://contextai-nrdg.onrender.com/](https://contextai-nrdg.onrender.com/)

---

## 🌟 Key Features

- **🌐 Multi-Source Knowledge Ingestion**: Upload PDFs, Web documentation URLs, VTT subtitles, or YouTube video links (with automatic transcript & timestamp extraction).
- **🧠 Dual-Query HyDE RAG Engine**: Combines direct question embeddings with Hypothetical Document Embeddings (HyDE) for maximum semantic retrieval precision.
- **🔒 Multi-Tenant Namespace Isolation**: Leverages Clerk authentication IDs to partition vector namespaces in Pinecone, ensuring complete data security between users.
- **🔍 1-Line Citation Accordion Inspector**: Single-line collapsible source cards showing exact text quote snippets, page hints, and video timestamp deep-links (`?t=XXs`).
- **📥 One-Click Export & Utilities**: Export full chat transcripts as Markdown (`.md`), copy assistant answers with 1-click, and clear history on demand.
- **🎨 State-of-the-Art Dark UI**: Designed with Aceternity UI components (`FileUpload`, `PlaceholdersAndVanishInput`, `LampContainer`), Framer Motion, and TailwindCSS.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS + Custom Glassmorphism System
- **UI Components**: Aceternity UI (`FileUpload`, `PlaceholdersAndVanishInput`, `LampContainer`, `GlowingEffect`)
- **Icons & Animations**: Lucide React + Framer Motion
- **Authentication**: Clerk React SDK (`@clerk/clerk-react`)

### **Backend & Services**
- **Server**: Node.js + Express 5
- **Database**: Neon Serverless PostgreSQL + Drizzle ORM
- **Vector Database**: Pinecone (`text-embedding-3-small`, 1024 dimensions)
- **AI Models**: OpenAI `gpt-4o-mini` (HyDE & Grounded Answer Synthesis)
- **Parser Tools**: `pdf-parse` v2, `youtube-transcript`, `youtubei.js`, `cheerio`

---

## 🔄 RAG Pipeline Flowchart

```mermaid
flowchart TD
    subgraph Ingestion ["1. Multi-Source Document Ingestion"]
        A1["PDF Document"] --> P1["pdf-parse Engine"]
        A2["VTT Subtitle File"] --> P2["VTT Parser"]
        A3["Website URL"] --> P3["Cheerio Web Scraper"]
        A4["YouTube Link"] --> P4["YouTube Transcript Scraper"]
    end

    subgraph Processing ["2. Chunking & Vectorization"]
        P1 & P2 & P3 & P4 --> C1["Recursive Character Text Splitter"]
        C1 --> E1["OpenAI text-embedding-3-small (1024 Dim)"]
        E1 --> V1["Pinecone Vector Store (Namespaced by User ID)"]
    end

    subgraph Retrieval ["3. Dual HyDE Semantic Retrieval"]
        U1["User Question"] --> H1["HyDE Generator (Hypothetical Answer)"]
        U1 --> V2["Direct Query Vector"]
        H1 --> V3["HyDE Answer Vector"]
        V2 & V3 --> S1["Pinecone Dual Query Search (Top 8 Chunks)"]
        S1 --> D1["Deduplicated Relevant Chunks"]
    end

    subgraph Synthesis ["4. Grounded Synthesis & Citation Inspector"]
        D1 --> G1["OpenAI gpt-4o-mini Grounded Synthesis"]
        G1 --> Out1["AI Response + Inline Source Badges"]
        Out1 --> Insp1["1-Line Citation Accordion (Text Quote / Video Timestamp Link)"]
    end
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the project root with the following keys:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Pinecone Vector Database
PINECONE_API_KEY=pcsk_your_pinecone_api_key
PINECONE_INDEX_NAME=contextai

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

---

## 🚀 Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/AbhinavBist-01/contextAI.git
cd contextAI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Database Migrations
```bash
npm run db:generate
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev:all
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`

---

## 🌐 Production Deployment (Render)

1. **Push to GitHub**: Ensure your code is pushed to your repository.
2. **Create Render Web Service**:
   - Go to [Render.com](https://render.com) -> **New Web Service**.
   - Connect your repository.
3. **Configure Build Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables**: Add `DATABASE_URL`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
5. **Live App URL**: [https://contextai-nrdg.onrender.com/](https://contextai-nrdg.onrender.com/)

---

## 📜 License

Distributed under the ISC License. See `LICENSE` for more information.
