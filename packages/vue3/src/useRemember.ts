import { router } from '@inertiajs/core'
import { klona } from 'klona/full'
import { isReactive, reactive, ref, Ref, watch } from 'vue'

export default function useRemember<T extends object>(
  data: T & { __rememberable?: boolean; __remember?: Function; __restore?: Function },
  key?: string,
): Ref<T> | T {
  if (typeof data === 'object' && data !== null && data.__rememberable === false) {
    return data
  }

  const restored = router.restore(key)
  const type = isReactive(data) ? reactive : ref
  const hasCallbacks = typeof data.__remember === 'function' && typeof data.__restore === 'function'
  const remembered = type(restored === undefined ? data : hasCallbacks ? data.__restore(restored) : restored)

  watch(
    remembered,
    (newValue) => {
      router.remember(klona(hasCallbacks ? data.__remember() : newValue), key)
    },
    { immediate: true, deep: true },
  )

  return remembered
}
