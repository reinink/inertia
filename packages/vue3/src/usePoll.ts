import { PollOptions, ReloadOptions, router } from '@inertiajs/core'
import { computed, ComputedRef, onMounted, onUnmounted, ref } from 'vue'

export default function usePoll(
  interval: number,
  requestOptions: ReloadOptions = {},
  options: PollOptions = {
    keepAlive: false,
    autoStart: true,
  },
): {
  stop: VoidFunction
  start: VoidFunction
  toggle: VoidFunction
  polling: ComputedRef<boolean>
} {
  const poll = ref(router.poll(interval, requestOptions, {
    ...options,
    autoStart: false,
  }))

  onMounted(() => {
    if (options.autoStart ?? true) {
      poll.value.start()
    }
  })

  onUnmounted(() => {
    poll.value.stop()
  })

  return {
    stop: () => poll.value.stop(),
    start: () => poll.value.start(),
    toggle: () => poll.value.toggle(),
    polling: computed(() => poll.value.polling()),
  }
}
