<template>
    <div class="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
        <!-- Header -->
        <div class="p-5 pb-3 shrink-0 landscape:p-3 landscape:pb-1 flex justify-between items-center border-b border-[var(--color-border)]">
            <h2 class="text-lg font-bold tracking-tight text-[var(--color-text)] uppercase tracking-widest">
                {{ $t('settings.tabs.notepad') }}
            </h2>
            <button class="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center hover:opacity-80 transition-opacity border border-[var(--color-border)]" @click="router.push('/')">
                <svg class="w-5 h-5 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col p-6 overflow-hidden">
            <textarea
                v-model="localNotepad" 
                class="flex-1 w-full p-4 border border-[var(--color-border)] rounded-[24px] text-base mb-4 focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-card)] text-[var(--color-text)] resize-none custom-scrollbar shadow-sm" 
                :placeholder="$t('settings_modal.notepad.placeholder')"
            />
            <button class="shrink-0 w-full py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all" @click="saveNotepad">
                {{ $t('settings_modal.notepad.save_button') }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const store = useBalanceStore();
const router = useRouter();
const localNotepad = ref('');

const saveNotepad = async () => {
    try {
        await axios.post('settings', { settings: { notepad_text: localNotepad.value } });
        store.notepadText = localNotepad.value;
        window.alert(t('settings_modal.notepad.saved_message'));
    } catch (_e) {
        console.error('Save notepad error:', _e);
    }
};

onMounted(() => {
    localNotepad.value = store.notepadText;
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
