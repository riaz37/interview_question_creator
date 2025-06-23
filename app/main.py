from fastapi import FastAPI, Request, Form, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from pathlib import Path
import shutil
import magic
from fastapi import status
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_FILE_TYPES = {
    'application/pdf': 'pdf'
}
ALLOWED_EXTENSIONS = {'pdf'}

from .core.question_generator import generate_questions, generate_answer
from .core.document_processor import process_document

app = FastAPI(title="Interview Question Generator")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

class Question(BaseModel):
    question: str
    rationale: str
    answer: str

class QuestionSet(BaseModel):
    questions: List[Question]

class AnswerRequest(BaseModel):
    question: str
    context: str

class AnswerResponse(BaseModel):
    answer: str
    rationale: str

@app.get("/")
async def home():
    return {"message": "Interview Question Generator API is running"}

def validate_file(file: UploadFile) -> None:
    """Validate the uploaded file to ensure it's a valid PDF."""
    # Check file size
    file.file.seek(0, 2)  # Move to the end of the file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset file pointer
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE/1024/1024}MB"
        )
    
    # Get file extension
    ext = (file.filename.split('.')[-1].lower() if '.' in file.filename else '').lower()
    
    # Only allow PDF files
    if ext != 'pdf':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Verify it's actually a PDF by checking the header
    try:
        header = file.file.read(4)
        file.file.seek(0)  # Reset file pointer
        
        if header != b'%PDF':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file: Missing PDF header"
            )
            
    except Exception as e:
        logger.error(f"Error validating PDF file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error validating PDF file"
        )

@app.post("/generate-answer", response_model=AnswerResponse)
async def generate_answer_endpoint(answer_request: AnswerRequest):
    """
    Generate an answer for a specific question based on the provided context.
    """
    try:
        result = generate_answer(
            question=answer_request.question,
            context=answer_request.context
        )
        return result
    except Exception as e:
        logger.error(f"Error in generate_answer_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate answer"
        )

@app.post("/generate", response_model=QuestionSet)
async def generate(
    file: UploadFile = File(...),
    num_questions: int = Form(5, ge=1, le=20),
    difficulty: str = Form("medium"),
    question_type: str = Form("comprehension")
):
    # Validate input parameters
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid difficulty level. Choose from: easy, medium, hard"
        )
    
    if question_type not in ["comprehension", "analysis", "application", "evaluation"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid question type. Choose from: comprehension, analysis, application, evaluation"
        )
    
    # Validate file
    validate_file(file)
    
    # Create a secure filename
    file_ext = file.filename.split('.')[-1].lower()
    import uuid
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    try:
        # Save uploaded file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        try:
            # Process document
            text = process_document(file_path)
            
            # Generate questions
            questions = generate_questions(
                text=text,
                num_questions=num_questions,
                difficulty=difficulty,
                question_type=question_type
            )
            
            return {"questions": questions}
            
        except Exception as e:
            logger.error(f"Error generating questions: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating questions: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
    finally:
        # Clean up uploaded file
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.error(f"Error deleting file {file_path}: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
