const BASE_URL = '/.netlify/functions'

function getToken() {
  return localStorage.getItem('bodymax_token')
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await res.json()
    : { message: await res.text() }

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong')
    error.status = res.status
    throw error
  }

  return data
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('bodymax_token', token)
  } else {
    localStorage.removeItem('bodymax_token')
  }
}
