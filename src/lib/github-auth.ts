const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID' // TODO: Register OAuth app
const GITHUB_API = 'https://github.com/login/device/code'
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token'

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface TokenResponse {
  access_token?: string
  error?: string
}

export class GitHubAuth {
  private deviceCode: string | null = null
  private interval: number = 5

  async requestDeviceCode(): Promise<{ userCode: string; verificationUri: string }> {
    const response = await fetch(GITHUB_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        scope: 'read:user',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to request device code')
    }

    const data: DeviceCodeResponse = await response.json()
    this.deviceCode = data.device_code
    this.interval = data.interval

    return {
      userCode: data.user_code,
      verificationUri: data.verification_uri,
    }
  }

  async pollForToken(): Promise<string | null> {
    if (!this.deviceCode) {
      throw new Error('No device code. Call requestDeviceCode first.')
    }

    const response = await fetch(GITHUB_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: this.deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    })

    if (!response.ok) {
      return null
    }

    const data: TokenResponse = await response.json()
    
    if (data.access_token) {
      // Store token
      await chrome.storage.local.set({ github_token: data.access_token })
      return data.access_token
    }

    return null
  }

  async getToken(): Promise<string | null> {
    const result = await chrome.storage.local.get(['github_token'])
    return result.github_token || null
  }

  async logout(): Promise<void> {
    await chrome.storage.local.remove(['github_token'])
    this.deviceCode = null
  }

  getInterval(): number {
    return this.interval
  }
}
