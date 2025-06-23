from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
import os

# Initialize the language model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.4,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    convert_system_message_to_human=True  # Convert system messages to human messages
)

def generate_answer(question: str, context: str) -> Dict[str, str]:
    """
    Generate an answer for a specific question based on the given context.
    
    Args:
        question: The question to answer
        context: The context or content to use for generating the answer
        
    Returns:
        Dictionary containing the answer and rationale
    """
    # Format the prompt as a single message since we're using convert_system_message_to_human
    prompt = f"""
    You are an expert at providing high-quality answers to interview questions.
    Provide a clear, concise, and accurate answer to the given question based on the provided context.
    Include a brief rationale explaining how you arrived at the answer.
    
    Context:
    {context}
    
    Question: {question}
    
    Please provide a detailed answer and a brief rationale.
    Format your response as:
    Answer: [your answer here]
    Rationale: [your rationale here]
    """.strip()
    
    try:
        # Invoke the LLM with the prompt
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content
        
        # Parse the response
        answer = ""
        rationale = ""
        
        if "Answer:" in content and "Rationale:" in content:
            parts = content.split("Rationale:")
            answer = parts[0].replace("Answer:", "").strip()
            rationale = parts[1].strip()
        else:
            # Fallback if the format isn't followed
            answer = content.strip()
            rationale = "Generated answer based on the context."
            
        return {
            "answer": answer,
            "rationale": rationale
        }
        
    except Exception as e:
        logger.error(f"Error generating answer: {str(e)}")
        return {
            "answer": "Error generating answer. Please try again.",
            "rationale": "An error occurred while generating the answer."
        }


def generate_questions(
    text: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    question_type: str = "comprehension"
) -> List[Dict[str, str]]:
    """
    Generate interview questions from the given text.
    
    Args:
        text: Text content to generate questions from
        num_questions: Number of questions to generate
        difficulty: Difficulty level (easy, medium, hard)
        question_type: Type of questions (comprehension, analysis, application, etc.)
        
    Returns:
        List of dictionaries containing question, rationale, and answer
    """
    # Define difficulty and question type descriptions
    difficulty_levels = {
        'easy': 'basic understanding and recall of the material',
        'medium': 'application of concepts and analysis',
        'hard': 'evaluation, synthesis, and critical thinking'
    }
    
    question_types = {
        'comprehension': 'test understanding of the material',
        'analysis': 'require breaking down information into components',
        'application': 'apply knowledge to new situations',
        'evaluation': 'make judgments based on criteria and standards'
    }
    
    # Create a single prompt with all instructions
    prompt = f"""
    You are an expert at generating high-quality, context-specific interview questions.
    
    TASK: Generate {num_questions} interview questions based EXACTLY on the following text. Each question MUST be directly tied to specific content from the text.
    
    TEXT TO ANALYZE:
    {text}
    
    INSTRUCTIONS:
    1. DIFFICULTY: {difficulty.capitalize()} - {difficulty_levels[difficulty]}
    2. QUESTION TYPE: {question_type.capitalize()} - {question_types[question_type]}
    
    FOR EACH QUESTION:
    - Formulate a question that can ONLY be answered by someone who has read and understood the text
    - Include specific references to people, events, or concepts mentioned in the text
    - For the answer, directly quote relevant parts of the text to support your response
    
    EXAMPLE (for reference):
    Question: "How does the author describe the impact of [specific concept] in the text?"
    Rationale: "This question tests the reader's comprehension of a key concept and its significance as presented in the text."
    Answer: "The author describes the impact as 'quote from text' (paragraph X), emphasizing [specific detail]. This is further supported by their mention of 'another quote' (paragraph Y)."
    
    YOUR RESPONSE MUST BE VALID JSON with this exact structure:
    [
      {{
        "question": "Your specific question about the text",
        "rationale": "Why this question is relevant to the text",
        "answer": "Detailed answer with direct quotes from the text"
      }}
    ]
    
    CRITICAL REQUIREMENTS:
    1. Questions MUST be answerable using ONLY the provided text
    2. Answers MUST include direct quotes from the text
    3. Each question should focus on a different aspect of the text
    4. Do NOT generate generic questions that could apply to any text
    5. Maintain the exact JSON structure - no markdown formatting
    """.strip()
    
    # Generate questions using the language model
    response = llm.invoke([HumanMessage(content=prompt)])
    
    # Parse the response
    try:
        import json
        import re
        import logging
        
        # Clean the response content
        content = response.content.strip()
        logging.info(f"Raw response content: {content[:200]}...")  # Log first 200 chars
        
        # Handle cases where the response might be wrapped in markdown code blocks
        if '```json' in content:
            content = re.sub(r'```(?:json)?\s*', '', content)  # Handle both ```json and ```
            content = re.sub(r'\s*```', '', content)
        
        # Clean up any remaining markdown or unwanted characters
        content = content.strip('`').strip()
        
        # Try to parse as JSON
        try:
            questions = json.loads(content)
        except json.JSONDecodeError as e:
            logging.warning(f"Initial JSON parse failed: {e}")
            # Try to extract JSON array or object
            match = re.search(r'(\[\s*\{.*\}\s*\])', content, re.DOTALL)
            if match:
                try:
                    questions = json.loads(match.group(1))
                    logging.info("Successfully extracted JSON from markdown")
                except json.JSONDecodeError as e2:
                    logging.warning(f"Failed to parse extracted JSON: {e2}")
                    # Try to fix common JSON issues
                    fixed_content = re.sub(r',\s*\n\s*}', '\n}', content)  # Remove trailing commas
                    fixed_content = re.sub(r',\s*\n\s*]', '\n]', fixed_content)  # Remove trailing commas in arrays
                    try:
                        questions = json.loads(fixed_content)
                        logging.info("Successfully parsed after fixing JSON")
                    except json.JSONDecodeError as e3:
                        logging.error(f"Failed to parse even after fixing: {e3}")
                        raise ValueError(f"Could not parse response as JSON: {e3}")
            else:
                raise ValueError(f"Could not find JSON array/object in response: {content[:200]}...")
        
        # Ensure we have a list
        if not isinstance(questions, list):
            questions = [questions]
            
        # Validate each question has required fields
        valid_questions = []
        for q in questions:
            if all(key in q for key in ['question', 'rationale', 'answer']):
                valid_questions.append({
                    'question': str(q['question']).strip(),
                    'rationale': str(q['rationale']).strip(),
                    'answer': str(q['answer']).strip()
                })
        
        if not valid_questions:
            raise ValueError("No valid questions were generated")
            
        return valid_questions
        
    except Exception as e:
        # Detailed error logging
        error_details = f"{type(e).__name__}: {str(e)}"
        logging.error(f"Error generating questions: {error_details}")
        if hasattr(response, 'content'):
            logging.error(f"Response content: {response.content[:500]}...")  # Log first 500 chars
        
        # Return a helpful error message
        return [{
            "question": "Error: Could not generate questions. The response format was unexpected.",
            "rationale": "Please try again with different parameters or check the input text.",
            "answer": f"Technical details: {error_details}"
        }]
