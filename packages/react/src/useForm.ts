import { FormDataConvertible, FormDataKeys, Method, Progress, router, VisitOptions } from '@inertiajs/core'
import { cloneDeep, get, has, isEqual, set } from 'lodash'
import { useCallback, useEffect, useRef, useState } from 'react'
import useRemember from './useRemember'

type setDataByObject<TForm> = (data: TForm) => void
type setDataByMethod<TForm> = (data: (previousData: TForm) => TForm) => void
type setDataByKeyValuePair<TForm> = (key: FormDataKeys<TForm>, value: any) => void
type FormDataType = Record<string, FormDataConvertible>
type FormOptions = Omit<VisitOptions, 'data'>

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
  setDefaults(field: FormDataKeys<TForm>, value: FormDataConvertible): void
  setDefaults(fields: Partial<TForm>): void
  reset: (...fields: FormDataKeys<TForm>[]) => void
  clearErrors: (...fields: FormDataKeys<TForm>[]) => void
  setError(field: FormDataKeys<TForm>, value: string): void
  setError(errors: Record<FormDataKeys<TForm>, string>): void
  submit: (method: Method, url: string, options?: FormOptions) => void
  get: (url: string, options?: FormOptions) => void
  patch: (url: string, options?: FormOptions) => void
  post: (url: string, options?: FormOptions) => void
  put: (url: string, options?: FormOptions) => void
  delete: (url: string, options?: FormOptions) => void
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
  const transform = useRef((data) => data)

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
            setErrors(errors)
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
    [data, setErrors, transform],
  )

  const setDataFunction = useCallback(
    (keyOrData: FormDataKeys<TForm> | Function | TForm, maybeValue?: any) => {
      if (typeof keyOrData === 'string') {
        setData((data) => set(cloneDeep(data), keyOrData, maybeValue))
      } else if (typeof keyOrData === 'function') {
        setData((data) => keyOrData(data))
      } else {
        setData(keyOrData as TForm)
      }
    },
    [setData],
  )

  const setDefaultsFunction = useCallback(
    (fieldOrFields?: FormDataKeys<TForm> | Partial<TForm>, maybeValue?: FormDataConvertible) => {
      if (typeof fieldOrFields === 'undefined') {
        setDefaults(() => data)
      } else {
        setDefaults((defaults) => {
          return typeof fieldOrFields === 'string'
            ? set(cloneDeep(defaults), fieldOrFields, maybeValue)
            : Object.assign(cloneDeep(defaults), fieldOrFields)
        })
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
          (fields as Array<FormDataKeys<TForm>>)
            .filter((key) => has(defaults, key))
            .reduce(
              (carry, key) => {
                return set(carry, key, get(defaults, key))
              },
              { ...data } as TForm,
            ),
        )
      }
    },
    [setData, defaults],
  )

  const setError = useCallback(
    (fieldOrFields: FormDataKeys<TForm> | Record<FormDataKeys<TForm>, string>, maybeValue?: string) => {
      setErrors((errors) => {
        const newErrors = {
          ...errors,
          ...(typeof fieldOrFields === 'string'
            ? { [fieldOrFields]: maybeValue }
            : (fieldOrFields as Record<FormDataKeys<TForm>, string>)),
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
        const newErrors = (Object.keys(errors) as Array<FormDataKeys<TForm>>).reduce(
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
  const getMethod = useCallback(createSubmitMethod('get'), [submit])
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
    get: getMethod,
    post,
    put,
    patch,
    delete: deleteMethod,
    cancel,
  }
}
