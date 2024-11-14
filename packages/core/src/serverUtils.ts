import type { IncomingMessage } from 'http'

export const readableToString: (readable: IncomingMessage) => Promise<string> = (readable) =>
  new Promise((resolve, reject) => {
    let data = ''
    readable.on('data', (chunk) => (data += chunk))
    readable.on('end', () => resolve(data))
    readable.on('error', (err) => reject(err))
  })
