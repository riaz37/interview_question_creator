from pathlib import Path
from typing import Union, Optional
import logging
from langchain.document_loaders import (
    PyPDFLoader,
    TextLoader,
    Docx2txtLoader,
    UnstructuredFileLoader,
    UnstructuredWordDocumentLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

def process_document(file_path: Union[str, Path], chunk_size: int = 1000, chunk_overlap: int = 100) -> str:
    """
    Process a document and return its content as text.
    
    Args:
        file_path: Path to the document file
        chunk_size: Size of text chunks
        chunk_overlap: Overlap between chunks
        
    Returns:
        str: Processed text content
        
    Raises:
        ValueError: If the file type is unsupported or there's an error processing the file
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
        
    file_extension = file_path.suffix.lower()
    logger.info(f"Processing file: {file_path} with extension: {file_extension}")
    
    try:
        # Try specific loaders first
        if file_extension == '.pdf':
            loader = PyPDFLoader(str(file_path))
        elif file_extension == '.txt':
            loader = TextLoader(str(file_path))
        elif file_extension in ['.docx', '.doc', '.docm', '.dotx', '.dotm']:
            try:
                # First try the specialized DOCX loader
                loader = Docx2txtLoader(str(file_path))
            except Exception as e:
                logger.warning(f"Error with Docx2txtLoader, falling back to UnstructuredWordDocumentLoader: {str(e)}")
                loader = UnstructuredWordDocumentLoader(str(file_path))
        else:
            # Fallback to unstructured loader for other supported types
            loader = UnstructuredFileLoader(str(file_path))
        
        # Load and split document
        logger.info(f"Loading document with {loader.__class__.__name__}")
        documents = loader.load()
        
        if not documents or not any(doc.page_content.strip() for doc in documents):
            raise ValueError("Document appears to be empty or could not be parsed")
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
        
        chunks = text_splitter.split_documents(documents)
        
        # Combine chunks into single text
        text = "\n\n".join([chunk.page_content.strip() for chunk in chunks if chunk.page_content.strip()])
        
        if not text.strip():
            raise ValueError("No readable content found in the document")
            
        logger.info(f"Successfully processed document. Extracted {len(chunks)} chunks.")
        return text
        
    except Exception as e:
        logger.error(f"Error processing document {file_path}: {str(e)}", exc_info=True)
        raise ValueError(f"Error processing document: {str(e)}")
