import { FormDataConvertible, SerializationArrayFormat } from './types'

export function objectToFormData(
  source: Record<string, FormDataConvertible>,
  form: FormData,
  parentKey: string | null,
  formDataArrayFormat: SerializationArrayFormat,
): FormData {
  source = source || {}

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      append(form, composeObjectKey(parentKey, key), source[key], formDataArrayFormat)
    }
  }

  return form
}

function composeKey(parent: string | null, key: string, format: SerializationArrayFormat): string {
  if (!parent) return key

  switch (format) {
    case 'indices':
      return `${parent}[${key}]`
    case 'brackets':
      return `${parent}[]`
  }
}

function composeObjectKey(parent: string | null, key: string): string {
  return composeKey(parent, key, 'indices')
}

function append(
  form: FormData,
  key: string,
  value: FormDataConvertible,
  formDataArrayFormat: SerializationArrayFormat,
): void {
  if (Array.isArray(value)) {
    return Array.from(value.keys()).forEach((index) =>
      append(form, composeKey(key, index.toString(), formDataArrayFormat), value[index], formDataArrayFormat),
    )
  } else if (value instanceof Date) {
    return form.append(key, value.toISOString())
  } else if (value instanceof File) {
    return form.append(key, value, value.name)
  } else if (value instanceof Blob) {
    return form.append(key, value)
  } else if (typeof value === 'boolean') {
    return form.append(key, value ? '1' : '0')
  } else if (typeof value === 'string') {
    return form.append(key, value)
  } else if (typeof value === 'number') {
    return form.append(key, `${value}`)
  } else if (value === null || value === undefined) {
    return form.append(key, '')
  }

  objectToFormData(value, form, key, formDataArrayFormat)
}
