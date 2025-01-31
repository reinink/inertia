import { ReloadOptions, router } from '@inertiajs/core'
import { defineComponent, h, PropType } from 'vue'

export default defineComponent({
  name: 'WhenVisible',
  props: {
    data: {
      type: [String, Array<String>],
    },
    params: {
      type: Object as PropType<ReloadOptions>,
    },
    buffer: {
      type: Number,
      default: 0,
    },
    as: {
      type: String,
      default: 'div',
    },
    always: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loaded: false,
      fetching: false,
      observer: null,
    }
  },
  unmounted() {
    this.observer?.disconnect()
  },
  mounted() {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          return
        }

        if (!this.$props.always) {
          this.observer.disconnect()
        }

        if (this.fetching) {
          return
        }

        this.fetching = true

        const reloadParams = this.getReloadParams()

        router.reload({
          ...reloadParams,
          onStart: (e) => {
            this.fetching = true
            reloadParams.onStart?.(e)
          },
          onFinish: (e) => {
            this.loaded = true
            this.fetching = false
            reloadParams.onFinish?.(e)
          },
        })
      },
      {
        rootMargin: `${this.$props.buffer}px`,
      },
    )

    this.observer.observe(this.$el.nextSibling)
  },
  methods: {
    getReloadParams(): Partial<ReloadOptions> {
      const { params, data } = this.$props;

      if (!params && !data) {
        throw new Error('You must provide either a `data` or `params` prop.')
      }

      const reloadParams: Partial<ReloadOptions> = params || {} ;

      if (data) {
        reloadParams.only = (Array.isArray(data) ? data : [data]) as string[];
      }

      return reloadParams;
    },
  },
  render() {
    const els = []

    if (this.$props.always || !this.loaded) {
      els.push(h(this.$props.as))
    }

    if (!this.loaded) {
      els.push(this.$slots.fallback ? this.$slots.fallback() : null)
    } else if (this.$slots.default) {
      els.push(this.$slots.default())
    }

    return els
  },
})
