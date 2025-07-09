
import { z } from 'zod';
import { FileContentExtractor } from './powerpoint-extractor';
import { AIPromptTemplates } from './ai-prompt-templates';

interface QuestionGenerationRequest {
  content?: string;
  prompt?: string;
  questionTypes: string[];
  count?: number;
  file?: {
    buffer: Buffer;
    filename: string;
  };
}

interface GeneratedQuestion {
  topic: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'choose-best' | 'true-false' | 'fill-blank';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export class AIQuestionGenerator {
  
  static async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const { content, prompt, questionTypes, count = 5, file } = request;
    
    let finalContent = content || '';
    
    // Extract content from file if provided
    if (file && FileContentExtractor.isValidFile(file.filename)) {
      try {
        const extractedContent = await FileContentExtractor.extractContent(file.buffer, file.filename);
        finalContent = extractedContent;
      } catch (error) {
        console.error('File extraction failed:', error);
        // Continue with existing content or prompt
      }
    }
    
    // Generate appropriate prompts using templates
    const systemPrompt = AIPromptTemplates.getSystemPrompt(questionTypes, count);
    let userPrompt: string;
    
    if (file && finalContent) {
      userPrompt = AIPromptTemplates.getFileBasedPrompt(file.filename, finalContent, prompt);
    } else if (finalContent) {
      userPrompt = AIPromptTemplates.getContentPrompt(finalContent, prompt);
    } else if (prompt) {
      userPrompt = AIPromptTemplates.getTopicPrompt(prompt, undefined);
    } else {
      userPrompt = 'Generate general educational questions covering fundamental concepts.';
    }

    // TODO: Integrate with OpenAI, Google AI, or other AI services
    // Example with OpenAI:
    /*
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content || prompt || "Generate questions" }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    
    const generatedContent = response.choices[0].message.content;
    return JSON.parse(generatedContent);
    */

    // Mock implementation that adapts to the request
    const topics = this.extractTopicsFromContent(finalContent, userPrompt);
    const mockQuestions: GeneratedQuestion[] = this.generateMockQuestions(topics, questionTypes, count);

    return mockQuestions;
  }

  private static extractTopicsFromContent(content: string, prompt: string): string[] {
    // Extract potential topics from content and prompt
    const defaultTopics = ['Fundamentals', 'Best Practices', 'Advanced Concepts'];
    
    if (content.toLowerCase().includes('react')) {
      return ['React Components', 'State Management', 'React Hooks', 'Performance'];
    } else if (content.toLowerCase().includes('javascript')) {
      return ['JavaScript Basics', 'ES6 Features', 'Async Programming', 'DOM Manipulation'];
    } else if (content.toLowerCase().includes('python')) {
      return ['Python Basics', 'Data Structures', 'Object-Oriented Programming', 'Libraries'];
    } else if (prompt.toLowerCase().includes('database')) {
      return ['Database Design', 'SQL Queries', 'Normalization', 'Indexing'];
    }
    
    return defaultTopics;
  }

  private static generateMockQuestions(topics: string[], questionTypes: string[], count: number): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    const questionsPerTopic = Math.ceil(count / topics.length);

    for (let i = 0; i < topics.length && questions.length < count; i++) {
      const topic = topics[i];
      const remainingCount = count - questions.length;
      const questionsToGenerate = Math.min(questionsPerTopic, remainingCount);

      for (let j = 0; j < questionsToGenerate; j++) {
        const questionType = questionTypes[j % questionTypes.length] as GeneratedQuestion['type'];
        questions.push(this.createMockQuestion(topic, questionType, j + 1));
      }
    }

    return questions;
  }

  private static createMockQuestion(topic: string, type: GeneratedQuestion['type'], index: number): GeneratedQuestion {
    const baseQuestion = {
      topic,
      explanation: `This question tests understanding of ${topic.toLowerCase()} concepts.`
    };

    switch (type) {
      case 'multiple-choice':
        return {
          ...baseQuestion,
          question: `What is a key concept in ${topic}? (Question ${index})`,
          type,
          options: [
            `Correct understanding of ${topic}`,
            `Incorrect option A`,
            `Incorrect option B`,
            `Incorrect option C`
          ],
          correctAnswer: `Correct understanding of ${topic}`
        };

      case 'true-false':
        return {
          ...baseQuestion,
          question: `${topic} follows standard best practices. (Statement ${index})`,
          type,
          options: ['True', 'False'],
          correctAnswer: 'True'
        };

      case 'choose-best':
        return {
          ...baseQuestion,
          question: `Which is the best approach for ${topic}? (Question ${index})`,
          type,
          options: [
            `Best practice for ${topic}`,
            `Good but not optimal approach`,
            `Acceptable alternative method`,
            `Less preferred option`
          ],
          correctAnswer: `Best practice for ${topic}`
        };

      case 'fill-blank':
        return {
          ...baseQuestion,
          question: `${topic} requires understanding of _______ concepts. (Question ${index})`,
          type,
          correctAnswer: 'fundamental'
        };

      default: // text
        return {
          ...baseQuestion,
          question: `Explain the importance of ${topic} in modern development. (Question ${index})`,
          type: 'text',
          correctAnswer: `${topic} is important because it provides structure, maintainability, and efficiency in development processes.`
        };
    }
  }

  static async extractContentFromFile(buffer: Buffer, filename: string): Promise<string> {
    return FileContentExtractor.extractContent(buffer, filename);
  }

  // Legacy method for backward compatibility
  static async extractContentFromPowerPoint(buffer: Buffer): Promise<string> {
    return FileContentExtractor.extractContent(buffer, 'presentation.pptx');
  }
}
