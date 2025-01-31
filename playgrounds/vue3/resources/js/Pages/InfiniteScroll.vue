<script lang="ts">
import Layout from '../Components/Layout.vue'
export default { layout: Layout }
</script>

<script setup lang="ts">
import { Head, router, WhenVisible } from '@inertiajs/vue3'
import { ref } from 'vue'

const props = defineProps<{
  items?: {
    id: number
    name: string
  }[]
  page: number
  item_types: string[]
  item_type: string
}>()

const currentItemType = ref(props.item_type)

const setItemType = (type: string) => {
  currentItemType.value = type

  router.reload({
    data: {
      item_type: type,
      page: 1,
    },
    reset: ['items', 'page'],
    preserveUrl: true,
  })
}
</script>

<template>
  <Head title="Infinite Scroll" />
  <h1 class="text-3xl">And Beyond</h1>

  <div class="my-6 space-x-4">
    <button
      v-for="type in item_types"
      @click="setItemType(type)"
      :key="type"
      class="px-4 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
    >
      {{ type }}
    </button>
  </div>

  <div class="w-full max-w-2xl mt-6 overflow-hidden border rounded shadow-sm">
    <table class="w-full text-left">
      <thead>
        <tr>
          <th class="px-4 py-2">Id</th>
          <th class="px-4 py-2">Name</th>
        </tr>
      </thead>
      <tbody v-if="items">
        <tr v-for="item in items" :key="item.id" class="border-t">
          <td class="px-4 py-2">{{ item.id }}</td>
          <td class="px-4 py-2">{{ item.name }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="!items" class="p-4 text-center bg-gray-100">Loading items...</div>
    <WhenVisible
      v-else
      always
      :buffer="200"
      :params="{
        data: {
          item_type: currentItemType,
          page: page + 1,
        },
        only: ['items', 'page'],
        preserveUrl: true,
      }"
    >
      <template #fallback>
        <div class="p-4 text-center bg-gray-100">Fetching more items...</div>
      </template>

      <div class="p-4 text-center bg-gray-100">Fetching more items...</div>
    </WhenVisible>
  </div>
</template>
