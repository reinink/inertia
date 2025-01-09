import { FormDataConvertible, Method, Progress, router, VisitOptions } from '@inertiajs/core'
import isEqual from 'lodash.isequal'
import { useCallback, useEffect, useRef, useState } from 'react'
import useRemember from './useRemember'

type FormDataKeys<T> = {
  [K in keyof T & string]: T[K] extends object
    ? T[K] extends Array<any>
      ? K
      : `${K}.${FormDataKeys<T[K]>}` | K
    : K;
}[keyof T & string];

type setDataByObject<TForm> = (data: TForm) => void
type setDataByMethod<TForm> = (data: (previousData: TForm) => TForm) => void
type setDataByKeyValuePair<TForm> = <K extends keyof TForm>(key: K, value: TForm[K]) => void
type FormDataType = object

export interface InertiaFormProps<TForm extends FormDataType> {
  data: TForm
  isDirty: boolean
  errors: Partial<Record<FormDataKeys<TForm>, string>>
  hasErrors: boolean
  processing: boolean
  progress: Progress | null
  wasSuccessful: boolean
  recentlySuccessful: boolean
  setData: setDataByObject<TForm> & setDataByMethod<TForm> & setDataByKeyValuePair<TForm>
  transform: (callback: (data: TForm) => object) => void
  setDefaults(): void
  setDefaults(field: keyof TForm, value: FormDataConvertible): void
  setDefaults(fields: Partial<TForm>): void
  reset: (...fields: (keyof TForm)[]) => void
  clearErrors: (...fields: FormDataKeys<TForm>[]) => void
  setError(field: FormDataKeys<TForm>, value: string): void
  setError(errors: Partial<Record<FormDataKeys<TForm>, string>>): void
  submit: (method: Method, url: string, options?: VisitOptions) => void
  get: (url: string, options?: VisitOptions) => void
  patch: (url: string, options?: VisitOptions) => void
  post: (url: string, options?: VisitOptions) => void
  put: (url: string, options?: VisitOptions) => void
  delete: (url: string, options?: VisitOptions) => void
  cancel: () => void
}
export default function useForm<TForm extends FormDataType>(initialValues?: TForm): InertiaFormProps<TForm>
export default function useForm<TForm extends FormDataType>(
  rememberKey: string,
  initialValues?: TForm,
): InertiaFormProps<TForm>
export default function useForm<TForm extends FormDataType>(
  rememberKeyOrInitialValues?: string | TForm,
  maybeInitialValues?: TForm,
): InertiaFormProps<TForm> {
  const isMounted = useRef(null)
  const rememberKey = typeof rememberKeyOrInitialValues === 'string' ? rememberKeyOrInitialValues : null
  const [defaults, setDefaults] = useState(
    (typeof rememberKeyOrInitialValues === 'string' ? maybeInitialValues : rememberKeyOrInitialValues) || ({} as TForm),
  )
  const cancelToken = useRef(null)
  const recentlySuccessfulTimeoutId = useRef(null)
  const [data, setData] = rememberKey ? useRemember(defaults, `${rememberKey}:data`) : useState(defaults)
  const [errors, setErrors] = rememberKey
    ? useRemember({} as Partial<Record<FormDataKeys<TForm>, string>>, `${rememberKey}:errors`)
    : useState({} as Partial<Record<FormDataKeys<TForm>, string>>)
  const [hasErrors, setHasErrors] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [wasSuccessful, setWasSuccessful] = useState(false)
  const [recentlySuccessful, setRecentlySuccessful] = useState(false)
  let transform = (data) => data

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const submit = useCallback(
    (method, url, options: VisitOptions = {}) => {
      const _options = {
        ...options,
        onCancelToken: (token) => {
          cancelToken.current = token

          if (options.onCancelToken) {
            return options.onCancelToken(token)
          }
        },
        onBefore: (visit) => {
          setWasSuccessful(false)
          setRecentlySuccessful(false)
          clearTimeout(recentlySuccessfulTimeoutId.current)

          if (options.onBefore) {
            return options.onBefore(visit)
          }
        },
        onStart: (visit) => {
          setProcessing(true)

          if (options.onStart) {
            return options.onStart(visit)
          }
        },
        onProgress: (event) => {
          setProgress(event)

          if (options.onProgress) {
            return options.onProgress(event)
          }
        },
        onSuccess: (page) => {
          if (isMounted.current) {
            setProcessing(false)
            setProgress(null)
            setErrors({})
            setHasErrors(false)
            setWasSuccessful(true)
            setRecentlySuccessful(true)
            recentlySuccessfulTimeoutId.current = setTimeout(() => {
              if (isMounted.current) {
                setRecentlySuccessful(false)
              }
            }, 2000)
          }

          if (options.onSuccess) {
            return options.onSuccess(page)
          }
        },
        onError: (errors) => {
          if (isMounted.current) {
            setProcessing(false)
            setProgress(null)
            setErrors(errors as Partial<Record<FormDataKeys<TForm>, string>>)
            setHasErrors(true)
          }

          if (options.onError) {
            return options.onError(errors)
          }
        },
        onCancel: () => {
          if (isMounted.current) {
            setProcessing(false)
            setProgress(null)
          }

          if (options.onCancel) {
            return options.onCancel()
          }
        },
        onFinish: (visit) => {
          if (isMounted.current) {
            setProcessing(false)
            setProgress(null)
          }

          cancelToken.current = null

          if (options.onFinish) {
            return options.onFinish(visit)
          }
        },
      }

      if (method === 'delete') {
        router.delete(url, { ..._options, data: transform(data) })
      } else {
        router[method](url, transform(data), _options)
      }
    },
    [data, setErrors, transform],
  )

  return {
    data,
    setData(keyOrData: keyof TForm | Function | TForm, maybeValue?: TForm[keyof TForm]) {
      if (typeof keyOrData === 'string') {
        setData((data) => ({ ...data, [keyOrData]: maybeValue }))
      } else if (typeof keyOrData === 'function') {
        setData((data) => keyOrData(data))
      } else {
        setData(keyOrData as TForm)
      }
    },
    isDirty: !isEqual(data, defaults),
    errors,
    hasErrors,
    processing,
    progress,
    wasSuccessful,
    recentlySuccessful,
    transform(callback) {
      transform = callback
    },
    setDefaults(fieldOrFields?: keyof TForm | Partial<TForm>, maybeValue?: FormDataConvertible) {
      if (typeof fieldOrFields === 'undefined') {
        setDefaults(() => data)
      } else {
        setDefaults((defaults) => ({
          ...defaults,
          ...(typeof fieldOrFields === 'string' ? { [fieldOrFields]: maybeValue } : (fieldOrFields as TForm)),
        }))
      }
    },
    reset(...fields) {
      if (fields.length === 0) {
        setData(defaults)
      } else {
        setData(
          (Object.keys(defaults) as Array<keyof TForm>)
            .filter((key) => fields.includes(key))
            .reduce(
              (carry, key) => {
                carry[key] = defaults[key]
                return carry
              },
              { ...data },
            ),
        )
      }
    },
    setError(fieldOrFields: FormDataKeys<TForm> | Partial<Record<FormDataKeys<TForm>, string>>, maybeValue?: string) {
      setErrors((errors) => {
        const newErrors = {
          ...errors,
          ...(typeof fieldOrFields === 'string'
            ? { [fieldOrFields]: maybeValue }
            : fieldOrFields),
        }
        setHasErrors(Object.keys(newErrors).length > 0)
        return newErrors
      })
    },
    clearErrors(...fields) {
      setErrors((errors) => {
        const newErrors = Object.keys(errors).reduce(
          (carry, field) => ({
            ...carry,
            ...(fields.length > 0 && !fields.includes(field as FormDataKeys<TForm>) ? { [field]: errors[field as FormDataKeys<TForm>] } : {}),
          }),
          {},
        )
        setHasErrors(Object.keys(newErrors).length > 0)
        return newErrors
      })
    },
    submit,
    get(url, options) {
      submit('get', url, options)
    },
    post(url, options) {
      submit('post', url, options)
    },
    put(url, options) {
      submit('put', url, options)
    },
    patch(url, options) {
      submit('patch', url, options)
    },
    delete(url, options) {
      submit('delete', url, options)
    },
    cancel() {
      if (cancelToken.current) {
        cancelToken.current.cancel()
      }
    },
  }
}
