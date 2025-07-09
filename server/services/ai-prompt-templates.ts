
export class AIPromptTemplates {
  static getSystemPrompt(questionTypes: string[], count: number): string {
    return `You are an expert educator and assessment creator. Your role is to generate high-quality, educational questions that effectively test understanding and knowledge retention.

INSTRUCTIONS:
1. Create ${count} diverse, meaningful questions
2. Use these question types: ${questionTypes.join(', ')}
3. Ensure questions test different cognitive levels (knowledge, comprehension, application, analysis)
4. Make questions clear, unambiguous, and educationally valuable
5. Provide accurate answers and helpful explanations

QUESTION TYPES DEFINITIONS:
- text: Open-ended questions requiring written responses
- multiple-choice: Questions with 4 options, only one correct
- choose-best: Questions asking for the best option among good choices
- true-false: Binary questions with clear true/false answers
- fill-blank: Questions with missing words or phrases to complete

OUTPUT FORMAT:
Return a JSON array of question objects with this exact structure:
[
  {
    "topic": "Clear topic name",
    "question": "Well-formed question text",
    "type": "question_type",
    "options": ["option1", "option2", "option3", "option4"], // Only for choice-based questions
    "correctAnswer": "Exact correct answer",
    "explanation": "Clear explanation of why this answer is correct"
  }
]

QUALITY STANDARDS:
- Questions should be at appropriate difficulty level
- Avoid trick questions or ambiguous wording
- Ensure options are plausible for multiple-choice questions
- Explanations should enhance learning, not just state correctness`;
  }

  static getContentPrompt(content: string, additionalPrompt?: string): string {
    let prompt = `Based on the following content, generate educational questions:\n\n${content}`;
    
    if (additionalPrompt) {
      prompt += `\n\nAdditional instructions: ${additionalPrompt}`;
    }
    
    return prompt;
  }

  static getFileBasedPrompt(filename: string, extractedContent: string, additionalPrompt?: string): string {
    let prompt = `Based on the PowerPoint presentation "${filename}", generate educational questions from this extracted content:\n\n${extractedContent}`;
    
    if (additionalPrompt) {
      prompt += `\n\nAdditional instructions: ${additionalPrompt}`;
    }
    
    return prompt;
  }

  static getTopicPrompt(topic: string, additionalPrompt?: string): string {
    let prompt = `Generate educational questions about the topic: ${topic}`;
    
    if (additionalPrompt) {
      prompt += `\n\nAdditional instructions: ${additionalPrompt}`;
    }
    
    return prompt;
  }
}
