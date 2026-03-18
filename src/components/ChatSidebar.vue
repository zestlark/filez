<template>
  <div id="chat-sidebar" :class="{ open: isOpen }">
    <div class="chat-header">
      <h3>Public Chat</h3>
      <div class="chat-header-actions">
        <i v-if="role === 'admin'" class="ri-delete-bin-line clear-chat-btn" title="Clear All Chats" @click="showClearModal = true"></i>
        <i class="ri-close-line close-btn" @click="$emit('close')"></i>
      </div>
    </div>

    <ModernModal 
        :show="showClearModal" 
        :hasButtons="true"
        confirmText="Clear All"
        @close="showClearModal = false"
        @confirm="clearAllChats"
    >
        <div style="text-align: center;">
            <h3 style="margin: 0; color: white;">Clear Chat History</h3>
            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.7); font-size: 0.95rem;">
                Are you sure you want to permanently delete all messages? This action cannot be undone.
            </p>
        </div>
    </ModernModal>

    <div class="chat-messages" ref="messagesContainer">
      <div v-if="loading" class="chat-loading">Loading chats...</div>
      <div v-else-if="todaysMessages.length === 0" class="chat-empty">
        No messages today. Be the first to say hello!
      </div>
      <div
        v-else
        v-for="msg in todaysMessages"
        :key="msg.id"
        class="message"
        :class="{ 'my-message': msg.userHash === currentUserHash }"
      >
        <div class="message-meta">
          <span class="user-id" :title="msg.userHash">{{ formatUserId(msg.userHash) }}</span>
          <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
        </div>
        <div class="message-text">{{ msg.text }}</div>
      </div>
    </div>

    <div class="chat-input-area">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type a message..."
        @keyup.enter="sendMessage"
        :disabled="sending"
      />
      <button @click="sendMessage" :disabled="sending || !newMessage.trim()">
        <i class="ri-send-plane-fill"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  ref as dbRef,
  onValue,
  push,
  set,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast
} from 'firebase/database'
import { rtdb } from '../scripts/firebasechat'
import { getUserHashSync } from '../scripts/auth'
import ModernModal from './ModernModal.vue'

const props = defineProps<{
  isOpen: boolean
  role?: string
}>()

defineEmits(['close'])

interface ChatMessage {
  id: string
  text: string
  userHash: string
  timestamp: number
}

const messages = ref<ChatMessage[]>([])
const newMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const showClearModal = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

import { computed } from 'vue'
const todaysMessages = computed(() => {
  if (props.role === 'admin') {
    return messages.value;
  }
  const startOfDay = new Date().setHours(0, 0, 0, 0)
  return messages.value.filter(msg => msg.timestamp >= startOfDay)
})

const currentUserHash = getUserHashSync()
let unsubscribe: (() => void) | null = null

onMounted(() => {
  // Listen to the last 100 messages
  const chatsRef = query(dbRef(rtdb, 'chats'), orderByChild('timestamp'), limitToLast(100))

  unsubscribe = onValue(chatsRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      const parsedMessages = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key]
        }))
        .sort((a, b) => a.timestamp - b.timestamp) // Ensure chronological order

      messages.value = parsedMessages
    } else {
      messages.value = []
    }
    loading.value = false
    scrollToBottom()
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    // Firebase RTDB onValue returns an unsubscribe function in modern SDKs
    unsubscribe()
  }
})

watch(
  () => todaysMessages.value.length,
  () => {
    scrollToBottom()
  }
)

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return

  sending.value = true
  try {
    const chatsRef = dbRef(rtdb, 'chats')
    const newChatRef = push(chatsRef)
    await set(newChatRef, {
      text: newMessage.value.trim(),
      userHash: currentUserHash,
      timestamp: serverTimestamp()
    })
    newMessage.value = ''
  } catch (error) {
    console.error('Error sending message:', error)
    // Fallback error handling if notification isn't available
    const notify = (window as any).notification
    if (notify) notify.danger('Failed to send message', 'Chat Error', '/favicon.ico')
  } finally {
    sending.value = false
  }
}

const clearAllChats = async () => {
  try {
    const chatsRef = dbRef(rtdb, 'chats')
    await set(chatsRef, null)
    showClearModal.value = false
    const notify = (window as any).notification
    if (notify) notify.success('Chat history cleared', 'Success', '/favicon.ico')
  } catch (error) {
    console.error('Error clearing chats:', error)
    const notify = (window as any).notification
    if (notify) notify.danger('Failed to clear chats', 'Error', '/favicon.ico')
  }
}

const formatUserId = (hash: string) => {
  if (!hash) return 'Unknown'
  if (hash.length <= 8) return hash
  return hash.substring(0, 8) + '...'
}

const formatTime = (ts: number) => {
  if (!ts) return ''
  const date = new Date(ts)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style lang="scss" scoped>
#chat-sidebar {
  width: 300px;
  height: 100vh;
  background: #1515157f;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 999;
  flex-shrink: 0;

  /* Mobile/Tablet Breakpoint */
  @media (max-width: 1024px) {
    position: fixed;
    top: 0;
    right: -300px;
    width: 300px;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);

    &.open {
      right: 0;
    }
  }
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
    font-weight: 500;

    /* Match typography of Sidebar */
    font-family:
      'Inter',
      system-ui,
      -apple-system,
      sans-serif;
  }

  .chat-header-actions {
    display: flex;
    gap: 15px;
    align-items: center;

    i {
      font-size: 1.2rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.6);
      transition: color 0.2s;

      &:hover {
        color: white;
      }
    }

    .clear-chat-btn {
      color: rgba(255, 80, 80, 0.8);
      &:hover {
        color: rgba(255, 80, 80, 1);
      }
    }

    .close-btn {
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.2rem;
      cursor: pointer;
      transition: color 0.2s;
      display: none; /* Hide by default on desktop */

      &:hover {
        color: white;
      }

      @media (max-width: 1024px) {
        display: block; /* Show only on mobile/tablet */
      }
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
}

.chat-loading,
.chat-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 20px;
  font-size: 0.9rem;
}

.message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 85%;

  &.my-message {
    align-self: flex-end;
    align-items: flex-end;

    .message-text {
      background: #69628a;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-meta {
      flex-direction: row-reverse;
    }
  }
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.75rem;

  .user-id {
    color: rgba(255, 255, 255, 0.7);
    font-weight: 600;
    cursor: default;
  }

  .timestamp {
    color: rgba(255, 255, 255, 0.3);
  }
}

.message-text {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  padding: 10px 14px;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  font-size: 0.95rem;
  line-height: 1.4;
  word-break: break-word;
}

.chat-input-area {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: 10px;
  background: #111;

  input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 10px 16px;
    color: white;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: #69628a;
      background: rgba(255, 255, 255, 0.08);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  button {
    background: #69628a;
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;

    i {
      font-size: 1.1rem;
      margin-left: -2px; // optical alignment for send icon
    }

    &:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: scale(1.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
