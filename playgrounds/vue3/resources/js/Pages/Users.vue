<script lang="ts">
import Layout from '../Components/Layout.vue'
export default { layout: Layout }
</script>

<script setup lang="ts">
import { Head, usePrefetch } from '@inertiajs/vue3'

const { isPrefetching, isPrefetched, lastUpdatedAt, flush } = usePrefetch()

defineProps({ users: Array, date: String })
</script>

<template>
  <Head title="User" />
  <h1 class="text-3xl">Users</h1>
  <div class="my-6">
    Data last refreshed at:
    <span v-if="lastUpdatedAt"> <br />Client: {{ new Date(lastUpdatedAt) }} <br />Server: {{ date }}</span>
    <span v-else>N/A</span>
    <div v-if="isPrefetched">(Page is prefetched!)</div>
    <span v-if="isPrefetching" class="text-red-500"> refreshing...</span>
  </div>

  <div class="mt-6 w-full max-w-2xl overflow-hidden rounded border shadow-sm">
    <table class="w-full text-left">
      <thead>
        <tr>
          <th class="px-4 py-2">Id</th>
          <th class="px-4 py-2">Name</th>
          <th class="px-4 py-2">Email</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" class="border-t">
          <td class="px-4 py-2">{{ user.id }}</td>
          <td class="px-4 py-2">{{ user.name }}</td>
          <td class="px-4 py-2">{{ user.email }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
