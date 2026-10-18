<template>
    <BaseModal
        :visible="releaseNotes.visible"
        :title="$t('release_notes.title')"
        @close="releaseNotes.dismiss()"
    >
        <div class="space-y-6">
            <section v-for="note in releaseNotes.visibleNotes" :key="note.version">
                <div class="flex items-baseline justify-between gap-3 mb-3">
                    <h3 class="text-sm font-black text-[var(--color-text)]">
                        v{{ note.version }}
                    </h3>
                    <span v-if="note.date" class="text-[10px] font-bold text-[var(--color-secondary)]">
                        {{ formatDate(note.date) }}
                    </span>
                </div>

                <ul class="space-y-2.5">
                    <li
                        v-for="(item, index) in note.items"
                        :key="index"
                        class="flex items-start gap-2.5"
                    >
                        <span :class="badgeClasses(item.type)" class="badge-text">
                            {{ $t(`release_notes.types.${item.type}`) }}
                        </span>
                        <span class="text-sm text-[var(--color-text)] leading-snug">
                            {{ item[language] || item.ru || item.en }}
                        </span>
                    </li>
                </ul>
            </section>

            <p
                v-if="!releaseNotes.visibleNotes.length"
                class="text-sm text-center text-[var(--color-secondary)] py-6"
            >
                {{ $t('release_notes.empty') }}
            </p>
        </div>

        <template #footer>
            <BaseButton
                variant="primary"
                size="md"
                class="w-full"
                @click="releaseNotes.dismiss()"
            >
                {{ $t('release_notes.got_it') }}
            </BaseButton>
        </template>
    </BaseModal>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';
import { useReleaseNotesStore } from '../stores/releaseNotes';

const releaseNotes = useReleaseNotesStore();
const { locale } = useI18n();

const language = computed(() => (locale.value === 'en' ? 'en' : 'ru'));

const formatDate = (value) => {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString(language.value === 'en' ? 'en-US' : 'ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const badgeClasses = (type) => (type === 'feature'
    ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
    : 'bg-[var(--bg-secondary)] text-[var(--color-secondary)]');
</script>

<style scoped>
@reference "../../css/app.css";

.badge-text {
    @apply shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider;
}
</style>
