<template>
    <BaseModal :visible="visible" :title="title" @close="$emit('cancel')">
        <p class="text-[var(--color-text)]">{{ message }}</p>
        <template #footer>
            <div class="flex justify-end gap-3">
                <BaseButton variant="ghost" @click="$emit('cancel')">{{ cancelText }}</BaseButton>
                <BaseButton :variant="variant" @click="$emit('confirm')">{{ confirmText }}</BaseButton>
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';

defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: 'Confirm' },
    message: { type: String, default: 'Are you sure?' },
    confirmText: { type: String, default: 'Delete' },
    cancelText: { type: String, default: 'Cancel' },
    variant: { type: String, default: 'danger' },
});

defineEmits(['confirm', 'cancel']);
</script>
