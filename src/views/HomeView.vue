<script setup>
import Sidebar from '../components/FileManager/Sidebar.vue';
import Filemanager from '../components/FileManager.vue'
import FolderInput from '../components/FolderInput.vue';
import { onMounted, ref } from 'vue';
import { getdatabasedata } from '../scripts/firebasecofig.js'

const handleFolderCreated = async () => {
  filestructure.value = await getdatabasedata('/filez/global')
}

const role = ref('user')
const updateRole = (value) => {
  role.value = value
}

if (sessionStorage.getItem('admin') == 'true') {
  role.value = 'admin';
}

const filestructure = ref([])

onMounted(async () => {
  filestructure.value = await getdatabasedata('/filez/global')
})
</script>

<template>
  <div id="root">
    <div class="home">
      <Sidebar :role="role" @updaterole="updateRole" />
      <Filemanager :role="role" :filestructure="filestructure" />
      <FolderInput @folderCreated="handleFolderCreated" />
    </div>
  </div>
</template>
<style scoped>
.home {
  display: flex;
}
</style>