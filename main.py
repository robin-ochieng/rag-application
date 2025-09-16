import os

from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore

from langchain import hub
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain

load_dotenv()

if __name__ == "__main__":
    print("Retrieving...")

    # Initialize embeddings and LLM
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")

    # Connect to existing Pinecone vector store
    vectorstore = PineconeVectorStore(
        index_name=os.getenv("INDEX_NAME2"),
        embedding=embeddings,
    )

    # Set up retrieval chain
    retrieval_qa_chat_prompt = hub.pull("langchain-ai/retrieval-qa-chat")
    combine_docs_chain = create_stuff_documents_chain(llm=llm, prompt=retrieval_qa_chat_prompt)
    retrieval_chain = create_retrieval_chain(
        retriever=vectorstore.as_retriever(), 
        combine_docs_chain=combine_docs_chain
    )  

    # Query the vector database
    query = "What is the purpose and scope of the Insurance Act?"
    result = retrieval_chain.invoke({"input": query})

    answer = result.get("answer", "")
    sources = result.get("context", [])

    # Build professional Markdown output
    md_lines: list[str] = []
    md_lines.append(f"# Answer\n")
    md_lines.append(f"**Question:** {query}\n")
    md_lines.append("")
    md_lines.append("## Response")
    md_lines.append(answer.strip())
    md_lines.append("")
    md_lines.append("## Sources")
    if not sources:
        md_lines.append("- _No source documents returned._")
    else:
        for i, doc in enumerate(sources, start=1):
            snippet = (doc.page_content or "").strip().replace("\n", " ")
            if len(snippet) > 280:
                snippet = snippet[:277] + "..."
            meta = doc.metadata or {}
            meta_parts = []
            # Prefer common fields if present
            for key in ("source", "file_path", "page", "page_number", "title"):
                if key in meta and meta[key] not in (None, ""):
                    meta_parts.append(f"{key}: {meta[key]}")
            meta_str = f" ({'; '.join(meta_parts)})" if meta_parts else ""
            md_lines.append(f"- {i}. {snippet}{meta_str}")

    print("\n".join(md_lines))