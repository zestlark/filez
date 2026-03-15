<template>
    <Transition name="fade">
        <div v-if="show" class="modern-modal-overlay" @click.self="$emit('close')">
            <div class="modern-modal-container">
                <div class="modern-modal-content">
                    <slot></slot>
                    <div class="modern-modal-btns" v-if="hasButtons">
                        <button class="cancel-btn" @click="$emit('close')">{{ cancelText || 'Cancel' }}</button>
                        <button class="confirm-btn" @click="$emit('confirm')">{{ confirmText || 'Confirm' }}</button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
defineProps<{
    show: boolean;
    hasButtons?: boolean;
    confirmText?: string;
    cancelText?: string;
}>();

defineEmits(['close', 'confirm']);
</script>

<style lang="scss" scoped>
.modern-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.81);
    backdrop-filter: blur(100px);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
}

.modern-modal-container {
    background: rgb(33, 33, 33);
    width: 350px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border-radius: 4px; /* Matching the sharp but clean look of the app */
}

.modern-modal-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.modern-modal-btns {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;
    gap: 10px;

    button {
        flex: 1;
        padding: 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
        font-size: 14px;
    }

    .cancel-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.429);
        color: rgba(255, 255, 255, 0.668);

        &:hover {
            background: rgba(255, 255, 255, 0.05);
        }
    }

    .confirm-btn {
        background: #69628a;
        border: 1px solid #69628a;
        color: white;

        &:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
    }
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
