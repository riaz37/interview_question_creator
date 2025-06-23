export interface Question {
  question: string;
  answer: string;
  rationale: string;
  // These fields are added by the frontend for UI purposes
  difficulty?: string;
  type?: string;
  isGeneratingAnswer?: boolean;
}

export interface QuestionFormData {
  numQuestions: number;
  difficulty: string;
  questionType: string;
}

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export interface QuestionFormProps {
  onSubmit: (numQuestions: number, difficulty: string, questionType: string) => void;
  isGenerating: boolean;
}

export interface QuestionListProps {
  questions: Question[];
}
