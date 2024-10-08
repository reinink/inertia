import { FormDataConvertible, Method, Progress, router, VisitOptions } from '@inertiajs/core'
import isEqual from 'lodash.isequal'
import { useCallback, useEffect, useRef, useState } from 'react'
import useRemember from './useRemember'

type setDataByObject<TForm> = (data: TForm) => void
type setDataByMethod<TForm> = (data: (previousData: TForm) => TForm) => void
type setDataByKeyValuePair<TForm> = <K extends keyof TForm>(key: K, value: TForm[K]) => void
type FormDataType = object
type FormErrors<TForm> = Partial<Record<keyof TForm, string>>
type SubmitCallbackFunction = (method: Method, url: string, options: Partial<VisitOptions>) => void

export interface InertiaFormProps<TForm extends FormDataType> {
  data: TForm
  isDirty: boolean
  errors: FormErrors<TForm>
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
  clearErrors: (...fields: (keyof TForm)[]) => void
  setError(field: keyof TForm, value: string): void
  setError(errors: FormErrors<TForm>): void
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
    ? useRemember({} as Partial<Record<keyof TForm, string>>, `${rememberKey}:errors`)
    : useState({} as Partial<Record<keyof TForm, string>>)
  const [hasErrors, setHasErrors] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [wasSuccessful, setWasSuccessful] = useState(false)
  const [recentlySuccessful, setRecentlySuccessful] = useState(false)
  const transform = useRef((data) => data)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const submit = useCallback<SubmitCallbackFunction>(
    (method, url, options = {}) => {
      const _options: VisitOptions = {
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
            setErrors(errors as FormErrors<TForm>)
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
        router.delete(url, { ..._options, data: transform.current(data) })
      } else {
        router[method](url, transform.current(data), _options)
      }
    },
    [data, setErrors],
  )

  const setDataFunction = useCallback(
    (keyOrData: keyof TForm | Function | TForm, maybeValue?: TForm[keyof TForm]) => {
      if (typeof keyOrData === 'string') {
        setData((data) => ({ ...data, [keyOrData]: maybeValue }))
      } else if (typeof keyOrData === 'function') {
        setData((data) => keyOrData(data))
      } else {
        setData(keyOrData as TForm)
      }
    },
    [setData],
  )

  const setDefaultsFunction = useCallback(
    (fieldOrFields?: keyof TForm | Partial<TForm>, maybeValue?: FormDataConvertible) => {
      if (typeof fieldOrFields === 'undefined') {
        setDefaults(() => data)
      } else {
        setDefaults((defaults) => ({
          ...defaults,
          ...(typeof fieldOrFields === 'string' ? { [fieldOrFields]: maybeValue } : (fieldOrFields as TForm)),
        }))
      }
    },
    [data, setDefaults],
  )

  const reset = useCallback(
    (...fields) => {
      if (fields.length === 0) {
        setData(defaults)
      } else {
        setData((data) =>
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
    [setData, defaults],
  )

  const setError = useCallback(
    (fieldOrFields: keyof TForm | FormErrors<TForm>, maybeValue?: string) => {
      setErrors((errors) => {
        const newErrors = {
          ...errors,
          ...(typeof fieldOrFields === 'string'
            ? { [fieldOrFields]: maybeValue }
            : (fieldOrFields as FormErrors<TForm>)),
        }
        setHasErrors(Object.keys(newErrors).length > 0)
        return newErrors
      })
    },
    [setErrors, setHasErrors],
  )

  const clearErrors = useCallback(
    (...fields) => {
      setErrors((errors) => {
        const newErrors = (Object.keys(errors) as Array<keyof TForm>).reduce(
          (carry, field) => ({
            ...carry,
            ...(fields.length > 0 && !fields.includes(field) ? { [field]: errors[field] } : {}),
          }),
          {},
        )
        setHasErrors(Object.keys(newErrors).length > 0)
        return newErrors
      })
    },
    [setErrors, setHasErrors],
  )

  const createSubmitMethod = (method) => (url, options) => {
    submit(method, url, options)
  }
  const get = useCallback(createSubmitMethod('get'), [submit])
  const post = useCallback(createSubmitMethod('post'), [submit])
  const put = useCallback(createSubmitMethod('put'), [submit])
  const patch = useCallback(createSubmitMethod('patch'), [submit])
  const deleteMethod = useCallback(createSubmitMethod('delete'), [submit])

  const cancel = useCallback(() => {
    if (cancelToken.current) {
      cancelToken.current.cancel()
    }
  }, [])

  const transformFunction = useCallback((callback) => {
    transform.current = callback
  }, [])

  return {
    data,
    setData: setDataFunction,
    isDirty: !isEqual(data, defaults),
    errors,
    hasErrors,
    processing,
    progress,
    wasSuccessful,
    recentlySuccessful,
    transform: transformFunction,
    setDefaults: setDefaultsFunction,
    reset,
    setError,
    clearErrors,
    submit,
    get,
    post,
    put,
    patch,
    delete: deleteMethod,
    cancel,
  }
}
