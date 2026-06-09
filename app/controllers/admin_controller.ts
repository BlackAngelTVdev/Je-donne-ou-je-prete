import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class AdminController {
	public async dashboard({ request, view }: HttpContext) {
		// Totals
		const usersCountRow = await db.from('users').count('id as total')
		const donationsCountRow = await db.from('donation_objects').whereRaw('is_deleted = 0').count('id as total')
		const chercheCountRow = await db.from('cherche_objects').whereRaw('is_deleted = 0').count('id as total')
		const reservationsCountRow = await db
			.from('donation_objects')
			.whereNotNull('reserved_by')
			.whereRaw('is_deleted = 0')
			.count('id as total')

		const extractTotal = (row: any) => {
			const val = row && row[0] && (row[0].total ?? Object.values(row[0])[0])
			return Number(val || 0)
		}

		const usersTotal = extractTotal(usersCountRow)
		const donationsTotal = extractTotal(donationsCountRow)
		const chercheTotal = extractTotal(chercheCountRow)
		const reservationsTotal = extractTotal(reservationsCountRow)

		// Users growth last 10 days
		const days = 10
		const since = DateTime.now().minus({ days: days - 1 }).startOf('day')
		const usersRows = await db.from('users').select('created_at').where('created_at', '>=', since.toSQL())

		const labels: string[] = []
		const data: number[] = []
		for (let i = 0; i < days; i++) {
			const day = since.plus({ days: i })
			const key = day.toFormat('yyyy-MM-dd')
			labels.push(key)
			data.push(0)
		}

		usersRows.forEach((r: any) => {
			const dt = new Date(r.created_at)
			const key = DateTime.fromJSDate(dt).toFormat('yyyy-MM-dd')
			const idx = labels.indexOf(key)
			if (idx >= 0) data[idx]++
		})

		const max = data.reduce((a, b) => (a > b ? a : b), 0)
		const usersSeriesRows = labels.map((label, i) => ({ label, count: data[i], percent: max > 0 ? Math.round((data[i] / max) * 100) : 0 }))

		// Fetch recent feedbacks (last 20)
		const feedbacks = await db.from('feedbacks').select('*').orderBy('created_at', 'desc').limit(20)

		// ==========================================
		// RECHERCHE DES UTILISATEURS SÉCURISÉE
		// ==========================================
		const searchTerm = request.input('search')
		const usersQuery = db.from('users').select('id', 'Username as username', 'email', 'isadmin')

		if (searchTerm) {
			usersQuery.whereRaw('(Username LIKE ? OR email LIKE ?)', [
				`%${searchTerm}%`,
				`%${searchTerm}%`
			])
		}

		const users = await usersQuery.orderBy('Username', 'asc')

		const stats = {
			usersTotal,
			donationsTotal,
			chercheTotal,
			reservationsTotal,
			usersSeriesRows,
		}

		return view.render('pages/admin-dashboard', { stats, feedbacks, users })
	}

	// ==========================================
	// ACTION : DÉFINIR LE RÉFÉRENT DURABILITÉ
	// ==========================================
	public async setReferent({ params, response, session }: HttpContext) {
		const userId = params.id

		// 1. Vérifier si l'utilisateur existe
		const user = await db.from('users').where('id', userId).first()
		if (!user) {
			session.flash('error', 'Utilisateur introuvable.')
			return response.redirect().back()
		}

		// 2. Supprimer l'ancien référent unique
		await db.from('sustainability_roles').where('role_key', 'referent_durabilite').del()

		// 3. Insérer le nouveau rôle
		await db.table('sustainability_roles').insert({
			user_id: user.id,
			role_key: 'referent_durabilite',
			created_at: DateTime.now().toSQL(),
			updated_at: DateTime.now().toSQL(),
		})

		session.flash('success', `L'utilisateur "${user.Username}" est maintenant Référent Durabilité.`)
		return response.redirect().back()
	}
}