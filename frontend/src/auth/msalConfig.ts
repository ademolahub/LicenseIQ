export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://${import.meta.env.VITE_AZURE_TENANT_ID || 'login.microsoftonline.com'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = {
  scopes: ['User.Read'],
}
