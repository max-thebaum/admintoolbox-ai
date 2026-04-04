import { Router }  from 'express'
import rateLimit   from 'express-rate-limit'
import multer      from 'multer'
import { Readable, PassThrough } from 'stream'
import { existsSync } from 'fs'
import ffmpeg      from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

// Use system ffmpeg on Linux (Alpine Docker), fallback to static binary for local dev
const ffmpegPath = existsSync('/usr/bin/ffmpeg') ? '/usr/bin/ffmpeg' : ffmpegStatic
ffmpeg.setFfmpegPath(ffmpegPath)

const router = Router()

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Zu viele Konvertierungen. Bitte in einer Stunde erneut versuchen.' })
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }  // 50 MB
})

const ALLOWED_AUDIO_EXT = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'])
const OUTPUT_FORMATS = {
  mp3:  { codec: 'libmp3lame', mime: 'audio/mpeg',  ext: 'mp3'  },
  wav:  { codec: 'pcm_s16le',  mime: 'audio/wav',   ext: 'wav'  },
  ogg:  { codec: 'libvorbis',  mime: 'audio/ogg',   ext: 'ogg'  },
  flac: { codec: 'flac',       mime: 'audio/flac',  ext: 'flac' },
}

// POST /api/converter/audio
router.post('/audio', limiter, upload.single('file'), (req, res) => {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'Keine Datei übermittelt.' })

  const ext = (file.originalname.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_AUDIO_EXT.has(ext)) {
    return res.status(400).json({ error: `Nicht unterstütztes Eingabeformat: .${ext}` })
  }

  const format = (req.body.format || '').toLowerCase()
  const outFmt = OUTPUT_FORMATS[format]
  if (!outFmt) return res.status(400).json({ error: 'Ungültiges Ausgabeformat.' })

  const bitrate    = Math.min(320, Math.max(64, parseInt(req.body.bitrate)    || 128))
  const sampleRate = [22050, 44100, 48000].includes(parseInt(req.body.samplerate))
    ? parseInt(req.body.samplerate) : 44100

  const inputStream  = Readable.from(file.buffer)
  const outputStream = new PassThrough()

  const origName = file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\-. ]/g, '_')

  res.setHeader('Content-Type',        outFmt.mime)
  res.setHeader('Content-Disposition', `attachment; filename="${origName}.${outFmt.ext}"`)
  outputStream.pipe(res)

  const timer = setTimeout(() => {
    try { cmd.kill('SIGKILL') } catch {}
    if (!res.headersSent) res.status(504).json({ error: 'Timeout bei der Konvertierung.' })
  }, 60000)

  const cmd = ffmpeg(inputStream)
    .inputFormat(ext === 'm4a' ? 'mp4' : ext)
    .audioCodec(outFmt.codec)
    .audioFrequency(sampleRate)
    .toFormat(outFmt.ext)
    .on('end', () => clearTimeout(timer))
    .on('error', (e) => {
      clearTimeout(timer)
      console.error('[converter/audio]', e.message)
      if (!res.headersSent) res.status(500).json({ error: 'Konvertierung fehlgeschlagen: ' + e.message })
    })

  // Add bitrate for lossy formats
  if (['mp3', 'ogg'].includes(format)) cmd.audioBitrate(bitrate)

  cmd.pipe(outputStream, { end: true })
})

export default router
