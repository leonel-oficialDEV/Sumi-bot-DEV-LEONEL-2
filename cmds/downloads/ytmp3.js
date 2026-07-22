import yts from 'yt-search'
import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.js'

const isYTUrl = (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url)

async function getVideoInfo(query, videoMatch) {
  const search = await yts(query)
  if (!search.all.length) return null
  const videoInfo = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
  return videoInfo || null
}

export default {
  command: ['play', 'play2', 'mp3', 'ytmp3', 'ytv', 'mp4', 'ytmp4'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》Por favor, menciona el nombre o URL del video que deseas descargar')
      }

      const text = args.join(' ')
      const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
      const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text

      let url, title, thumbBuffer, videoInfo

      try {
        videoInfo = await getVideoInfo(query, videoMatch)
        if (videoInfo) {
          url = videoInfo.url
          title = videoInfo.title
          thumbBuffer = await getBuffer(videoInfo.image)
          const vistas = (videoInfo.views || 0).toLocaleString()
          const canal = videoInfo.author?.name || 'Desconocido'

          const infoMessage = `➩ Descargando › ${title}\n\n> ❖ Canal › *${canal}*\n> ⴵ Duración › *${videoInfo.timestamp || 'Desconocido'}*\n> ❀ Vistas › *${vistas}*\n> ❒ Enlace › *${url}*`
          await client.sendMessage(m.chat, { image: thumbBuffer, caption: infoMessage }, { quoted: m })
        }
      } catch (err) {}

      if (!url && isYTUrl(text)) url = text;
      if (!url) return m.reply('《✧》 No se pudo encontrar el video o enlace.')

      const isVideo = /play2|ytv|mp4|ytmp4/i.test(command)

      if (isVideo) {
        const videoData = await getVideoFromApis(url)
        if (!videoData?.url) return m.reply('《✧》 No se pudo obtener el *video*.')

        await client.sendMessage(m.chat, { 
            video: { url: videoData.url }, 
            caption: `✨ ${title || 'Video'}`, 
            mimetype: 'video/mp4' 
        }, { quoted: m })

      } else {
        const audioData = await getAudioFromApis(url)
        if (!audioData?.url) return m.reply('《✧》 No se pudo obtener el *audio*.')

        await client.sendMessage(m.chat, { 
            audio: { url: audioData.url }, 
            fileName: `${title || 'audio'}.mp3`, 
            mimetype: 'audio/mpeg' 
        }, { quoted: m })
      }

    } catch (e) {
      await m.reply(`> Error crítico: *${e.message}*`)
    }
  }
}

async function getAudioFromApis(url) {
  const apis = [
    { api: 'Delirius', endpoint: `https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res.status && res.data ? res.data.download : null },
    { api: 'Axi', endpoint: `${global.APIs.axi.url}/down/ytaudio?url=${encodeURIComponent(url)}`, extractor: res => res?.resultado?.url_dl },    
    { api: 'Stellar', endpoint: `${global.APIs.stellar.url}/dl/ytdl?url=${encodeURIComponent(url)}&format=mp3&key=${global.APIs.stellar.key}`, extractor: res => res.result?.download }
  ]
  for (const { api, endpoint, extractor } of apis) {
    try {
      const res = await fetch(endpoint).then(r => r.json())
      const link = extractor(res)
      if (link) return { url: link, api }
    } catch (e) {}
  }
  return null
}

async function getVideoFromApis(url) {
  const apis = [
    { api: 'Delirius', endpoint: `https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(url)}&format=360p`, extractor: res => res.status && res.data ? res.data.download : null },
    { api: 'Stellar', endpoint: `${global.APIs.stellar.url}/dl/ytdl?url=${encodeURIComponent(url)}&format=mp4&key=${global.APIs.stellar.key}`, extractor: res => res.result?.download }
  ]
  for (const { api, endpoint, extractor } of apis) {
    try {
      const res = await fetch(endpoint).then(r => r.json())
      const link = extractor(res)
      if (link) return { url: link, api }
    } catch (e) {}
  }
  return null
}