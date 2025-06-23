import { useState } from 'react';
import type { FormEvent } from 'react';
import type { QuestionFormProps } from '../types';

const QuestionForm = ({ onSubmit, isGenerating }: QuestionFormProps) => {
  const [formData, setFormData] = useState({
    numQuestions: 5,
    difficulty: 'medium',
    questionType: 'comprehension',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(
      formData.numQuestions,
      formData.difficulty,
      formData.questionType
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numQuestions' ? parseInt(value, 10) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="numQuestions" className="label">
            Number of Questions
          </label>
          <input
            type="number"
            id="numQuestions"
            name="numQuestions"
            min="1"
            max="20"
            value={formData.numQuestions}
            onChange={handleChange}
            className="input"
            disabled={isGenerating}
          />
        </div>

        <div>
          <label htmlFor="difficulty" className="label">
            Difficulty Level
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="input"
            disabled={isGenerating}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        <div>
          <label htmlFor="questionType" className="label">
            Question Type
          </label>
          <select
            id="questionType"
            name="questionType"
            value={formData.questionType}
            onChange={handleChange}
            className="input"
            disabled={isGenerating}
          >
            <option value="comprehension">Comprehension</option>
            <option value="analysis">Analysis</option>
            <option value="application">Application</option>
            <option value="evaluation">Evaluation</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary flex items-center"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="loading-spinner"></span>
              Generating...
            </>
          ) : (
            'Generate Questions'
          )}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm;
