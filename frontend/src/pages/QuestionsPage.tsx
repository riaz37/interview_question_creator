import { motion } from "framer-motion";
import { FiArrowLeft, FiDownload } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import QuestionList from "../components/QuestionList";
import type { Question } from "../types";
import { jsPDF } from "jspdf";
import { toast } from "react-hot-toast";
import { useCallback } from "react";

const QuestionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions } = (location.state || {}) as { questions: Question[] };

  const downloadAsPDF = useCallback((questions: Question[]) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(22);
      doc.text('Generated Interview Questions', 20, 20);
      
      // Add generation date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Add questions
      doc.setFontSize(16);
      let yPosition = 50;
      
      questions.forEach((question, index) => {
        // Add question
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${question.question}`, 20, yPosition);
        yPosition += 10;
        
        // Add answer if available
        if (question.answer) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          const answerText = doc.splitTextToSize(`Answer: ${question.answer}`, 170);
          doc.text(answerText, 25, yPosition);
          yPosition += answerText.length * 7 + 5;
        }
        
        // Add some space between questions
        yPosition += 10;
        
        // Add new page if needed
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Generate a unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `interview-questions-${timestamp}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  }, []);

  if (!questions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Questions Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find any questions. Please go back and try generating them again.</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full max-w-xs mx-auto px-6 py-3 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Back to Generator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center cursor-pointer text-blue-600 hover:text-blue-800 mr-6 transition-colors duration-200"
              >
                <FiArrowLeft className="mr-1.5 h-5 w-5" />
                <span className="font-medium">Back to Upload</span>
              </button>
              <div className="hidden sm:block h-6 w-px bg-gray-200 mx-4"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Generated Questions
              </h1>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => downloadAsPDF(questions)}
                className="group flex items-center cursor-pointer px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiDownload className="mr-2.5 h-5 w-5 transition-transform group-hover:translate-y-[-2px]" />
                <span className="font-medium">Download PDF</span>
              </button>
            </div>
          </div>
          <div className="pb-3 flex items-center text-sm text-gray-500">
            <span>Total Questions: <span className="font-medium text-gray-700">{questions.length}</span></span>
            <span className="mx-3">•</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <main className="bg-gray-50 min-h-[calc(100vh-140px)] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <QuestionList 
              questions={questions} 
              context=""
              onUpdateQuestion={(index: number, updatedQuestion: Question) => {
                // Handle question updates if needed
                const updatedQuestions = [...questions];
                updatedQuestions[index] = updatedQuestion;
                // In a real app, you might want to update the state or make an API call
              }}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default QuestionsPage;
