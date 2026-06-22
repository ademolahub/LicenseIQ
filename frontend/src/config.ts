export const config = {
  MOCK_MODE: import.meta.env.VITE_MOCK_MODE === 'true',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
}
