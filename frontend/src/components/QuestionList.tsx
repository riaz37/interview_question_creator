import { useState, useCallback, useEffect } from 'react';
import type { Question } from '../types';
import { toast } from 'react-hot-toast';

// Extend the base Question type with UI-specific fields
type QuestionWithAnswer = Question & {
  isGeneratingAnswer?: boolean;
};

interface QuestionListProps {
  questions: Question[];
  context?: string; // The original document text for context
  onUpdateQuestion?: (index: number, question: Question) => void;
}

const QuestionList = ({ 
  questions: initialQuestions, 
  context = '',
  onUpdateQuestion 
}: QuestionListProps) => {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Sync component state with initialQuestions prop
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      // Map the initial questions to include the QuestionWithAnswer fields
      const mappedQuestions = initialQuestions.map(q => ({
        ...q,
        isGeneratingAnswer: false
      }));
      setQuestions(mappedQuestions);
    } else {
      setQuestions([]);
    }
  }, [initialQuestions]);

  const generateAnswer = useCallback(async (index: number, questionText: string) => {
    if (!context) {
      toast.error('No context available to generate answer');
      return;
    }

    // Update the question state to show loading
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      isGeneratingAnswer: true
    };
    setQuestions(updatedQuestions);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/generate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText,
          context: context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate answer');
      }

      const data = await response.json();
      
      // Update the question with the generated answer
      const updatedQuestion = {
        ...updatedQuestions[index],
        answer: data.answer,
        rationale: data.rationale,
        isGeneratingAnswer: false
      };
      
      updatedQuestions[index] = updatedQuestion;
      setQuestions(updatedQuestions);
      
      // Notify parent component if needed
      if (onUpdateQuestion) {
        onUpdateQuestion(index, updatedQuestion);
      }
      
      toast.success('Answer generated successfully!');
    } catch (error) {
      console.error('Error generating answer:', error);
      toast.error('Failed to generate answer. Please try again.');
      
      // Reset loading state
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        isGeneratingAnswer: false
      };
      setQuestions(updatedQuestions);
    }
  }, [context, onUpdateQuestion, questions]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Ensure all questions have required fields with defaults
  const safeQuestions = questions.map(q => ({
    question: q.question || 'No question text',
    answer: q.answer || 'No answer available',
    rationale: q.rationale || 'No rationale available',
    difficulty: q.difficulty || 'medium',
    type: q.type || 'comprehension',
    isGeneratingAnswer: q.isGeneratingAnswer || false
  }));
  
  if (questions.length === 0) {
    return <p className="text-gray-500">No questions generated yet.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {safeQuestions.map((question, index) => (
          <div key={index} className="question-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {question.type}
                  </span>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {index + 1}. {question.question}
                </h3>
              </div>
              <button
                onClick={() => copyToClipboard(question.question, index)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                title="Copy question"
              >
                {copiedIndex === index ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="mt-4">
              {!question.answer ? (
                <button
                  onClick={() => generateAnswer(index, question.question || '')}
                  disabled={question.isGeneratingAnswer}
                  className="btn btn-secondary flex items-center text-sm"
                >
                  {question.isGeneratingAnswer ? (
                    <>
                      <span className="loading-spinner mr-2"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Answer
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleExpand(index)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {expandedIndex === index ? 'Hide answer' : 'Show answer'}
                    <svg
                      className={`ml-1 w-4 h-4 transform transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedIndex === index && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium mb-2">Answer:</h4>
                      <div className="prose max-w-none mb-4" 
                        dangerouslySetInnerHTML={{ __html: question.answer.replace(/\n/g, '<br />') }} 
                      />
                      {question.rationale && (
                        <>
                          <h4 className="font-medium mb-2">Rationale:</h4>
                          <div className="prose max-w-none text-sm text-gray-600" 
                            dangerouslySetInnerHTML={{ __html: question.rationale.replace(/\n/g, '<br />') }} 
                          />
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;
