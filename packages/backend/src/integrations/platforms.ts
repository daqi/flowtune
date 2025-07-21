import { IPlatformIntegration, IAuth, ActionContext, ActionResult, AuthType } from '../core/types'

export class OpenAIIntegration implements IPlatformIntegration {
  platformName = 'OpenAI'
  baseUrl = 'https://api.openai.com/v1'

  async authenticate(credentials: Record<string, any>): Promise<IAuth> {
    // 验证API密钥
    const isValid = await this.validateApiKey(credentials.apiKey)
    
    return {
      id: `openai_${Date.now()}`,
      appId: 'openai',
      type: AuthType.API_KEY,
      credentials: {
        apiKey: credentials.apiKey
      },
      isValid,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async executeAction(context: ActionContext): Promise<ActionResult> {
    const { parameters } = context
    
    try {
      let response: Response
      
      // 根据不同的操作类型执行不同的请求
      switch (context.actionId) {
        case 'openai-chat':
          response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${context.metadata?.apiKey}`
            },
            body: JSON.stringify({
              model: parameters.model || 'gpt-3.5-turbo',
              messages: parameters.messages,
              temperature: parameters.temperature || 0.7,
              max_tokens: parameters.maxTokens,
              stream: false
            })
          })
          break
          
        case 'openai-completion':
          response = await fetch(`${this.baseUrl}/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${context.metadata?.apiKey}`
            },
            body: JSON.stringify({
              model: parameters.model || 'text-davinci-003',
              prompt: parameters.prompt,
              max_tokens: parameters.maxTokens || 100,
              temperature: parameters.temperature || 0.7
            })
          })
          break
          
        default:
          throw new Error(`Unsupported OpenAI action: ${context.actionId}`)
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data,
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
          requestId: context.metadata?.requestId || 'unknown'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPENAI_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
          requestId: context.metadata?.requestId || 'unknown'
        }
      }
    }
  }

  async validateCredentials(auth: IAuth): Promise<boolean> {
    return this.validateApiKey(auth.credentials.apiKey)
  }

  private async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export class GitHubIntegration implements IPlatformIntegration {
  platformName = 'GitHub'
  baseUrl = 'https://api.github.com'

  async authenticate(credentials: Record<string, any>): Promise<IAuth> {
    const isValid = await this.validateToken(credentials.token)
    
    return {
      id: `github_${Date.now()}`,
      appId: 'github',
      type: AuthType.BEARER_TOKEN,
      credentials: {
        token: credentials.token
      },
      isValid,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async executeAction(context: ActionContext): Promise<ActionResult> {
    const { parameters } = context
    
    try {
      let response: Response
      
      switch (context.actionId) {
        case 'github-create-issue':
          response = await fetch(`${this.baseUrl}/repos/${parameters.owner}/${parameters.repo}/issues`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `token ${context.metadata?.token}`,
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
              title: parameters.title,
              body: parameters.body,
              labels: parameters.labels,
              assignees: parameters.assignees
            })
          })
          break
          
        case 'github-list-repos':
          const url = parameters.username 
            ? `${this.baseUrl}/users/${parameters.username}/repos`
            : `${this.baseUrl}/user/repos`
          
          response = await fetch(url, {
            headers: {
              'Authorization': `token ${context.metadata?.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          })
          break
          
        default:
          throw new Error(`Unsupported GitHub action: ${context.actionId}`)
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`GitHub API Error: ${error.message || response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data,
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
          requestId: context.metadata?.requestId || 'unknown'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GITHUB_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
          requestId: context.metadata?.requestId || 'unknown'
        }
      }
    }
  }

  async validateCredentials(auth: IAuth): Promise<boolean> {
    return this.validateToken(auth.credentials.token)
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `token ${token}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export class SlackIntegration implements IPlatformIntegration {
  platformName = 'Slack'
  baseUrl = 'https://slack.com/api'

  async authenticate(credentials: Record<string, any>): Promise<IAuth> {
    const isValid = await this.validateToken(credentials.token)
    
    return {
      id: `slack_${Date.now()}`,
      appId: 'slack',
      type: AuthType.BEARER_TOKEN,
      credentials: {
        token: credentials.token,
        webhookUrl: credentials.webhookUrl
      },
      isValid,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async executeAction(context: ActionContext): Promise<ActionResult> {
    const { parameters } = context
    
    try {
      let response: Response
      
      switch (context.actionId) {
        case 'slack-send-message':
          if (context.metadata?.webhookUrl) {
            // 使用Webhook发送消息
            response = await fetch(context.metadata.webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                text: parameters.text,
                channel: parameters.channel,
                username: parameters.username,
                icon_emoji: parameters.iconEmoji
              })
            })
          } else {
            // 使用API发送消息
            response = await fetch(`${this.baseUrl}/chat.postMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.metadata?.token}`
              },
              body: JSON.stringify({
                channel: parameters.channel,
                text: parameters.text,
                username: parameters.username
              })
            })
          }
          break
          
        case 'slack-list-channels':
          response = await fetch(`${this.baseUrl}/conversations.list`, {
            headers: {
              'Authorization': `Bearer ${context.metadata?.token}`
            }
          })
          break
          
        default:
          throw new Error(`Unsupported Slack action: ${context.actionId}`)
      }

      if (!response.ok) {
        throw new Error(`Slack API Error: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.ok === false) {
        throw new Error(`Slack API Error: ${data.error}`)
      }
      
      return {
        success: true,
        data,
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
          requestId: context.metadata?.requestId || 'unknown'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SLACK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error
        },
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
          requestId: context.metadata?.requestId || 'unknown'
        }
      }
    }
  }

  async validateCredentials(auth: IAuth): Promise<boolean> {
    return this.validateToken(auth.credentials.token)
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      return response.ok && data.ok
    } catch {
      return false
    }
  }
}
