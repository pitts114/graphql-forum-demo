import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiClient } from './apiClient'
import type { LoginRequest, RegisterRequest, ApiResponse } from './apiClient'

describe('ApiClient', () => {
  // Store original fetch
  const originalFetch = global.fetch

  beforeEach(() => {
    // Mock fetch before each test
    global.fetch = vi.fn()
  })

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should send POST request to /login with credentials', async () => {
      const mockResponse: ApiResponse = {
        message: 'Login successful',
        user: { id: 1, username: 'testuser' }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123'
      }

      const result = await apiClient.login(credentials)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4567/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw error when login fails', async () => {
      const errorResponse = {
        error: 'Invalid credentials'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      })

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'wrongpassword'
      }

      await expect(apiClient.login(credentials)).rejects.toThrow('Invalid credentials')
    })

    it('should throw generic error when no error message provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      const credentials: LoginRequest = {
        username: 'testuser',
        password: 'password123'
      }

      await expect(apiClient.login(credentials)).rejects.toThrow('HTTP 500')
    })
  })

  describe('register', () => {
    it('should send POST request to /register with user data', async () => {
      const mockResponse: ApiResponse = {
        message: 'Registration successful',
        user: { id: 2, username: 'newuser' }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const userData: RegisterRequest = {
        username: 'newuser',
        password: 'password123'
      }

      const result = await apiClient.register(userData)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4567/register',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw error when username already exists', async () => {
      const errorResponse = {
        error: 'Username already exists'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      })

      const userData: RegisterRequest = {
        username: 'existinguser',
        password: 'password123'
      }

      await expect(apiClient.register(userData)).rejects.toThrow('Username already exists')
    })
  })

  describe('logout', () => {
    it('should send POST request to /logout', async () => {
      const mockResponse: ApiResponse = {
        message: 'Logout successful'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiClient.logout()

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4567/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle logout errors', async () => {
      const errorResponse = {
        error: 'Session not found'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      })

      await expect(apiClient.logout()).rejects.toThrow('Session not found')
    })
  })

  describe('getProfile', () => {
    it('should send GET request to /profile', async () => {
      const mockResponse: ApiResponse = {
        user: { id: 1, username: 'testuser' }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiClient.getProfile()

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4567/profile',
        expect.objectContaining({
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw error when not authenticated', async () => {
      const errorResponse = {
        error: 'Not authenticated'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      })

      await expect(apiClient.getProfile()).rejects.toThrow('Not authenticated')
    })
  })

  describe('updateProfile', () => {
    it('should send PUT request to /profile with update data', async () => {
      const mockResponse: ApiResponse = {
        message: 'Profile updated successfully',
        user: { id: 1, username: 'testuser' }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const updateData = { password: 'newpassword123' }

      const result = await apiClient.updateProfile(updateData)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4567/profile',
        expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw error when update fails', async () => {
      const errorResponse = {
        error: 'Password too short'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      })

      const updateData = { password: 'short' }

      await expect(apiClient.updateProfile(updateData)).rejects.toThrow('Password too short')
    })
  })

  describe('request configuration', () => {
    it('should include credentials in all requests', async () => {
      const mockResponse: ApiResponse = { message: 'Success' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await apiClient.getProfile()

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const options = fetchCall[1]
      expect(options?.credentials).toBe('include')
    })

    it('should set Content-Type header to application/json', async () => {
      const mockResponse: ApiResponse = { message: 'Success' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await apiClient.getProfile()

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const options = fetchCall[1] as RequestInit
      expect(options?.headers).toMatchObject({
        'Content-Type': 'application/json',
      })
    })

    it('should use correct base URL', async () => {
      const mockResponse: ApiResponse = { message: 'Success' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      await apiClient.login({ username: 'test', password: 'test' })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const url = fetchCall[0]
      expect(url).toBe('http://localhost:4567/login')
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(apiClient.getProfile()).rejects.toThrow('Network error')
    })

    it('should handle malformed JSON responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(apiClient.getProfile()).rejects.toThrow('Invalid JSON')
    })
  })
})
