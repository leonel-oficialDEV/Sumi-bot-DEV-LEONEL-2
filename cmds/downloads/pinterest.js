import fetch from 'node-fetch'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

const PINTEREST_HOSTS = [
  'https://www.pinterest.com',
  'https://id.pinterest.com'
]

export default {
  command: ['pinterest', 'pin'],
  category: 'downloads',
  description: 'Buscar y descarga imágenes y videos de Pinterest.',
  run: async ({ msg, sock, args, usedPrefix, command }) => {
    const text = args.join(' ').trim()
    const isPinterestUrl = /^https?:\/\//i.test(text)

    if (!text) {
      return msg.reply('《✧》 Por favor, ingresa un término de búsqueda o un enlace de Pinterest.')
    }

    try {
      if (isPinterestUrl) {
        const data = await getPinterestDownload(text)

        if (!data) {
          return msg.reply('ꕥ No se pudo obtener el contenido.')
        }

        if (data.type === 'video') {
          const caption = `ㅤ۟∩　ׅ　★　ׅ　🅟𝖨𝖭 🅓ownload　ׄᰙ　\n\n${data.title ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Título* › ${data.title}\n` : ''}${data.description ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Descripción* › ${data.description}\n` : ''}${data.author ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Autor* › ${data.author}\n` : ''}${data.username ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Usuario* › ${data.username}\n` : ''}${data.followers !== null && data.followers !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Seguidores* › ${formatNumber(data.followers)}\n` : ''}${data.uploadDate ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Fecha* › ${data.uploadDate}\n` : ''}${data.likes !== null && data.likes !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Likes* › ${formatNumber(data.likes)}\n` : ''}${data.comments !== null && data.comments !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Comentarios* › ${formatNumber(data.comments)}\n` : ''}${data.views !== null && data.views !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Vistas* › ${formatNumber(data.views)}\n` : ''}${data.saved !== null && data.saved !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Guardados* › ${formatNumber(data.saved)}\n` : ''}${data.format ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Formato* › ${data.format}\n` : ''}𖣣ֶㅤ֯⌗ ☆  ⬭ *Enlace* › ${text}`

          await sock.sendMessage(
            msg.chat,
            {
              video: data.buffer,
              caption,
              mimetype: 'video/mp4',
              fileName: data.filename || 'pin.mp4'
            },
            { quoted: msg }
          )

          return
        }

        if (data.type === 'image') {
          await sock.sendMessage(
            msg.chat,
            {
              image: data.buffer
            },
            { quoted: msg }
          )

          return
        }

        throw new Error('Contenido no soportado.')
      }

      const results = await getPinterestSearch(text, 10)

      if (!results || results.length === 0) {
        return msg.reply(`《✧》 No se encontraron resultados para *${text}*.`)
      }

      const medias = []

      for (const r of results.slice(0, 10)) {
        if (!r.image) continue

        try {
          const buffer = await downloadBuffer(r.image)

          if (!buffer || buffer.length < 1000) continue

          if (r.type === 'video') {
            const caption = `ㅤ۟∩　ׅ　★　ׅ　🅟𝖨𝖭 🅢earch　ׄᰙ　\n\n${r.title ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Título* › ${r.title}\n` : ''}${r.description ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Descripción* › ${r.description}\n` : ''}${r.name ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Autor* › ${r.name}\n` : ''}${r.username ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Usuario* › ${r.username}\n` : ''}${r.followers !== null && r.followers !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Seguidores* › ${formatNumber(r.followers)}\n` : ''}${r.likes !== null && r.likes !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Likes* › ${formatNumber(r.likes)}\n` : ''}${r.comments !== null && r.comments !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Comentarios* › ${formatNumber(r.comments)}\n` : ''}${r.saves !== null && r.saves !== undefined ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Guardados* › ${formatNumber(r.saves)}\n` : ''}${r.created_at ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Fecha* › ${formatPinterestDate(r.created_at)}\n` : ''}${r.format ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Formato* › ${r.format}\n` : ''}${r.url ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Enlace* › ${r.url}\n` : ''}`

            medias.push({
              type: 'video',
              data: buffer,
              caption
            })
          } else {
            medias.push({
              type: 'image',
              data: buffer,
              caption: ''
            })
          }
        } catch {}
      }

      if (!medias.length) {
        return msg.reply(`《✧》 No se pudieron obtener descargas válidas para *${text}*.`)
      }

      if (medias.length === 1) {
        const media = medias[0]

        if (media.type === 'video') {
          await sock.sendMessage(
            msg.chat,
            {
              video: media.data,
              caption: media.caption,
              mimetype: 'video/mp4',
              fileName: 'pinterest.mp4'
            },
            { quoted: msg }
          )
        } else {
          await sock.sendMessage(
            msg.chat,
            {
              image: media.data
            },
            { quoted: msg }
          )
        }

        return
      }

      if (typeof sock.sendAlbumMessage === 'function') {
        await sock.sendAlbumMessage(
          msg.chat,
          medias,
          { quoted: msg }
        )
      } else {
        for (const media of medias) {
          if (media.type === 'video') {
            await sock.sendMessage(
              msg.chat,
              {
                video: media.data,
                caption: media.caption,
                mimetype: 'video/mp4',
                fileName: 'pinterest.mp4'
              },
              { quoted: msg }
            )
          } else {
            await sock.sendMessage(
              msg.chat,
              {
                image: media.data
              },
              { quoted: msg }
            )
          }

          await sleep(500)
        }
      }
    } catch (e) {
      await msg.reply(
        `> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`
      )
    }
  }
}

