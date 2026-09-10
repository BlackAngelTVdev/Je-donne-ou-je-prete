import { DateTime } from 'luxon'
import env from '#start/env'
import DonationObject from '#models/donation-object'
import ChercheObject from '#models/cherche_object'

export async function purgeSoftDeletedObjects() {
  const rawRetention = env.get('OBJECTS_HARD_DELETE_AFTER_DAYS')

  if (rawRetention === undefined || rawRetention === null) {
    return
  }

  const retentionText = String(rawRetention).trim()
  if (retentionText === '' || retentionText === '-1') {
    return
  }

  const retentionDays = Number(retentionText)
  if (Number.isNaN(retentionDays) || retentionDays < 0) {
    return
  }

  const cutoff = DateTime.now().minus({ days: retentionDays }).toJSDate()
  const cutofftest = DateTime.now().toJSDate()

  await DonationObject.query()
    .where('isDeleted', true)
    .whereNotNull('deletedAt')
    .where('deletedAt', '<=', cutoff)
    .delete()

  await DonationObject.query()
    .where('type', 0)
    .where('available_until', '<=', cutofftest)
    .update({status: 2})

  await ChercheObject.query()
    .where('isDeleted', true)
    .whereNotNull('deletedAt')
    .where('deletedAt', '<=', cutoff)
    .delete()

  const count = await DonationObject.query()
  .where('type', 0)
  .where('available_until', '<=', cutofftest)
  .count('* as total')

console.log(count[0].$extras.total) // Doit être supérieur à 0
}
