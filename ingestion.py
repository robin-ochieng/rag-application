import os
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

# Load environment variables from .env file
load_dotenv()


if __name__ == "__main__":
    print("Ingesting...")

    # Load text file with proper encoding
    try:
        loader = TextLoader("mediumblog1.txt", encoding="utf-8")
        documents = loader.load()
    except UnicodeDecodeError:
        # Fallback to different encoding if UTF-8 fails
        loader = TextLoader("mediumblog1.txt", encoding="latin1")
        documents = loader.load()

    print(f"Loaded {len(documents)} document(s)")

    # # Split documents into chunks
    # splitter = CharacterTextSplitter(
    #     separator="\n",
    #     chunk_size=800,
    #     chunk_overlap=100,
    #     length_function=len,
    # )
    # splits = splitter.split_documents(documents)
    # print(f"Created {len(splits)} chunks")

    # # Create embeddings (requires OPENAI_API_KEY in environment)
    # embeddings = OpenAIEmbeddings()

    # # Setup Pinecone vector store
    # pinecone_api_key = os.getenv("PINECONE_API_KEY")
    # pinecone_index = os.getenv("PINECONE_INDEX_NAME", "langchain-index")
    
    # if not pinecone_api_key:
    #     print("Warning: PINECONE_API_KEY not found in environment variables")
    #     print("Please set PINECONE_API_KEY before running vector store ingestion")
    #     exit(1)

    # try:
    #     # Create vector store from documents
    #     vectorstore = PineconeVectorStore.from_documents(
    #         splits,
    #         embedding=embeddings,
    #         index_name=pinecone_index,
    #     )
    #     print(f"Successfully ingested {len(splits)} chunks into Pinecone index '{pinecone_index}'")
    # except Exception as e:
    #     print(f"Error creating Pinecone vector store: {e}")
    #     print("Make sure your Pinecone index exists and environment variables are correctly set")