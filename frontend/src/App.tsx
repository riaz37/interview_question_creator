import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FileUpload from "./components/FileUpload";
import "./App.css";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const numQuestions = 5;
  const difficulty = 'medium';
  const questionType = 'comprehension';

  const handleFileChange = async (selectedFile: File) => {
    if (file && selectedFile.name === file.name && selectedFile.size === file.size) {
      return; // Same file, no action needed
    }

    setFile(selectedFile);

    try {
      if (selectedFile.type === "application/pdf") {
        toast.success("PDF file selected successfully!");
      } else {
        toast.success("File selected successfully!");
      }
    } catch {
      toast.error("Error processing file");
      setFile(null);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!file) {
      toast.error("Please upload a file first");
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("num_questions", numQuestions.toString());
      formData.append("difficulty", difficulty);
      formData.append("question_type", questionType);

      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to generate questions");
      }

      const data = await response.json();
      if (data.questions) {
        navigate('/questions', { state: { questions: data.questions } });
        toast.success("Questions generated successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error("Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Interview Question Generator
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6 sm:p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Upload Your Document
                </h2>
                <p className="text-gray-500 mb-6">
                  Upload a PDF document to generate interview questions
                </p>

                <FileUpload
                  onFileSelect={handleFileChange}
                  currentFile={file}
                />

                <p className="text-xs text-gray-400 mt-3">
                  Only PDF files are supported (max 10MB)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <span className="mr-2 text-blue-600">📄</span>
                    {file ? file.name : "No file selected"}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      id="numQuestions"
                      min="1"
                      max="20"
                      value={numQuestions}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
                    />
                  </div>

                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      value={difficulty}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      id="questionType"
                      value={questionType}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="comprehension">Comprehension</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={!file || isGenerating}
                    className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white cursor-pointer ${
                      !file || isGenerating
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Questions'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Interview Question Generator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
