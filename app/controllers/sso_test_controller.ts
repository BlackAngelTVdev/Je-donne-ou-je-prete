import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import Hash from '@adonisjs/core/services/hash'
import { createAdonisSsoFlowFromEnv } from '#services/sso_bridge_service'
import User from '#models/user'

class StudentBlockedError extends Error {
  constructor() {
    super('Student account not found in database')
    this.name = 'StudentBlockedError'
  }
}

type SsoResult = {
  email: string
  username: string
  error?: string
  isSuccess: () => boolean
  correlationId?: string
  raw?: {
    roles?: string | string[]
    [key: string]: unknown
  }
}

export default class SsoTestController {
  private flow() {
    return createAdonisSsoFlowFromEnv()
  }

  /**
   * Route de test SSO : GET /sso/test
   * Affiche un état simple et les liens SSO utiles.
   */
  public async status(ctx: HttpContext) {
    return this.flow().status(ctx as any)
  }

  /**
   * PHASE 1 : Redirection vers le portail SSO
   */
  public async loginRedirect({ response, request, session }: HttpContext) {
    return this.flow().loginRedirect({ response, request, session } as any)
  }

  /**
   * PHASE 2 : Retour du portail SSO & Validation
   */
  public async callback(ctx: HttpContext) {
    try {
      return await this.flow().callbackLogin(ctx as any, (payload: SsoResult) =>
        this.findOrCreateSsoUser(payload)
      )
    } catch (error) {
      if (error instanceof StudentBlockedError) {
        ctx.session.flash({
          error:
            'Les comptes étudiants ne sont pas autorisés à accéder à cette application. Veuillez contacter un administrateur.',
        })
        return ctx.response.redirect('/choix-login')
      }
      throw error
    }
  }

  /**
   * PHASE 3 : Déconnexion (Locale + Portail)
   */
  public async logout({ auth, response, request, session }: HttpContext) {
    return this.flow().logout({ auth, response, request, session } as any)
  }

  /**
   * LOGIQUE PRIVÉE : Gestion de l'utilisateur en base
   */
  private async findOrCreateSsoUser(payload: SsoResult) {
    const email = payload.email?.trim().toLowerCase() || null
    const usernameFromSso = payload.username?.trim() || ''
    // Prefer using the SSO email local-part to build the Username
    const usernameSource = email || usernameFromSso
    const normalizedUsernameFromSso = usernameSource ? this.normalizeUsername(usernameSource) : ''
    // normaliser une seule fois les rôles, déterminer si l'utilisateur est ETML
    const roles = this.normalizeRoles(payload.raw?.roles)
    const hasEtmlRole = roles.some((role) => /^UUS_ETML(?:_|$)/.test(role))
    // `extainre` as boolean: true = externe, false = interne
    const extainre = !hasEtmlRole
    const origin = this.extractSsoOrigin(payload.raw)
    console.log('SSO origin:', { hasEtmlRole, origin, roles, extainre })

    // 1. Recherche (Email d'abord, puis Username normalisé)
    let user = email ? await User.findBy('email', email) : null
    if (!user && normalizedUsernameFromSso) {
      user = await User.findBy('Username', normalizedUsernameFromSso)
    }

    if (user) {
      user.extainre = extainre
      if (email && user.email !== email) {
        user.email = email
      }
      if (usernameFromSso && user.Username !== normalizedUsernameFromSso) {
        user.Username = normalizedUsernameFromSso
      }
      await user.save()
      return user
    }

    // 2. Blocage des étudiants sans compte existant en base
    const isStudent = roles.some((r) => /^UUS_ETML_Students$|^SKU_STU_Standard$/.test(r))
    if (isStudent) {
      console.log('SSO blocked: student account not found in database', { email, roles })
      throw new StudentBlockedError()
    }

    // 3. Création si nouveau
    const baseUsername = normalizedUsernameFromSso || this.normalizeUsername(usernameFromSso)
    const username = await this.makeUniqueUsername(baseUsername)
    const password = await Hash.make(randomBytes(32).toString('hex'))

    return User.create({
      Username: username,
      email,
      password,
      extainre,
      isadmin: false,
    })
  }

  private normalizeRoles(rawRoles?: string | string[]) {
    if (Array.isArray(rawRoles)) {
      return rawRoles.map((role) => String(role).trim()).filter(Boolean)
    }

    if (typeof rawRoles === 'string') {
      const trimmed = rawRoles.trim()
      if (!trimmed) {
        return []
      }

      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map((role) => String(role).trim()).filter(Boolean)
        }
      } catch {
        return trimmed
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((role) => role.replace(/^"|"$/g, '').trim())
          .filter(Boolean)
      }
    }

    return []
  }

  private extractSsoOrigin(raw?: { roles?: string | string[]; [key: string]: unknown }) {
    if (!raw || typeof raw !== 'object') return null

    const keys = ['location', 'place', 'site', 'org', 'organisation', 'organization', 'department', 'origin', 'city', 'commune']
    for (const k of keys) {
      const v = (raw as any)[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }

    // Fallback: extraire l'étiquette UUS depuis les rôles si présente
    const roles = this.normalizeRoles((raw as any).roles)
    for (const role of roles) {
      const m = role.match(/^UUS_([A-Z0-9]+)/i)
      if (m) return `UUS:${m[1]}`
    }

    return null
  }

  private normalizeUsername(rawEmail: string) {
    const localPart = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail
    const cleaned = localPart
      .trim()
      .replace(/\./g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '')
    return (cleaned || 'sso_user').slice(0, 40)
  }

  private async makeUniqueUsername(baseUsername: string) {
    let candidate = baseUsername
    let suffix = 1
    while (await User.findBy('Username', candidate)) {
      candidate = `${baseUsername}_${suffix}`.slice(0, 40)
      suffix += 1
    }
    return candidate
  }
}
