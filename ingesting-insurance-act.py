import os
import sys
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
# Use modern embeddings import (community variant is deprecated)
try:
    from langchain_openai import OpenAIEmbeddings
except ImportError:
    from langchain_community.embeddings import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
import pinecone

# Load environment variables from .env file
load_dotenv()


def fail(msg: str, code: int = 1):
    print(f"ERROR: {msg}")
    sys.exit(code)


def get_env(name: str, default: str | None = None) -> str:
    v = os.getenv(name, default if default is not None else None)
    if v is None:
        fail(f"Environment variable '{name}' is required but not set.")
    return v


if __name__ == "__main__":
    print("Ingesting...")

    # Choose the source file
    source_path = "InsuranceAct.pdf"  # or "mediumblog1.txt"

    # Load file (PDF or text) with proper handling
    if source_path.lower().endswith(".pdf"):
        loader = PyPDFLoader(source_path)
        documents = loader.load()  # one Document per page
    else:
        try:
            loader = TextLoader(source_path, encoding="utf-8")
            documents = loader.load()
        except UnicodeDecodeError:
            loader = TextLoader(source_path, encoding="latin1")
            documents = loader.load()

    print(f"Loaded {len(documents)} document(s)")

    # text_splitter = CharacterTextSplitter(
    #     chunk_size=1000,
    #     chunk_overlap=0,
    #     separator="\n",
    #     length_function=len,
    # )

    # texts = text_splitter.split_documents(documents)
    # print(f"Created {len(texts)} chunks")

    splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
    )
    splits = splitter.split_documents(documents)
    print(f"Created {len(splits)} chunks")

    # Create embeddings (requires OPENAI_API_KEY in environment)
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        fail("OPENAI_API_KEY not set.")

    # Use text-embedding-3-large with default 3072 dimensions to match Pinecone index
    embeddings = OpenAIEmbeddings(
        openai_api_key=openai_api_key,
        model="text-embedding-3-large"
    )

    # Pinecone settings
    pinecone_api_key = get_env("PINECONE_API_KEY2")
    index_name = get_env("INDEX_NAME2")

    # Fetch index metadata to verify dimension BEFORE ingestion
    try:
        from pinecone import Pinecone as _PineClient
        pc = _PineClient(api_key=pinecone_api_key)
        described = pc.describe_index(index_name)
        index_dimension = described.dimension
    except Exception as e:
        fail(f"Unable to describe Pinecone index '{index_name}': {e}")

    # Probe embedding dimension by embedding a tiny sample
    try:
        test_vec = embeddings.embed_query("dimension probe")
        embedding_dim = len(test_vec)
    except Exception as e:
        fail(f"Failed to generate test embedding: {e}")

    if embedding_dim != index_dimension:
        print(f"""
Dimension mismatch detected.
--------------------------------------------------------------------------------
Your Pinecone index '{index_name}' has dimension {index_dimension}, but the embeddings
you're generating have dimension {embedding_dim}.

Choose ONE of the following fixes:
1. Recreate Pinecone index with dimension {embedding_dim} (recommended if starting fresh):
   - Delete existing index in Pinecone console (or CLI) and create new index:
     Name: {index_name}
     Dimension: {embedding_dim}
     Metric: cosine (or same as before)

2. Switch to an embedding model that outputs {index_dimension} dimensions.
   - For OpenAI, 1024-dim models are legacy (e.g., text-embedding-ada-002 is 1536). If you truly need 1024,
     create a new Pinecone index with 1536 instead OR adopt a 1024-dim model provider.

3. (Alternative) Create a NEW index (e.g., '{index_name}-1536') with the correct dimension and set INDEX_NAME to it.

After adjusting, rerun:  python ingestion.py
--------------------------------------------------------------------------------
Aborting without ingesting to prevent partial / corrupt data.
""")
        sys.exit(2)

    print(f"Index dimension {index_dimension} matches embedding dimension {embedding_dim}. Proceeding with ingestion...")

    print("Ingesting...")
    try:
        PineconeVectorStore.from_documents(
            splits,
            embedding=embeddings,
            index_name=index_name
        )
        print(f"Successfully ingested {len(splits)} chunks into Pinecone index '{index_name}'")
    except Exception as e:
        fail(f"Error creating Pinecone vector store: {e}")

