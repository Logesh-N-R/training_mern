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
      throw new Error(error || response.statusText);
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
      throw new Error(error || response.statusText);
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
      throw new Error(error || response.statusText);
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
      throw new Error(error || response.statusText);
    }
    
    return response.json();
  }
}
