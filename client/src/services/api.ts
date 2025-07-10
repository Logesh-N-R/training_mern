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
      try {
        // Clone the response to read it multiple times if needed
        const responseClone = response.clone();
        const errorData = await response.json();
        const errorMessage = errorData.message || response.statusText;
        throw new Error(errorMessage);
      } catch (parseError) {
        // If JSON parsing fails, try to get text from the cloned response
        try {
          const errorText = await response.clone().text();
          const cleanError = errorText.replace(/^\d+:\s*/, '') || response.statusText;
          throw new Error(cleanError);
        } catch (textError) {
          throw new Error(response.statusText);
        }
      }
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
      try {
        // Clone the response to read it multiple times if needed
        const responseClone = response.clone();
        const errorData = await response.json();
        const errorMessage = errorData.message || response.statusText;
        throw new Error(errorMessage);
      } catch (parseError) {
        // If JSON parsing fails, try to get text from the cloned response
        try {
          const errorText = await response.clone().text();
          const cleanError = errorText.replace(/^\d+:\s*/, '') || response.statusText;
          throw new Error(cleanError);
        } catch (textError) {
          throw new Error(response.statusText);
        }
      }
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
      try {
        // Clone the response to read it multiple times if needed
        const responseClone = response.clone();
        const errorData = await response.json();
        const errorMessage = errorData.message || response.statusText;
        throw new Error(errorMessage);
      } catch (parseError) {
        // If JSON parsing fails, try to get text from the cloned response
        try {
          const errorText = await response.clone().text();
          const cleanError = errorText.replace(/^\d+:\s*/, '') || response.statusText;
          throw new Error(cleanError);
        } catch (textError) {
          throw new Error(response.statusText);
        }
      }
    }

    return response.json();
  }

  static async delete(url: string) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      try {
        // Clone the response to read it multiple times if needed
        const responseClone = response.clone();
        const errorData = await response.json();
        const errorMessage = errorData.message || response.statusText;
        throw new Error(errorMessage);
      } catch (parseError) {
        // If JSON parsing fails, try to get text from the cloned response
        try {
          const errorText = await response.clone().text();
          const cleanError = errorText.replace(/^\d+:\s*/, '') || response.statusText;
          throw new Error(cleanError);
        } catch (textError) {
          throw new Error(response.statusText);
        }
      }
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
      try {
        // Clone the response to read it multiple times if needed
        const responseClone = response.clone();
        const errorData = await response.json();
        const errorMessage = errorData.message || response.statusText;
        throw new Error(errorMessage);
      } catch (parseError) {
        // If JSON parsing fails, try to get text from the cloned response
        try {
          const errorText = await response.clone().text();
          const cleanError = errorText.replace(/^\d+:\s*/, '') || response.statusText;
          throw new Error(cleanError);
        } catch (textError) {
          throw new Error(response.statusText);
        }
      }
    }

    return response.json();
  }
}