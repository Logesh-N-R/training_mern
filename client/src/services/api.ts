import { apiRequest } from '@/lib/queryClient';

export class ApiService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static async get(url: string) {
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      // Extract just the error message without status code
      const cleanError = error.replace(/^\d+:\s*/, '') || response.statusText;
      throw new Error(cleanError);
    }
    
    return response.json();
  }

  static async post(url: string, data: unknown) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.text();
      // Extract just the error message without status code
      const cleanError = error.replace(/^\d+:\s*/, '') || response.statusText;
      throw new Error(cleanError);
    }
    
    return response.json();
  }

  static async put(url: string, data: unknown) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.text();
      // Extract just the error message without status code
      const cleanError = error.replace(/^\d+:\s*/, '') || response.statusText;
      throw new Error(cleanError);
    }
    
    return response.json();
  }

  static async delete(url: string) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.text();
      // Extract just the error message without status code
      const cleanError = error.replace(/^\d+:\s*/, '') || response.statusText;
      throw new Error(cleanError);
    }
    
    return response.json();
  }

  static async postFormData(url: string, formData: FormData) {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      // Extract just the error message without status code
      const cleanError = error.replace(/^\d+:\s*/, '') || response.statusText;
      throw new Error(cleanError);
    }
    
    return response.json();
  }
}
