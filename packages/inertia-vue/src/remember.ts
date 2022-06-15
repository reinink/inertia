import { defineComponent, isReactive, reactive, ref, watch } from '@vue/composition-api'
import { Inertia } from '@inertiajs/inertia'
import cloneDeep from 'lodash.clonedeep'

export const remember = defineComponent({
  created() {
    if (!this.$options.remember || this.$isServer) {
      return
    }

    if (Array.isArray(this.$options.remember)) {
      this.$options.remember = { data: this.$options.remember }
    }

    if (typeof this.$options.remember === 'string') {
      this.$options.remember = { data: [this.$options.remember] }
    }

    if (typeof this.$options.remember.data === 'string') {
      this.$options.remember = { data: [this.$options.remember.data] }
    }

    const rememberKey = this.$options.remember.key instanceof Function
      ? this.$options.remember.key.call(this)
      : this.$options.remember.key

    const restored = Inertia.restore(rememberKey) as Record<string, any> | undefined

    const rememberable = this.$options.remember.data.filter((key: string) => {
      return !(
        this[key] !== null &&
        typeof this[key] === 'object' &&
        (this[key] as Record<string, any>).__rememberable === false
      )
    })

    const hasCallbacks = (key: string) => {
      return this[key] !== null
        && typeof this[key] === 'object'
        && typeof (this[key] as Record<string, any>).__remember === 'function'
        && typeof (this[key] as Record<string, any>).__restore === 'function'
    }

    rememberable.forEach((key: string) => {
      if (this[key] !== undefined && restored !== undefined && restored[key] !== undefined) {
        hasCallbacks(key)
          ? (this[key] as Record<string, any>).__restore(restored[key])
          : (this[key] = restored[key])
      }

      this.$watch(key, () => {
        Inertia.remember(
          rememberable.reduce((data, key) => ({
            ...data,
            [key]: cloneDeep(
              hasCallbacks(key)
                ? (this[key] as Record<string, any>).__remember()
                : (this[key] as Record<string, any>)
            ),
          }), {} as Record<string, any>),
          rememberKey,
        )
      }, { immediate: true, deep: true })
    })
  },
})

export function useRemember<T extends Record<string, any>>(data: T, key: keyof T) {
  if (typeof data === 'object' && data !== null && data.__rememberable === false) {
    return data
  }

  const restored = Inertia.restore(key as string) as T | undefined
  const refType = isReactive(data) ? reactive : ref
  const hasCallbacks = typeof data.__remember === 'function' && typeof data.__restore === 'function'
  const remembered = restored === undefined
    ? data
    : refType(hasCallbacks ? data.__restore(restored) : restored)

  watch(remembered, (newValue) => {
    Inertia.remember(cloneDeep(hasCallbacks ? data.__remember() : newValue), key as string)
  }, { immediate: true, deep: true })

  return remembered
}
