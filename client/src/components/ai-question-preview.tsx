
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2,
  Brain,
  Lightbulb
} from 'lucide-react';

interface GeneratedQuestion {
  topic: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'choose-best' | 'true-false' | 'fill-blank';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface AIQuestionPreviewProps {
  questions: GeneratedQuestion[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onEditQuestion: (index: number, question: GeneratedQuestion) => void;
  onRemoveQuestion: (index: number) => void;
}

export function AIQuestionPreview({ 
  questions, 
  onAcceptAll, 
  onRejectAll, 
  onEditQuestion, 
  onRemoveQuestion 
}: AIQuestionPreviewProps) {
  const [showAnswers, setShowAnswers] = useState<boolean[]>(
    new Array(questions.length).fill(false)
  );

  const toggleAnswer = (index: number) => {
    const newShowAnswers = [...showAnswers];
    newShowAnswers[index] = !newShowAnswers[index];
    setShowAnswers(newShowAnswers);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text Answer';
      case 'multiple-choice': return 'Multiple Choice';
      case 'choose-best': return 'Choose Best';
      case 'true-false': return 'True/False';
      case 'fill-blank': return 'Fill Blank';
      default: return 'Text Answer';
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'multiple-choice': return 'bg-green-100 text-green-800';
      case 'choose-best': return 'bg-purple-100 text-purple-800';
      case 'true-false': return 'bg-orange-100 text-orange-800';
      case 'fill-blank': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-600" />
            AI Generated Questions ({questions.length})
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={onAcceptAll}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept All
            </Button>
            <Button
              onClick={onRejectAll}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getQuestionTypeColor(question.type)}>
                      {getQuestionTypeLabel(question.type)}
                    </Badge>
                    <Badge variant="outline">{question.topic}</Badge>
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    {question.question}
                  </h4>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleAnswer(index)}
                    title={showAnswers[index] ? "Hide answer" : "Show answer"}
                  >
                    {showAnswers[index] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditQuestion(index, question)}
                    title="Edit question"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveQuestion(index)}
                    title="Remove question"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {question.options && question.options.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                  <ul className="space-y-1">
                    {question.options.map((option, optionIndex) => (
                      <li
                        key={optionIndex}
                        className={`text-sm p-2 rounded ${
                          showAnswers[index] && option === question.correctAnswer
                            ? 'bg-green-100 text-green-800 font-medium'
                            : 'bg-gray-50'
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {showAnswers[index] && (
                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                    <p className="text-sm bg-green-100 text-green-800 p-2 rounded">
                      {question.correctAnswer}
                    </p>
                  </div>
                  {question.explanation && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-1" />
                        Explanation:
                      </p>
                      <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
