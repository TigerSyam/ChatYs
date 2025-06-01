from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import os

class VectorMemory:
    def __init__(self):
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize vector store
        self.vector_store = Chroma(
            persist_directory="./memory_db",
            embedding_function=self.embeddings
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def add_memory(self, message: str, metadata: dict = None):
        """Add a new memory to the vector store"""
        docs = self.text_splitter.split_text(message)
        documents = [Document(page_content=doc, metadata=metadata or {}) for doc in docs]
        self.vector_store.add_documents(documents)
        self.vector_store.persist()

    def get_relevant_memories(self, query: str, k: int = 5):
        """Retrieve relevant memories based on the query"""
        return self.vector_store.similarity_search(query, k=k)

    def clear_memory(self):
        """Clear all memories"""
        self.vector_store.delete_collection()
        self.vector_store = Chroma(
            persist_directory="./memory_db",
            embedding_function=self.embeddings
        )

# Create a singleton instance
vector_memory = VectorMemory() 