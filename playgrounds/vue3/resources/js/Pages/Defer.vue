<script lang="ts">
import Layout from '../Components/Layout.vue'
import Spinner from '../Components/Spinner.vue'
import TestGrid from '../Components/TestGrid.vue'
import TestGridItem from '../Components/TestGridItem.vue'
export default { layout: Layout }
</script>

<script setup lang="ts">
import { Deferred, Head, WhenVisible } from '@inertiajs/vue3'

defineProps<{
  users?: {
    id: number
    name: string
    email: string
  }[]
  organizations?: {
    id: number
    name: string
    url: string
  }[]
  foods?: {
    id: number
    name: string
  }[]
  surprise?: {
    id: number
    name: string
  }[]
  dogs?: {
    id: number
    name: string
  }[]
  lunch?: {
    id: number
    name: string
  }[]
}>()
</script>

<template>
  <Head title="Async Request" />
  <h1 class="text-3xl">Deferred Props</h1>
  <div class="mt-6 rounded border border-yellow-500 bg-yellow-200 p-4">
    <p>Page is loaded!</p>
  </div>
  <TestGrid>
    <TestGridItem>
      <Deferred data="users">
        <template #fallback>
          <p>Loading Users...</p>
        </template>

        <div v-for="user in users">
          <p>#{{ user.id }}: {{ user.name }} ({{ user.email }})</p>
        </div>
      </Deferred>
    </TestGridItem>

    <TestGridItem>
      <Deferred data="foods">
        <template #fallback>
          <p>Loading Foods...</p>
        </template>

        <div v-for="food in foods">
          <p>#{{ food.id }}: {{ food.name }}</p>
        </div>
      </Deferred>
    </TestGridItem>

    <TestGridItem>
      <Deferred data="organizations">
        <template #fallback>
          <p>Loading Organizations...</p>
        </template>

        <div v-for="org in organizations">
          <p>#{{ org.id }}: {{ org.name }} ({{ org.url }})</p>
        </div>
      </Deferred>
    </TestGridItem>
  </TestGrid>

  <div class="mt-72">
    <WhenVisible data="surprise">
      <template #fallback>
        <div class="h-24">
          <div class="flex items-center"><Spinner /> Loading Surprise...</div>
        </div>
      </template>

      <div v-for="sur in surprise">
        <p>#{{ sur.id }}: {{ sur.name }}</p>
      </div>
    </WhenVisible>
  </div>

  <div class="mt-72">
    <WhenVisible :data="['dogs', 'lunch']" :buffer="200">
      <template #fallback>
        <div class="h-20">
          <div class="flex items-center"><Spinner /> Loading Dogs and Lunch...</div>
        </div>
      </template>

      <div class="flex space-x-6">
        <div>
          <div v-for="dog in dogs">
            <p>#{{ dog.id }}: {{ dog.name }}</p>
          </div>
        </div>

        <div>
          <div v-for="item in lunch">
            <p>#{{ item.id }}: {{ item.name }}</p>
          </div>
        </div>
      </div>
    </WhenVisible>
  </div>
</template>