async function getPinterestDownload(url) {
  const clean = cleanUrl(url)

  for (const host of PINTEREST_HOSTS) {
    try {
      const response = await fetch(clean, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        },
        redirect: 'follow'
      })

      if (!response.ok) continue

      const html = await response.text()
      const metadata = extractPinMetadata(html)

      const videos = extractVideoUrls(html)

      if (videos.length) {
        const videoUrl = videos[0]
        const buffer = await downloadBuffer(videoUrl, clean)

        if (buffer) {
          return {
            type: 'video',
            url: videoUrl,
            buffer,
            format: 'mp4',
            filename: 'pinterest.mp4',
            ...metadata
          }
        }
      }

      const images = extractImageUrls(html)

      if (images.length) {
        const imageUrl = images[0]
        const buffer = await downloadBuffer(imageUrl, clean)

        if (buffer) {
          return {
            type: 'image',
            url: imageUrl,
            buffer,
            format: getExtension(imageUrl),
            filename: `pinterest.${getExtension(imageUrl)}`,
            ...metadata
          }
        }
      }
    } catch {}
  }

  return null
}

async function getPinterestSearch(query, limit = 10) {
  try {
    const results = await pinterestInternalSearch(query, limit)

    if (results.length >= limit) {
      return results.slice(0, limit)
    }

    if (results.length) {
      return results.slice(0, limit)
    }
  } catch {}

  return []
}

async function pinterestInternalSearch(query, limit = 10) {
  const results = []
  const seen = new Set()

  for (const host of PINTEREST_HOSTS) {
    if (results.length >= limit) break

    try {
      const cookies = await getPinterestCookies(host)
      const sourceUrl = `/search/pins/?q=${encodeURIComponent(query)}`

      let bookmark = null

      while (results.length < limit) {
        const data = {
          options: {
            query,
            scope: 'pins',
            bookmarks: bookmark ? [bookmark] : []
          },
          context: {}
        }

        const endpoint =
          `${host}/resource/BaseSearchResource/get/`

        const body =
          `source_url=${encodeURIComponent(sourceUrl)}&data=${encodeURIComponent(JSON.stringify(data))}`

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            Accept: 'application/json,text/javascript,*/*;q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': cookies.csrf || '',
            'X-Pinterest-Source-Url': sourceUrl,
            Referer: `${host}${sourceUrl}`,
            Cookie: cookies.cookie || ''
          },
          body
        })

        if (!response.ok) {
          throw new Error(`Pinterest respondió ${response.status}`)
        }

        const json = await response.json()
        const resource = json?.resource_response
        const pins = resource?.data?.results

        if (!Array.isArray(pins) || !pins.length) {
          break
        }

        for (const pin of pins) {
          if (results.length >= limit) break

          const image = getBestPinImage(pin)

          if (!image) continue

          const original = originalPinterestUrl(image)

          if (!original || !isRealPinterestPinImage(original)) {
            continue
          }

          const key = cleanUrl(original).split('?')[0]

          if (seen.has(key)) continue

          seen.add(key)

          const video = getBestPinVideo(pin)
          const metadata = extractPinObjectMetadata(pin)

          results.push({
            ...metadata,
            id: pin?.id || metadata.id || null,
            type: video ? 'video' : 'image',
            image: video || original,
            url: pin?.link || pin?.url || null,
            format: video ? 'mp4' : getExtension(original)
          })
        }

        const nextBookmark = resource?.bookmark

        if (
          !nextBookmark ||
          nextBookmark === bookmark ||
          pins.length === 0 ||
          results.length >= limit
        ) {
          break
        }

        bookmark = nextBookmark
      }
    } catch {}
  }

  return results.slice(0, limit)
}

