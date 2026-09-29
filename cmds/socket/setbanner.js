import fs from 'fs/promises'
import path from 'path'
import db from '#db'

const bannerDir =
  path.resolve('./menus/database/banners')

async function guardarBanner(buffer, mime, idBot) {

  if (
    !Buffer.isBuffer(buffer) ||
    !buffer.length
  ) {
    throw new Error(
      'El archivo recibido está vacío.'
    )
  }

  await fs.mkdir(
    bannerDir,
    {
      recursive: true
    }
  )

  let extension = 'jpg'

  if (mime.includes('png')) {
    extension = 'png'
  } else if (mime.includes('gif')) {
    extension = 'gif'
  } else if (mime.includes('mp4')) {
    extension = 'mp4'
  } else if (
    mime.includes('jpeg') ||
    mime.includes('jpg')
  ) {
    extension = 'jpg'
  }

  const safeId =
    String(idBot)
      .replace(
        /[^0-9a-zA-Z_-]/g,
        '_'
      )

  const archivo =
    path.join(
      bannerDir,
      `${safeId}.${extension}`
    )

  const anteriores =
    await fs.readdir(
      bannerDir
    ).catch(() => [])

  for (const nombre of anteriores) {

    if (
      nombre.startsWith(
        `${safeId}.`
      ) &&
      path.join(
        bannerDir,
        nombre
      ) !== archivo
    ) {
      await fs.unlink(
        path.join(
          bannerDir,
          nombre
        )
      ).catch(() => {})
    }
  }

  await fs.writeFile(
    archivo,
    buffer
  )

  return archivo
}

export default {
  command: [
    'setbanner',
    'setbotbanner'
  ],

  category: 'socket',

  description:
    'Cambiar el banner del menú.',

  run: async ({
    msg,
    sock,
    args
  }) => {

    const idBot =
      sock.user.id.split(':')[0] +
      '@s.whatsapp.net'

    let config =
      db.getSettings(idBot) || {}

    const isOwner2 =
      [
        idBot,
        ...(config.owner
          ? [config.owner]
          : []),
        ...global.owner.map(
          num =>
            num +
            '@s.whatsapp.net'
        )
      ].includes(
        msg.sender
      )

    if (!isOwner2)
      return sock.reply(
        msg.chat,
        global.mess.socket,
        msg
      )

    const value =
      args.join(' ').trim()

    if (
      !value &&
      !msg.quoted &&
      !msg.message?.imageMessage &&
      !msg.message?.videoMessage
    ) {
      return msg.reply(
        '✎ Debes enviar o citar una imagen o video para cambiar el banner del bot.'
      )
    }

    if (
      value &&
      /^https?:\/\//i.test(value)
    ) {
      db.setSettings(
        idBot,
        'banner',
        value
      )

      return msg.reply(
        `✿ Se ha actualizado el banner de *${config.namebot || 'Bot'}*!`
      )
    }

    const q =
      msg.quoted || msg

    const mime =
      (q.msg || q).mimetype ||
      q.mediaType ||
      ''

    if (
      !/image\/(png|jpe?g|gif)|video\/mp4/i.test(
        mime
      )
    ) {
      return msg.reply(
        '✎ Responde a una imagen o video válido.'
      )
    }

    let media = null

    try {

      if (
        typeof q.download === 'function'
      ) {
        media =
          await q.download()
      }

    } catch (error) {

      console.log(
        '✎ No se pudo descargar el banner:',
        error?.message || error
      )
    }

    if (
      !Buffer.isBuffer(media) ||
      !media.length
    ) {
      return msg.reply(
        '✎ No se pudo descargar el archivo.'
      )
    }

    try {

      const archivo =
        await guardarBanner(
          media,
          mime,
          idBot
        )

      db.setSettings(
        idBot,
        'banner',
        archivo
      )

      return msg.reply(
        `✿ Se ha actualizado el banner de *${config.namebot || 'Bot'}*!`
      )

    } catch (error) {

      console.error(
        '✎ Error guardando banner:',
        error
      )

      return msg.reply(
        `✎✎ No se pudo guardar el banner.\n\n${error?.message || 'Error desconocido.'}`
      )
    }
  }
}