
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface QuestionRendererProps {
  question: {
    topic: string;
    question: string;
    type: 'text' | 'multiple-choice' | 'choose-best' | 'true-false' | 'fill-blank';
    options?: string[];
    correctAnswer?: string | number;
    explanation?: string;
  };
  value: string | number;
  onChange: (value: string | number) => void;
  questionIndex: number;
}

export function QuestionRenderer({ 
  question, 
  value, 
  onChange, 
  questionIndex 
}: QuestionRendererProps) {
  const renderQuestionInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <Textarea
            placeholder="Enter your answer here..."
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="mt-2"
          />
        );

      case 'multiple-choice':
      case 'choose-best':
        return (
          <RadioGroup
            value={value as string}
            onValueChange={onChange}
            className="mt-3 space-y-2"
          >
            {question.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option} 
                  id={`q${questionIndex}-option${optionIndex}`}
                />
                <Label 
                  htmlFor={`q${questionIndex}-option${optionIndex}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={value as string}
            onValueChange={onChange}
            className="mt-3 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="True" id={`q${questionIndex}-true`} />
              <Label htmlFor={`q${questionIndex}-true`} className="text-sm cursor-pointer">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="False" id={`q${questionIndex}-false`} />
              <Label htmlFor={`q${questionIndex}-false`} className="text-sm cursor-pointer">
                False
              </Label>
            </div>
          </RadioGroup>
        );

      case 'fill-blank':
        return (
          <div className="mt-2">
            {question.question.includes('_____') ? (
              <div className="space-y-2">
                {question.question.split('_____').map((part, index, array) => (
                  <React.Fragment key={index}>
                    <span className="text-slate-900">{part}</span>
                    {index < array.length - 1 && (
                      <Input
                        placeholder="Fill in the blank"
                        value={value as string}
                        onChange={(e) => onChange(e.target.value)}
                        className="inline-block w-32 mx-2"
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <Input
                placeholder="Enter your answer..."
                value={value as string}
                onChange={(e) => onChange(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        );

      default:
        return (
          <Textarea
            placeholder="Enter your answer here..."
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="mt-2"
          />
        );
    }
  };

  const getQuestionTypeLabel = () => {
    switch (question.type) {
      case 'text': return 'Text Answer';
      case 'multiple-choice': return 'Multiple Choice';
      case 'choose-best': return 'Choose Best Answer';
      case 'true-false': return 'True/False';
      case 'fill-blank': return 'Fill in the Blank';
      default: return 'Text Answer';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-900">{question.topic}</h4>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {getQuestionTypeLabel()}
        </span>
      </div>
      
      <div className="text-slate-700">
        <p className="font-medium mb-2">Question {questionIndex + 1}:</p>
        <p>{question.question}</p>
      </div>

      {renderQuestionInput()}

      {question.explanation && question.type !== 'text' && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-800 mb-1">Hint:</p>
          <p className="text-sm text-blue-700">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
