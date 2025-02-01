import { FormDataConvertible, Method, Progress, router, VisitOptions } from '@inertiajs/core'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'
import { reactive, watch } from 'vue'

type FormDataType = Record<string, FormDataConvertible>
type FormOptions = Omit<VisitOptions, 'data'>

export interface InertiaFormProps<TForm extends FormDataType> {
  isDirty: boolean
  errors: Partial<Record<keyof TForm, string>>
  hasErrors: boolean
  processing: boolean
  progress: Progress | null
  wasSuccessful: boolean
  recentlySuccessful: boolean
  data(): TForm
  transform(callback: (data: TForm) => object): this
  defaults(): this
  defaults(field: keyof TForm, value: FormDataConvertible): this
  defaults(fields: Partial<TForm>): this
  reset(...fields: (keyof TForm)[]): this
  clearErrors(...fields: (keyof TForm)[]): this
  setError(field: keyof TForm, value: string): this
  setError(errors: Partial<Record<keyof TForm, string>>): this
  submit(method: Method, url: string, options?: FormOptions): void
  get(url: string, options?: FormOptions): void
  post(url: string, options?: FormOptions): void
  put(url: string, options?: FormOptions): void
  patch(url: string, options?: FormOptions): void
  delete(url: string, options?: FormOptions): void
  cancel(): void
}

export type InertiaForm<TForm extends FormDataType> = TForm & InertiaFormProps<TForm>

export default function useForm<TForm extends FormDataType>(data: TForm | (() => TForm)): InertiaForm<TForm>
export default function useForm<TForm extends FormDataType>(
  rememberKey: string,
  data: TForm | (() => TForm),
): InertiaForm<TForm>
export default function useForm<TForm extends FormDataType>(
  rememberKeyOrData: string | TForm | (() => TForm),
  maybeData?: TForm | (() => TForm),
): InertiaForm<TForm> {
  const rememberKey = typeof rememberKeyOrData === 'string' ? rememberKeyOrData : null
  const data = (typeof rememberKeyOrData === 'string' ? maybeData : rememberKeyOrData) ?? {}
  const restored = rememberKey
    ? (router.restore(rememberKey) as { data: TForm; errors: Record<keyof TForm, string> })
    : null
  let defaults = typeof data === 'function' ? cloneDeep(data()) : cloneDeep(data)
  let cancelToken = null
  let recentlySuccessfulTimeoutId = null
  let transform = (data) => data

  const form = reactive({
    ...(restored ? restored.data : cloneDeep(defaults)),
    isDirty: false,
    errors: restored ? restored.errors : {},
    hasErrors: false,
    processing: false,
    progress: null,
    wasSuccessful: false,
    recentlySuccessful: false,
    data() {
      return (Object.keys(defaults) as Array<keyof TForm>).reduce((carry, key) => {
        carry[key] = this[key]
        return carry
      }, {} as Partial<TForm>) as TForm
    },
    transform(callback) {
      transform = callback

      return this
    },
    defaults(fieldOrFields?: keyof TForm | Partial<TForm>, maybeValue?: FormDataConvertible) {
      if (typeof data === 'function') {
        throw new Error('You cannot call `defaults()` when using a function to define your form data.')
      }

      if (typeof fieldOrFields === 'undefined') {
        defaults = this.data()
        this.isDirty = false
      } else {
        defaults = Object.assign(
          {},
          cloneDeep(defaults),
          typeof fieldOrFields === 'string' ? { [fieldOrFields]: maybeValue } : fieldOrFields,
        )
      }

      return this
    },
    reset(...fields) {
      const resolvedData = typeof data === 'function' ? cloneDeep(data()) : cloneDeep(defaults)
      const clonedData = cloneDeep(resolvedData)
      if (fields.length === 0) {
        defaults = clonedData
        Object.assign(this, resolvedData)
      } else {
        Object.keys(resolvedData)
          .filter((key) => fields.includes(key))
          .forEach((key) => {
            defaults[key] = clonedData[key]
            this[key] = resolvedData[key]
          })
      }

      return this
    },
    setError(fieldOrFields: keyof TForm | Partial<Record<keyof TForm, string>>, maybeValue?: string) {
      Object.assign(this.errors, typeof fieldOrFields === 'string' ? { [fieldOrFields]: maybeValue } : fieldOrFields)

      this.hasErrors = Object.keys(this.errors).length > 0

      return this
    },
    clearErrors(...fields) {
      this.errors = Object.keys(this.errors).reduce(
        (carry, field) => ({
          ...carry,
          ...(fields.length > 0 && !fields.includes(field) ? { [field]: this.errors[field] } : {}),
        }),
        {},
      )

      this.hasErrors = Object.keys(this.errors).length > 0

      return this
    },
    submit(method, url, options: FormOptions = {}) {
      const data = transform(this.data())
      const _options = {
        ...options,
        onCancelToken: (token) => {
          cancelToken = token

          if (options.onCancelToken) {
            return options.onCancelToken(token)
          }
        },
        onBefore: (visit) => {
          this.wasSuccessful = false
          this.recentlySuccessful = false
          clearTimeout(recentlySuccessfulTimeoutId)

          if (options.onBefore) {
            return options.onBefore(visit)
          }
        },
        onStart: (visit) => {
          this.processing = true

          if (options.onStart) {
            return options.onStart(visit)
          }
        },
        onProgress: (event) => {
          this.progress = event

          if (options.onProgress) {
            return options.onProgress(event)
          }
        },
        onSuccess: async (page) => {
          this.processing = false
          this.progress = null
          this.clearErrors()
          this.wasSuccessful = true
          this.recentlySuccessful = true
          recentlySuccessfulTimeoutId = setTimeout(() => (this.recentlySuccessful = false), 2000)

          const onSuccess = options.onSuccess ? await options.onSuccess(page) : null
          defaults = cloneDeep(this.data())
          this.isDirty = false
          return onSuccess
        },
        onError: (errors) => {
          this.processing = false
          this.progress = null
          this.clearErrors().setError(errors)

          if (options.onError) {
            return options.onError(errors)
          }
        },
        onCancel: () => {
          this.processing = false
          this.progress = null

          if (options.onCancel) {
            return options.onCancel()
          }
        },
        onFinish: (visit) => {
          this.processing = false
          this.progress = null
          cancelToken = null

          if (options.onFinish) {
            return options.onFinish(visit)
          }
        },
      }

      if (method === 'delete') {
        router.delete(url, { ..._options, data })
      } else {
        router[method](url, data, _options)
      }
    },
    get(url, options) {
      this.submit('get', url, options)
    },
    post(url, options) {
      this.submit('post', url, options)
    },
    put(url, options) {
      this.submit('put', url, options)
    },
    patch(url, options) {
      this.submit('patch', url, options)
    },
    delete(url, options) {
      this.submit('delete', url, options)
    },
    cancel() {
      if (cancelToken) {
        cancelToken.cancel()
      }
    },
    __rememberable: rememberKey === null,
    __remember() {
      return { data: this.data(), errors: this.errors }
    },
    __restore(restored) {
      Object.assign(this, restored.data)
      this.setError(restored.errors)
    },
  })

  watch(
    form,
    (newValue) => {
      form.isDirty = !isEqual(form.data(), defaults)
      if (rememberKey) {
        router.remember(cloneDeep(newValue.__remember()), rememberKey)
      }
    },
    { immediate: true, deep: true },
  )

  return form
}