async function getPinterestCookies(host) {
  try {
    const response = await fetch(host, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml'
      }
    })

    const setCookie = response.headers.get('set-cookie') || ''

    const csrfMatch = setCookie.match(/csrftoken=([^;]+)/)
    const sessionMatch = setCookie.match(/_pinterest_sess=([^;]+)/)

    const cookies = []

    if (csrfMatch) {
      cookies.push(`csrftoken=${csrfMatch[1]}`)
    }

    if (sessionMatch) {
      cookies.push(`_pinterest_sess=${sessionMatch[1]}`)
    }

    return {
      csrf: csrfMatch ? csrfMatch[1] : '',
      cookie: cookies.join('; ')
    }
  } catch {
    return {
      csrf: '',
      cookie: ''
    }
  }
}

async function downloadBuffer(url, referer = 'https://www.pinterest.com/') {
  const response = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Referer: referer,
      Accept: '*/*'
    },
    redirect: 'follow'
  })

  if (!response.ok) {
    throw new Error(`No se pudo descargar el archivo: ${response.status}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

function getBestPinImage(pin) {
  const images = pin?.images || {}

  const candidates = [
    images.orig,
    images['1200x'],
    images['736x'],
    images['564x'],
    images['474x'],
    images['400x'],
    images['236x'],
    images['170x']
  ]

  for (const item of candidates) {
    const url = typeof item === 'string' ? item : item?.url

    if (!url || !isPinterestImage(url)) continue

    const original = originalPinterestUrl(url)

    if (isRealPinterestPinImage(original)) {
      return original
    }
  }

  return null
}

function getBestPinVideo(pin) {
  const videos = pin?.videos || {}

  const candidates = [
    videos.V_HLSV4,
    videos.V_HLSV4?.url,
    videos.video_list?.V_HLSV4,
    videos.video_list?.V_HLSV4?.url
  ]

  for (const item of candidates) {
    const url = typeof item === 'string' ? item : item?.url

    if (url && isPinterestVideo(url)) {
      return url
    }
  }

  return null
}

function extractPinObjectMetadata(pin) {
  const creator = pin?.pinner || pin?.user || pin?.creator || {}
  const board = pin?.board || {}

  return {
    id: pin?.id || null,
    title: pin?.title || pin?.grid_title || null,
    description: pin?.description || pin?.description_html || null,
    name:
      creator?.full_name ||
      creator?.name ||
      null,
    username:
      creator?.username ||
      null,
    followers:
      creator?.follower_count ??
      creator?.followers_count ??
      null,
    likes:
      pin?.like_count ??
      pin?.likes ??
      pin?.reaction_count ??
      null,
    comments:
      pin?.comment_count ??
      pin?.comments ??
      null,
    saves:
      pin?.save_count ??
      pin?.repin_count ??
      pin?.saves ??
      null,
    created_at:
      pin?.created_at ||
      pin?.createdAt ||
      null,
    board:
      board?.name ||
      pin?.board_name ||
      null,
    board_id:
      board?.id ||
      pin?.board_id ||
      null,
    source:
      pin?.link ||
      pin?.url ||
      null
  }
}

function extractPinMetadata(html) {
  const metadata = {
    id: null,
    title: null,
    description: null,
    author: null,
    username: null,
    followers: null,
    likes: null,
    comments: null,
    views: null,
    saved: null,
    uploadDate: null,
    source: null
  }

  try {
    const jsonLdMatches = [
      ...html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      )
    ]

    for (const match of jsonLdMatches) {
      try {
        const parsed = JSON.parse(match[1])
        const items = Array.isArray(parsed) ? parsed : [parsed]

        for (const item of items) {
          if (!item || typeof item !== 'object') continue

          metadata.title =
            metadata.title ||
            item.name ||
            item.headline ||
            null

          metadata.description =
            metadata.description ||
            item.description ||
            null

          metadata.source =
            metadata.source ||
            item.url ||
            null

          metadata.uploadDate =
            metadata.uploadDate ||
            item.datePublished ||
            item.uploadDate ||
            null

          if (item.author) {
            const author =
              typeof item.author === 'string'
                ? item.author
                : item.author?.name

            metadata.author =
              metadata.author ||
              author ||
              null
          }
        }
      } catch {}
    }
  } catch {}

  const idMatch =
    html.match(/"pin_id":"?(\d+)"/i) ||
    html.match(/"id":"(\d+)"/i)

  if (idMatch) {
    metadata.id = idMatch[1]
  }

  const usernameMatch =
    html.match(/"username":"([^"]+)"/i)

  if (usernameMatch) {
    metadata.username = decodeHtml(usernameMatch[1])
  }

  const authorMatch =
    html.match(/"full_name":"([^"]+)"/i)

  if (authorMatch) {
    metadata.author =
      metadata.author ||
      decodeHtml(authorMatch[1])
  }

  const followersMatch =
    html.match(/"follower_count":(\d+)/i) ||
    html.match(/"followers_count":(\d+)/i)

  if (followersMatch) {
    metadata.followers = Number(followersMatch[1])
  }

  const likesMatch =
    html.match(/"like_count":(\d+)/i) ||
    html.match(/"likes":(\d+)/i)

  if (likesMatch) {
    metadata.likes = Number(likesMatch[1])
  }

  const commentsMatch =
    html.match(/"comment_count":(\d+)/i) ||
    html.match(/"comments":(\d+)/i)

  if (commentsMatch) {
    metadata.comments = Number(commentsMatch[1])
  }

  const savesMatch =
    html.match(/"save_count":(\d+)/i) ||
    html.match(/"repin_count":(\d+)/i)

  if (savesMatch) {
    metadata.saved = Number(savesMatch[1])
  }

  const titleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) ||
    html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)/i)

  if (titleMatch) {
    metadata.title =
      metadata.title ||
      decodeHtml(titleMatch[1])
  }

  const descriptionMatch =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i) ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)

  if (descriptionMatch) {
    metadata.description =
      metadata.description ||
      decodeHtml(descriptionMatch[1])
  }

  return metadata
}

function extractImageUrls(html) {
  const urls = new Set()

  const patterns = [
    /https?:\\?\/\\?\/[^"'\\\s<>]+?\.pinimg\.com[^"'\\\s<>]*/gi,
    /https?:\/\/[^"'\\\s<>]+?\.pinimg\.com[^"'\\\s<>]*/gi
  ]

  for (const pattern of patterns) {
    const matches = html.match(pattern) || []

    for (let url of matches) {
      url = url
        .replace(/\\u002F/g, '/')
        .replace(/\\\//g, '/')
        .replace(/\\u003D/g, '=')
        .replace(/\\u0026/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/["'\\]+$/g, '')

      const original = originalPinterestUrl(url)

      if (
        isPinterestImage(original) &&
        isRealPinterestPinImage(original)
      ) {
        urls.add(original)
      }
    }
  }

  return [...urls]
}

function extractVideoUrls(html) {
  const urls = new Set()

  const patterns = [
    /https?:\\?\/\\?\/[^"'\\\s<>]+?\.pinimg\.com\/videos\/[^"'\\\s<>]+/gi,
    /https?:\/\/[^"'\\\s<>]+?\.pinimg\.com\/videos\/[^"'\\\s<>]+/gi
  ]

  for (const pattern of patterns) {
    const matches = html.match(pattern) || []

    for (let url of matches) {
      url = url
        .replace(/\\u002F/g, '/')
        .replace(/\\\//g, '/')
        .replace(/\\u003D/g, '=')
        .replace(/\\u0026/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/["'\\]+$/g, '')

      if (isPinterestVideo(url)) {
        urls.add(url)
      }
    }
  }

  return [...urls]
}

function isPinterestImage(url) {
  return /pinimg\.com\/.*\.(jpg|jpeg|png|webp)(?:\?|$)/i.test(url)
}

function isRealPinterestPinImage(url) {
  if (!isPinterestImage(url)) return false

  const value = url.toLowerCase()

  if (
    value.includes('/pinimg.com/avatars/') ||
    value.includes('/pinimg.com/favicons/') ||
    value.includes('/pinimg.com/webapp/') ||
    value.includes('/pinimg.com/logos/') ||
    value.includes('/pinimg.com/assets/')
  ) {
    return false
  }

  if (
    value.includes('logo') ||
    value.includes('pinterest-icon') ||
    value.includes('favicon') ||
    value.includes('pinterest-logo')
  ) {
    return false
  }

  return true
}

function isPinterestVideo(url) {
  return /pinimg\.com\/videos\/.*\.(mp4|m3u8)(?:\?|$)/i.test(url)
}

function originalPinterestUrl(url) {
  return url
    .replace(/\/\d+x\d+\//i, '/originals/')
    .replace(/\/\d+x\d+_/i, '/originals/')
}

function cleanUrl(url) {
  return url.trim().replace(/[<>"']/g, '')
}

function decodeHtml(text) {
  if (!text) return text

  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function formatNumber(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return value
  }

  return new Intl.NumberFormat('es').format(number)
}

function formatPinterestDate(value) {
  try {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString('es-HN', {
      dateStyle: 'medium',
  