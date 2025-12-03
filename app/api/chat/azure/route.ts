import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatAPIPayload } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"
import AzureOpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import { SearchClient, AzureKeyCredential } from "@azure/search-documents"

export const runtime = "edge"

// interface ChunkDocument {
//   source_file: string
//   chunk_index: number
//   chunk_content: string
// }

type ChunkDocument = Record<string, any>
export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as ChatAPIPayload

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.azure_openai_api_key, "Azure OpenAI")

    const ENDPOINT = profile.azure_openai_endpoint
    const KEY = profile.azure_openai_api_key

    let DEPLOYMENT_ID = ""
    switch (chatSettings.model) {
      case "gpt-3.5-turbo":
        DEPLOYMENT_ID = profile.azure_openai_35_turbo_id || ""
        break
      case "gpt-4-turbo-preview":
        DEPLOYMENT_ID = profile.azure_openai_45_turbo_id || ""
        break
      case "gpt-4-vision-preview":
        DEPLOYMENT_ID = profile.azure_openai_45_vision_id || ""
        break
      default:
        return new Response(JSON.stringify({ message: "Model not found" }), {
          status: 400
        })
    }
    DEPLOYMENT_ID = "gpt-4.1-nano"
    console.log(ENDPOINT, KEY, DEPLOYMENT_ID)
    if (!ENDPOINT || !KEY || !DEPLOYMENT_ID) {
      return new Response(
        JSON.stringify({ message: "Azure resources not found" }),
        {
          status: 400
        }
      )
    }

    const azureOpenai = new OpenAI({
      apiKey: KEY,
      baseURL: `${ENDPOINT}/openai/deployments/${DEPLOYMENT_ID}`,
      defaultQuery: { "api-version": "2023-12-01-preview" },
      defaultHeaders: { "api-key": KEY }
    })

    /*     const EMBEDDING_DEPLOYMENT_ID = process.env.EMBEDDING_DEPLOYMENT_ID

    // Embeddings model (e.g. text-embedding-3-large)
    const embeddingsClient = new OpenAI({
      apiKey: KEY,
      baseURL: `${ENDPOINT}/openai/deployments/${EMBEDDING_DEPLOYMENT_ID}`,
      defaultQuery: { "api-version": "2023-12-01-preview" },
      defaultHeaders: {
        "api-key": process.env.AZURE_SEARCH_SERVICE_ADMIN_KEY
      }
    })

    console.log("messages", messages)

    // const emb = await embeddingsClient.embeddings.create({
    //   model: EMBEDDING_DEPLOYMENT_ID,
    //   input: messages[0].content
    // })
    // console.log("emb ", messages)
    // console.log("emb", typeof emb)
    // console.log("emb", Object.keys(emb))
    // console.log("emb", emb.object)
    // console.log("emb", emb.data)
    // console.log("emb", emb.model)
    // console.log("emb", emb.usage)
    // console.log("emb", emb.length)
    // const queryEmbedding = emb.data[0].embedding
    const queryEmbedding = (
      await embeddingsClient.embeddings.create({
        model: EMBEDDING_DEPLOYMENT_ID,
        input: messages[messages.length - 1].content
      })
    ).data[0].embedding

    console.log("queryEmbedding", queryEmbedding)
    console.log("queryEmbedding", queryEmbedding.length)
    console.log("messages", messages)
    console.log("messages content", messages[messages.length - 1].content)
    console.log(ENDPOINT, KEY, DEPLOYMENT_ID)

    const searchClient = new SearchClient(
      process.env.AZURE_SEARCH_ENDPOINT!, // e.g. https://mysearch.search.windows.net
      process.env.AZURE_SEARCH_INDEX_NAME!, // your index name
      new AzureKeyCredential(process.env.AZURE_SEARCH_SERVICE_ADMIN_KEY!)
    )
    console.log("searchClient", searchClient)

    const vectorQuery = {
      vector: queryEmbedding,
      kNearestNeighbors: 3,
      fields: "vector" // name of the vector field in your index
    }

    const searchResults = await searchClient.search("", {
      vectorQueries: [vectorQuery],
      select: ["source_file", "chunk_index", "chunk_content"]
    })

    let retrievedContext = ""
    for await (const result of searchResults.results) {
      retrievedContext += `
        TITLE: ${result.document.source_file}
        DATE: ${result.document.chunk_index}
        CONTENT:
        ${result.document.chunk_content}

        -----------------------------
        `
    }

    console.log("Retrieved Context:\n", retrievedContext)

    // -------------------------------
    // 3. BUILD RAG CHAT MESSAGES
    // -------------------------------
    const MAX_CONTEXT_TOKENS = 900 // adjust
    let truncatedContext = retrievedContext
      .split(/\s+/)
      .slice(0, MAX_CONTEXT_TOKENS)
      .join(" ")

    const ragMessages = [
      {
        role: "system",
        content: `
    You are a RAG assistant. Use the retrieved context to answer the question. 
    If the context is insufficient, say so. 
    Today is 11/30/2025. User Instructions: You are a friendly, helpful AI assistant.
    Retrieved context:
    ${truncatedContext}
    `
      },
      { role: "user", content: messages[messages.length - 1].content } // latest user message
    ]

    console.log("**messages***", messages)
    const response = await azureOpenai.chat.completions.create({
      model: DEPLOYMENT_ID as ChatCompletionCreateParamsBase["model"],
      messages: ragMessages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens: chatSettings.model === "gpt-4-vision-preview" ? 4096 : 4096, // TODO: Fix
      stream: true
    })
 */

    // const response1 = await azureOpenai.chat.completions.create({
    //   model: DEPLOYMENT_ID as ChatCompletionCreateParamsBase["model"],
    //   messages: messages as ChatCompletionCreateParamsBase["messages"],
    //   temperature: chatSettings.temperature,
    //   max_tokens: chatSettings.model === "gpt-4-vision-preview" ? 4096 : 4096, // TODO: Fix
    //   stream: true
    // })

    // console.log("response1\n\n\n", response1)
    // const stream1 = OpenAIStream(response1)
    // console.log("stream1\n\n\n", stream1)

    // return new StreamingTextResponse(stream1)

    console.log(
      "\nprocess.env.AZURE_OPENAI_API_KEY",
      process.env.AZURE_OPENAI_API_KEY
    )
    console.log(
      "\n`${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_ID}`",
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_ID}`
    )
    console.log(
      "`${process.env.AZURE_OPENAI_ENDPOINT}/openai/v1`",
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/v1`
    )
    // const client = new OpenAI({
    //   apiKey: process.env.AZURE_OPENAI_API_KEY,
    //   baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}` + "v"
    // })

    const client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/v1/` // your Azure endpoint
    })

    const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-large",
      input: messages[messages.length - 1].content
    })
    console.log("embeddingResponse", embeddingResponse)
    const queryEmbedding = embeddingResponse.data[0].embedding
    console.log("embeddingResponse", queryEmbedding.length)

    const searchClient = new SearchClient(
      process.env.AZURE_SEARCH_ENDPOINT!, // e.g. https://mysearch.search.windows.net
      process.env.AZURE_SEARCH_INDEX_NAME!, // your index name
      new AzureKeyCredential(process.env.AZURE_SEARCH_SERVICE_ADMIN_KEY!)
    )
    console.log("searchClient", searchClient)

    const vectorQuery = {
      vector: queryEmbedding,
      kNearestNeighbors: 3,
      fields: "vector" // name of the vector field in your index
    }

    const searchResults = await searchClient.search("", {
      vectorQueries: [vectorQuery],
      select: ["source_file", "chunk_index", "chunk_content"]
    } as any)

    let retrievedContext = ""

    for await (const result of searchResults.results) {
      // Cast result.document once
      const doc = result.document as {
        source_file: string
        chunk_index: number
        chunk_content: string
      }

      // Use the typed 'doc' variable
      retrievedContext += `source_file: ${doc.source_file}\nCONTENT: ${doc.chunk_content}\n---\n`
    }

    console.log("retrievedContext", retrievedContext)
    const MAX_CONTEXT_TOKENS = 2000 // adjust
    let truncatedContext = retrievedContext
      .split(/\s+/)
      .slice(0, MAX_CONTEXT_TOKENS)
      .join(" ")

    const ragMessages = [
      {
        role: "system",
        content: `You are a helpful assistant. Use the following retrieved context to answer:\n${truncatedContext}`
      },
      { role: "user", content: messages[messages.length - 1].content }
    ]

    const response = await client.chat.completions.create({
      model: DEPLOYMENT_ID,
      messages: ragMessages as ChatCompletionCreateParamsBase["messages"],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true
    })
    // Build the request payload
    // const completion = await client.chat.completions.create({
    //   messages: [
    //     { role: "developer", content: "You talk like a pirate." },
    //     { role: "user", content: "Can you help me?" }
    //   ],
    //   model: "gpt-4.1-nano",
    //   stream: true
    // })

    // console.log("completion\n\n\n", completion)
    // console.log("completion\n\n\n", completion.choices[0])
    // return
    // console.log("\nclient", client)
    // const response = await client.chat.completions.create({
    //   model: DEPLOYMENT_ID,
    //   messages: [
    //     {
    //       role: "system",
    //       content: "You are a helpful assistant for an AI learner."
    //     },
    //     {
    //       role: "user",
    //       content:
    //         "The earliest guidance from the Courts on record retention is?"
    //     }
    //   ] as const, // <-- fixes role typing
    //   // @ts-ignore

    //   stream: true
    // })

    console.log("response", response)
    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    console.log("error", error)
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
