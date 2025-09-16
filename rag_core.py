import os
from typing import Dict, List

from dotenv import load_dotenv
from langchain import hub
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import PineconeVectorStore
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain

load_dotenv()


def build_chain():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")

    vectorstore = PineconeVectorStore(
        index_name=os.getenv("INDEX_NAME2"),
        embedding=embeddings,
    )

    retrieval_prompt = hub.pull("langchain-ai/retrieval-qa-chat")
    combine_docs_chain = create_stuff_documents_chain(llm=llm, prompt=retrieval_prompt)
    chain = create_retrieval_chain(
        retriever=vectorstore.as_retriever(),
        combine_docs_chain=combine_docs_chain,
    )
    return chain


CHAIN = build_chain()


def ask(query: str) -> Dict:
    """Run a query through the retrieval chain and return answer + sources."""
    result = CHAIN.invoke({"input": query})
    answer = result.get("answer", "")
    sources: List[Dict] = []
    for doc in result.get("context", []) or []:
        snippet = (doc.page_content or "").strip().replace("\n", " ")
        if len(snippet) > 300:
            snippet = snippet[:297] + "..."
        sources.append({"snippet": snippet, "metadata": doc.metadata or {}})
    return {"answer": answer, "sources": sources}
