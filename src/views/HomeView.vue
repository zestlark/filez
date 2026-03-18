<script setup lang="ts">
import Sidebar from '../components/FileManager/Sidebar.vue';
import Filemanager from '../components/FileManager.vue'
import FolderInput from '../components/FolderInput.vue';
import ChatSidebar from '../components/ChatSidebar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { getdatabasedata } from '../scripts/storage'
import type { FileNode } from '../types';

const isLoading = ref(true);

const handleFolderCreated = async () => {
  filestructure.value = await getdatabasedata('/filez/global')
}

const role = ref('user')
const updateRole = (value: string) => {

  role.value = value
}

if (sessionStorage.getItem('admin') == 'true') {
  role.value = 'admin';
}

const filestructure = ref<FileNode[]>([])

const isChatOpen = ref(false);

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
};

// Also listen for a global custom event from the Header component
const handleToggleChatEvent = () => {
    isChatOpen.value = !isChatOpen.value;
};

onMounted(async () => {
  window.addEventListener('toggle-chat', handleToggleChatEvent);
  isLoading.value = true;
  filestructure.value = await getdatabasedata('/filez/global');
  isLoading.value = false;
})

onUnmounted(() => {
  window.removeEventListener('toggle-chat', handleToggleChatEvent);
});
</script>

<template>
  <div id="root">
    <div class="home">
      <Sidebar :role="role" @updaterole="updateRole" />
      <Filemanager :role="role" :filestructure="filestructure" :is-loading="isLoading" @dataChanged="handleFolderCreated" />
      <FolderInput @folderCreated="handleFolderCreated" />
      <ChatSidebar :role="role" :is-open="isChatOpen" @close="isChatOpen = false" />
    </div>
  </div>
</template>
<style scoped>
.home {
  display: flex;
}
</style>