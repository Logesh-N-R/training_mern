
import * as mammoth from 'mammoth';
import * as pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import * as sharp from 'sharp';
import Tesseract from 'tesseract.js';

export class FileContentExtractor {
  static getSupportedExtensions(): string[] {
    return ['.ppt', '.pptx', '.doc', '.docx', '.pdf', '.xlsx', '.xls', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
  }

  static isValidFile(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return this.getSupportedExtensions().includes(ext);
  }

  private static getFileExtension(filename: string): string {
    return filename.toLowerCase().substring(filename.lastIndexOf('.'));
  }

  static async extractContent(buffer: Buffer, filename: string): Promise<string> {
    const ext = this.getFileExtension(filename);
    
    try {
      switch (ext) {
        case '.ppt':
        case '.pptx':
          return await this.extractPowerPointContent(buffer);
        
        case '.doc':
        case '.docx':
          return await this.extractWordContent(buffer);
        
        case '.pdf':
          return await this.extractPDFContent(buffer);
        
        case '.xlsx':
        case '.xls':
          return await this.extractExcelContent(buffer);
        
        case '.txt':
          return await this.extractTextContent(buffer);
        
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.bmp':
        case '.tiff':
          return await this.extractImageContent(buffer);
        
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      console.error(`Error extracting content from ${filename}:`, error);
      throw new Error(`Failed to extract content from ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractPowerPointContent(buffer: Buffer): Promise<string> {
    // TODO: Implement actual PowerPoint extraction
    // For now, return a placeholder that indicates PowerPoint content
    return "PowerPoint presentation content would be extracted here. This includes slide titles, text content, and bullet points from all slides.";
  }

  private static async extractWordContent(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "No text content found in Word document.";
    } catch (error) {
      throw new Error(`Failed to extract Word content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractPDFContent(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text || "No text content found in PDF.";
    } catch (error) {
      throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractExcelContent(buffer: Buffer): Promise<string> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let content = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_csv(sheet);
        content += `Sheet: ${sheetName}\n${sheetData}\n\n`;
      });
      
      return content || "No content found in Excel file.";
    } catch (error) {
      throw new Error(`Failed to extract Excel content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractTextContent(buffer: Buffer): Promise<string> {
    try {
      return buffer.toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to extract text content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async extractImageContent(buffer: Buffer): Promise<string> {
    try {
      // Use OCR to extract text from images
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return text || "No text found in image.";
    } catch (error) {
      console.warn('OCR extraction failed:', error);
      return "Image uploaded - visual content analysis would be performed here. Consider adding descriptive text about the image content for better question generation.";
    }
  }

  // Legacy method name for backward compatibility
  static async extractPowerPointContent(buffer: Buffer): Promise<string> {
    return this.extractContent(buffer, 'presentation.pptx');
  }
}

// Export both old and new class names for compatibility
export const PowerPointExtractor = FileContentExtractor;
