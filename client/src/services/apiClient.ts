const API_BASE_URL = 'http://localhost:4567'

export interface User {
  id: number
  username: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface ApiResponse<T = unknown> {
  message?: string
  user?: User
  error?: string
  data?: T
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  }

  async login(credentials: LoginRequest): Promise<ApiResponse> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: RegisterRequest): Promise<ApiResponse> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/logout', {
      method: 'POST',
    })
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request('/profile')
  }

  async updateProfile(data: { password: string }): Promise<ApiResponse> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()