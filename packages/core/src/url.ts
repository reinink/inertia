import deepmerge from 'deepmerge'
import * as qs from 'qs'
import { FormDataConvertible, Method, SerializationArrayFormat } from './types'

export function hrefToUrl(href: string | URL): URL {
  return new URL(href.toString(), window.location.toString())
}

export function mergeDataIntoQueryString(
  method: Method,
  href: URL | string,
  data: Record<string, FormDataConvertible>,
  qsArrayFormat: SerializationArrayFormat = 'brackets',
): [string, Record<string, FormDataConvertible>] {
  const hasHost = /^https?:\/\//.test(href.toString())
  const hasAbsolutePath = hasHost || href.toString().startsWith('/')
  const hasRelativePath = !hasAbsolutePath && !href.toString().startsWith('#') && !href.toString().startsWith('?')
  const hasSearch = href.toString().includes('?') || (method === 'get' && Object.keys(data).length)
  const hasHash = href.toString().includes('#')

  const url = new URL(href.toString(), 'http://localhost')

  if (method === 'get' && Object.keys(data).length) {
    url.search = qs.stringify(deepmerge(qs.parse(url.search, { ignoreQueryPrefix: true }), data), {
      encodeValuesOnly: true,
      arrayFormat: qsArrayFormat,
    })
    data = {}
  }

  return [
    [
      hasHost ? `${url.protocol}//${url.host}` : '',
      hasAbsolutePath ? url.pathname : '',
      hasRelativePath ? url.pathname.substring(1) : '',
      hasSearch ? url.search : '',
      hasHash ? url.hash : '',
    ].join(''),
    data,
  ]
}

export function urlWithoutHash(url: URL | Location): URL {
  url = new URL(url.href)
  url.hash = ''
  return url
}
