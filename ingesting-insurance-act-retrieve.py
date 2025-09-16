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
    llm = ChatOpenAI(temperature=0, model="gpt-4")

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
    query = "What is mentioned in the insurance act about Policies under Sickness Insurance Scheme?"
    result = retrieval_chain.invoke({"input": query})

    print("Answer:")
    print(result["answer"])
    print("\nSource documents used:")
    for i, doc in enumerate(result["context"]):
        print(f"{i+1}. {doc.page_content[:200]}...")