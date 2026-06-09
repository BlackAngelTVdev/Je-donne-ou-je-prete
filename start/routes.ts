/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

import DonationObjectsController from '#controllers/donation_objects_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import AuthController from '#controllers/auth_controller'
import AccountsController from '#controllers/accounts_controller'
import ChercheObjectsController from '#controllers/cherche_objects_controller'
import SsoTestController from '#controllers/sso_test_controller'
import AdminController from '#controllers/admin_controller'
import ContactsController from '#controllers/contacts_controller'

// --- Public routes ---
router.get('/choix-login', [AuthController, 'choixLogin']).as('choix_login')
router.get('/login', [AuthController, 'login']).as('login')
router.post('/login', [AuthController, 'authenticate']).as('autenticate')
router.get('/sso/test', [SsoTestController, 'status']).as('sso.test.status')
router.get('/sso/login', [SsoTestController, 'loginRedirect']).as('sso.test.login')
router.get('/sso/callback', [SsoTestController, 'callback']).as('sso.test.callback')
router.get('/sso/logout', [SsoTestController, 'logout']).as('sso.test.logout')

// --- Protected routes ---
router
.group(() => {
    router.get('/', [DonationObjectsController, 'index']).as('login0')
    router.get('/account', [AccountsController, 'account']).as('account')
    router.get('/logout', [AuthController, 'logout']).as('logout')

    // contact
    router.get('/contact', [ContactsController, 'index']).as('contact')
    router.post('/contact', [ContactsController, 'store']).as('contact.store')

    // DonationObjects routes
    router.get('/home', [DonationObjectsController, 'index']).as('donation_objects.index')
    router.get('/new', [DonationObjectsController, 'create']).as('donation_objects.create')
    router.post('/', [DonationObjectsController, 'store']).as('donation_objects.store')

    router.get('/cherche/home', [ChercheObjectsController, 'index']).as('cherche_objects.index')
    router.get('/cherche/new', [ChercheObjectsController, 'create']).as('cherche_objects.create')
    router.post('/cherche', [ChercheObjectsController, 'store']).as('cherche_objects.store')

    router
      .group(() => {
        router.get('/:id', [DonationObjectsController, 'show']).as('donation_objects.show')
        router.get('/:id/edit', [DonationObjectsController, 'edit']).as('donation_objects.edit')
        router.post('/:id', [DonationObjectsController, 'update']).as('donation_objects.update')
        router.delete('/:id', [DonationObjectsController, 'destroy']).as('donation_objects.destroy')
        router
          .post('/:id/reserve', [DonationObjectsController, 'reserve'])
          .as('donation_objects.reserve')
        router
          .patch('/:id/republish', [DonationObjectsController, 'republish'])
          .as('item.republish')
      })
      .prefix('/item')

    router
      .group(() => {
        router.get('/:id', [ChercheObjectsController, 'show']).as('cherche_objects.show')
        router.get('/:id/edit', [ChercheObjectsController, 'edit']).as('cherche_objects.edit')
        router.post('/:id', [ChercheObjectsController, 'update']).as('cherche_objects.update')
        router.delete('/:id', [ChercheObjectsController, 'destroy']).as('cherche_objects.destroy')
        router
          .post('/:id/reserve', [ChercheObjectsController, 'reserve'])
          .as('cherche_objects.reserve')
        router
          .patch('/:id/republish', [ChercheObjectsController, 'republish'])
          .as('cherche_item.republish')
      })
      .prefix('/item/cherche')
    // Admin dashboard - accessible only to authenticated admins
    router
      .group(() => {
        router.get('/admin', [AdminController, 'dashboard']).as('admin.dashboard')
        router.delete('/admin/feedbacks/:id', [ContactsController, 'destroy']).as('admin.feedbacks.destroy')
        router.post('/admin/users/:id/set-referent', [AdminController, 'setReferent']).as('admin.users.setReferent')
      })
      .use(middleware.admin())
  })
  .use(middleware.auth())

router.get('/test-error/:code', async ({ params, view }) => {
  // On récupère le code depuis les paramètres de l'URL
  const errorCode = params.code || 500

  // On renvoie la vue en passant l'objet "error" attendu par ton fichier .edge
  return view.render('pages/errors/server_error', {
    error: {
      code: errorCode,
    },
  })
})
