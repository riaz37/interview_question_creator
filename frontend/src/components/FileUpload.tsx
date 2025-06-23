import { useCallback, useState, useRef, useEffect } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import type { FileUploadProps } from '../types';
import { toast } from 'react-hot-toast';

const FileUpload = ({ onFileSelect, disabled = false, currentFile }: FileUploadProps & { currentFile: File | null }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update filename when currentFile changes
  useEffect(() => {
    if (currentFile) {
      setFileName(currentFile.name);
    } else {
      setFileName(null);
    }
  }, [currentFile]);

  const validateFile = (file: File): { isValid: boolean; message?: string } => {
    // Only allow PDF files
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = fileExt === 'pdf' || file.type === 'application/pdf';
    
    if (!isPdf) {
      return { 
        isValid: false, 
        message: 'Only PDF files are allowed' 
      };
    }
    
    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        message: 'File is too large. Maximum size is 10MB.' 
      };
    }
    
    return { isValid: true };
  };

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.message || 'Invalid file');
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        <div className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg
              className={`h-8 w-8 ${
                isDragging ? 'text-blue-600' : 'text-gray-400'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-1">
              <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload a file</span>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={disabled}
                />
              </label>
              <span>or drag and drop</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Only PDF files are supported (max 10MB)
          </p>
        </div>
      </div>
      
      {fileName && (
        <div className="mt-2 text-sm text-green-600">
          Selected file: {fileName}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
