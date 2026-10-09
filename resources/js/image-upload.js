/**
 * Gestion du champ image des formulaires d'ajout et d'édition d'objet.
 *
 * - vérifie la limite de taille côté navigateur (5 Mo)
 * - compresse l'image avant l'envoi (redimensionnement + WebP)
 * - affiche immédiatement le message d'erreur sous la zone d'upload
 */

// Doit rester aligné avec le validateur serveur (app/validators/donation_object.ts)
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_DIMENSION = 1200
const WEBP_QUALITY = 0.75
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function formatSize(bytes) {
  const megaBytes = bytes / (1024 * 1024)
  if (megaBytes >= 1) {
    return `${megaBytes.toFixed(1)} Mo`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`
}

function fillTemplate(template, values) {
  return Object.keys(values).reduce(
    (result, key) => result.replaceAll(`{${key}}`, values[key]),
    template
  )
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Redimensionne et réencode l'image dans le navigateur.
 * Retourne null si le navigateur ne sait pas traiter l'image.
 */
async function compressImage(file) {
  let image
  try {
    image = await loadImage(file)
  } catch {
    return null
  }

  const ratio = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    return null
  }

  // Fond blanc : évite le noir sur les PNG transparents convertis
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  // WebP si dispo, sinon JPEG (Safari < 14)
  const blob = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY)
  if (blob) {
    return blob
  }
  return canvasToBlob(canvas, 'image/jpeg', WEBP_QUALITY)
}

/**
 * Remplace le fichier du champ par la version compressée, afin que le
 * formulaire envoie bien la version allégée. Retourne false si le navigateur
 * ne supporte pas DataTransfer.
 */
function replaceInputFile(input, blob, originalName) {
  try {
    const baseName = originalName.replace(/\.[^.]+$/, '') || 'image'
    const extension = blob.type === 'image/jpeg' ? 'jpg' : 'webp'
    const file = new File([blob], `${baseName}.${extension}`, { type: blob.type })
    const transfer = new DataTransfer()
    transfer.items.add(file)
    input.files = transfer.files
    return true
  } catch {
    return false
  }
}

function initImageUpload() {
  const input = document.getElementById('image')
  const feedback = document.getElementById('imageFeedback')

  if (!input || input.type !== 'file' || !feedback || input.dataset.imageUploadReady === 'true') {
    return
  }
  input.dataset.imageUploadReady = 'true'

  const preview = document.getElementById('imageDisplay')
  const form = input.closest('form')

  const messages = {
    type:
      input.dataset.messageType ||
      "Format d'image non supporté. Choisissez un fichier JPG, PNG ou WebP.",
    limit:
      input.dataset.messageLimit ||
      "L'image dépasse la limite de {size}. Choisissez un fichier plus léger.",
    compressing:
      input.dataset.messageCompressing || 'Image trop lourde ({size}) : compression en cours…',
    compressed:
      input.dataset.messageCompressed || 'Image compressée automatiquement : {before} → {after}.',
  }

  let blocked = false
  let pending = false
  let previewUrl = null
  let lastMessage = ''

  // Message d'erreur éventuellement rendu par le serveur après un rechargement
  if (feedback.textContent.trim() !== '') {
    feedback.className = 'upload-feedback error'
    feedback.hidden = false
  }

  function showFeedback(message, variant, scroll) {
    lastMessage = message
    feedback.textContent = message
    feedback.className = `upload-feedback ${variant}`
    feedback.hidden = false
    if (scroll) {
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  function clearFeedback() {
    lastMessage = ''
    feedback.textContent = ''
    feedback.className = 'upload-feedback'
    feedback.hidden = true
  }

  function showPreview(blob) {
    if (!preview) {
      return
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    previewUrl = URL.createObjectURL(blob)
    preview.src = previewUrl
    preview.classList.remove('CACHER')
    preview.style.display = 'block'
  }

  function resetSelection() {
    input.value = ''
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      previewUrl = null
    }
    if (preview) {
      preview.removeAttribute('src')
      preview.classList.add('CACHER')
      preview.style.display = 'none'
    }
  }

  async function handleSelection() {
    const file = input.files && input.files[0]
    blocked = false

    if (!file) {
      clearFeedback()
      return
    }

    // 1. Type de fichier accepté ?
    if (!ALLOWED_TYPES.includes(file.type)) {
      blocked = true
      resetSelection()
      showFeedback(messages.type, 'error', true)
      return
    }

    showPreview(file)

    // 2. Fichier trop lourd : on prévient puis on compresse
    const wasTooLarge = file.size > MAX_FILE_SIZE
    pending = true
    if (wasTooLarge) {
      showFeedback(fillTemplate(messages.compressing, { size: formatSize(file.size) }), 'info')
    }

    const compressed = await compressImage(file)
    pending = false

    const smaller = compressed && compressed.size < file.size ? compressed : null
    const finalBlob = smaller || file

    // 3. Impossible de passer sous la limite : erreur bloquante
    if (finalBlob.size > MAX_FILE_SIZE) {
      blocked = true
      resetSelection()
      showFeedback(fillTemplate(messages.limit, { size: formatSize(MAX_FILE_SIZE) }), 'error', true)
      return
    }

    if (smaller) {
      // Navigateur sans DataTransfer : le fichier d'origine reste envoyé,
      // ce qui est acceptable puisqu'il respecte déjà la limite
      replaceInputFile(input, smaller, file.name)
      showPreview(smaller)

      if (wasTooLarge) {
        showFeedback(
          fillTemplate(messages.compressed, {
            before: formatSize(file.size),
            after: formatSize(smaller.size),
          }),
          'success',
          false
        )
      } else {
        clearFeedback()
      }
      return
    }

    clearFeedback()
  }

  input.addEventListener('change', handleSelection)

  if (form) {
    form.addEventListener('submit', (event) => {
      if (pending) {
        event.preventDefault()
        showFeedback(
          fillTemplate(messages.compressing, { size: formatSize(MAX_FILE_SIZE) }),
          'info',
          true
        )
        return
      }
      if (blocked) {
        event.preventDefault()
        showFeedback(
          lastMessage || fillTemplate(messages.limit, { size: formatSize(MAX_FILE_SIZE) }),
          'error',
          true
        )
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', initImageUpload)

if (document.readyState !== 'loading') {
  initImageUpload()
}
