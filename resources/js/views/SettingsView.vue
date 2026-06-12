<template>
    <div class="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
        <!-- Header -->
        <div class="p-5 pb-3 shrink-0 flex justify-between items-center border-b border-[var(--color-border)]">
            <h2 class="text-lg font-bold tracking-tight text-[var(--color-text)] uppercase tracking-widest">
                {{ $t('settings.title') }}
            </h2>
            <button class="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center hover:opacity-80 transition-opacity border border-[var(--color-border)]" @click="router.push('/')">
                <svg
                    class="w-5 h-5 text-[var(--color-text)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                /></svg>
            </button>
        </div>

        <!-- Settings List -->
        <div class="flex-1 overflow-y-auto p-5 pt-4 custom-scrollbar space-y-12 pb-20">
            <!-- Section: General -->
            <section class="space-y-6">
                <h3 class="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] px-1 mb-4">
                    {{ $t('settings.tabs.gen') }}
                </h3>
                
                <div class="space-y-6 bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--color-border)] shadow-sm">
                    <router-link to="/notepad" class="w-full p-4 bg-[var(--bg-secondary)]/50 border border-[var(--color-border)] rounded-2xl flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-all">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] flex items-center justify-center shadow-sm">
                                <svg
                                    class="w-5 h-5 text-[var(--color-primary)]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                /></svg>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-[var(--color-text)]">
                                    {{ $t('settings.tabs.notepad') }}
                                </p>
                                <p class="text-[10px] text-[var(--color-secondary)]">
                                    {{ $t('settings_modal.notepad.placeholder') }}
                                </p>
                            </div>
                        </div>
                        <svg
                            class="w-5 h-5 text-[var(--color-secondary)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                        /></svg>
                    </router-link>

                    <div class="border-t border-[var(--color-border)] pt-6">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.language') }}</label>
                        <div class="grid grid-cols-2 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                            <button
                                v-for="l in ['ru', 'en']"
                                :key="l"
                                :class="['py-3 rounded-xl text-xs font-bold transition-all', store.locale === l ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']"
                                @click="changeLanguage(l)"
                            >
                                {{ l === 'ru' ? 'Русский' : 'English' }}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.appearance') }}</label>
                        <div class="grid grid-cols-3 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                            <button
                                v-for="m in ['system', 'light', 'dark']"
                                :key="m"
                                :class="['py-3 rounded-xl text-xs font-bold transition-all', store.theme === m ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']"
                                @click="store.setTheme(m)"
                            >
                                {{ $t(`settings.general.theme.${m}`) }}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.visual_style') }}</label>
                        <div class="grid grid-cols-2 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                            <button
                                v-for="style in ['bubbles', 'treemap']"
                                :key="style"
                                :class="['py-3 rounded-xl text-xs font-bold transition-all', store.visualStyle === style ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']"
                                @click="store.setVisualStyle(style)"
                            >
                                {{ $t(`settings.general.visual_styles.${style}`) }}
                            </button>
                        </div>
                    </div>

                    <div v-if="store.visualStyle === 'treemap'" class="space-y-6 pt-4 border-t border-[var(--color-border)]">
                        <div>
                            <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.treemap_mode') }}</label>
                            <div class="grid grid-cols-3 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                                <button
                                    v-for="mode in ['flat', 'nested', 'airy']"
                                    :key="mode"
                                    :class="['py-3 rounded-xl text-[10px] font-bold transition-all', store.treemapMode === mode ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']"
                                    @click="store.setTreemapMode(mode)"
                                >
                                    {{ $t(`settings.general.treemap_modes.${mode}`) }}
                                </button>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between items-center mb-3 px-1">
                                <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black tracking-widest">{{ $t('settings.general.treemap_scale') }}</label>
                                <span class="text-[10px] font-bold text-[var(--color-primary)]">{{ store.treemapScale.toFixed(1) }}x</span>
                            </div>
                            <input
                                :value="store.treemapScale"
                                type="range"
                                min="1.0"
                                max="3.0"
                                step="0.1"
                                class="w-full accent-[var(--color-primary)]"
                                @input="store.setTreemapScale($event.target.value)"
                            >
                            <p class="text-[9px] text-[var(--color-secondary)] mt-2 px-1 leading-relaxed">
                                {{ $t('settings.general.treemap_scale_desc') }}
                            </p>
                        </div>
                    </div>

                    <div class="p-4 bg-[var(--bg-secondary)]/30 border border-[var(--color-border)] rounded-2xl flex items-center justify-between shadow-none">
                        <div class="flex-1">
                            <p class="text-xs font-bold text-[var(--color-text)]">
                                {{ $t('settings.general.notifications') }}
                            </p>
                            <p class="text-[10px] text-[var(--color-secondary)] mt-0.5">
                                {{ $t('settings.general.notifications_desc') }}
                            </p>
                        </div>
                        <button :class="['w-12 h-6 rounded-full relative transition-all duration-300 border-none shadow-inner', store.notificationsEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]']" @click="store.toggleNotifications()">
                            <div :class="['absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm', store.notificationsEnabled ? 'translate-x-6' : 'translate-x-0']" />
                        </button>
                    </div>
                </div>
            </section>

            <!-- Section: Categories -->
            <section class="space-y-4">
                <div class="flex items-center justify-between px-1 mb-4">
                    <h3 class="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">
                        {{ $t('settings.tabs.cat') }}
                    </h3>
                    <button class="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]" @click="addCategory">
                        + {{ $t('settings_modal.categories.add_button') }}
                    </button>
                </div>

                <div class="space-y-2">
                    <div
                        v-for="(c, slug) in editableCats"
                        :key="slug"
                        class="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--color-border)] shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                        @click="openEditCategory(slug)"
                    >
                        <div class="flex items-center gap-3">
                            <div class="w-4 h-4 rounded-full shadow-inner" :style="{ backgroundColor: c.color }" />
                            <span class="font-bold text-sm text-[var(--color-text)]">{{ c.name }}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-black text-[var(--color-secondary)]">{{ c.weight }}%</span>
                            <svg
                                class="w-4 h-4 text-[var(--color-secondary)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                            /></svg>
                        </div>
                    </div>
                </div>
                
                <button class="w-full py-4 mt-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-2xl font-black text-xs shadow-md border border-[var(--color-border)] uppercase tracking-widest" @click="saveCats">
                    {{ $t('settings_modal.categories.save_button') }}
                </button>
            </section>

            <!-- Section: Subcategories -->
            <section class="space-y-4">
                <h3 class="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] px-1 mb-4">
                    {{ $t('settings.tabs.sub') }}
                </h3>
                
                <div class="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--color-border)] shadow-sm space-y-1">
                    <div v-for="(coeff, name) in store.subcatCoeffs" :key="name" class="flex items-center gap-3 py-4 border-b border-[var(--color-border)] last:border-0">
                        <span class="flex-1 text-sm font-medium text-[var(--color-text)]">{{ name }}</span>
                        <input
                            v-model.number="store.subcatCoeffs[name]"
                            type="range"
                            min="0.5"
                            max="4"
                            step="0.1"
                            class="w-24 accent-[var(--color-text)]"
                        >
                        <span class="text-xs font-bold text-[var(--color-secondary)] w-8">{{ Number(coeff).toFixed(1) }}</span>
                    </div>
                    <button class="w-full py-4 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold text-xs mt-6 border border-[var(--color-border)] uppercase tracking-widest" @click="saveCats">
                        {{ $t('settings_modal.subcategories.save_all_button') }}
                    </button>
                </div>
            </section>

            <!-- Section: Data -->
            <section class="space-y-4">
                <h3 class="text-[11px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] px-1 mb-4">
                    {{ $t('settings.tabs.data') }}
                </h3>

                <div class="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--color-border)] shadow-sm space-y-6">
                    <div class="p-4 bg-[var(--bg-secondary)]/30 border border-[var(--color-border)] rounded-2xl text-[11px] text-[var(--color-secondary)] leading-relaxed">
                        <p class="font-bold text-[var(--color-text)] mb-1">
                            {{ $t('settings_modal.data.title') }}
                        </p>
                        {{ $t('settings_modal.data.description') }}
                    </div>

                    <div class="grid grid-cols-1 gap-3">
                        <button class="w-full py-4 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold text-sm flex items-center justify-center gap-3 border border-[var(--color-border)]" @click="store.sync(true)">
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            /></svg>
                            {{ $t('settings_modal.data.sync_button') }}
                        </button>
                        <button class="w-full py-4 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm" @click="exportData">
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            /></svg>
                            {{ $t('settings_modal.data.export_button') }}
                        </button>
                        <button class="w-full py-4 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm" @click="fileInput?.click()">
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            /></svg>
                            {{ $t('settings_modal.data.import_button') }}
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <a href="https://github.com/AlSokolov2/balance-daily/issues/new?template=bug-report.yml" target="_blank" class="flex-1 py-3.5 bg-[var(--bg-secondary)] text-red-500 rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] hover:opacity-80 transition-all flex items-center justify-center gap-2 border border-[var(--color-border)]">
                            <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            /></svg>
                            {{ $t('settings_modal.data.bug_report') }}
                        </a>
                        <a href="https://github.com/AlSokolov2/balance-daily/issues/new?template=feature-request.yml" target="_blank" class="flex-1 py-3.5 bg-[var(--bg-secondary)] text-[var(--color-primary)] rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] hover:opacity-80 transition-all flex items-center justify-center gap-2 border border-[var(--color-border)]">
                            <svg
                                class="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5z"
                            /></svg>
                            {{ $t('settings_modal.data.suggest_feature') }}
                        </a>
                    </div>
                </div>
                <input
                    ref="fileInput"
                    type="file"
                    accept=".json"
                    class="hidden"
                    @change="handleImport"
                >
            </section>
        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-5 border-t border-[var(--color-border)] flex justify-between items-center opacity-40">
            <span class="text-[9px] font-black uppercase tracking-widest text-[var(--color-secondary)]">Balance.Daily</span>
            <span class="text-[9px] font-bold font-mono text-[var(--color-secondary)]">v{{ version }}</span>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();
const store = useBalanceStore();
const router = useRouter();
const fileInput = ref(null);
const version = __APP_VERSION__;

const editableCats = reactive({});

const changeLanguage = (l) => {
    store.setLocale(l);
    locale.value = l;
};

const initData = () => {
    store.categories.filter(c => c.slug !== '__archive__').forEach(c => {
        editableCats[c.slug] = {
            name: c.name,
            weight: Math.round(parseFloat(c.weight) * 100),
            color: c.color,
            hide_until: c.hide_until || ''
        };
    });
};

const openEditCategory = (slug) => {
    router.push(`/category/${slug}`);
};

const addCategory = () => {
    const newKey = 'cat_new_' + Date.now();
    router.push(`/category/${newKey}`);
};

const saveCats = async () => {
    try {
        await axios.post('import', {
            categories: { ...editableCats, '__archive__': store.categories.find(c => c.slug === '__archive__') },
            tasks: store.tasks, 
            subcatCoeffs: store.subcatCoeffs,
            notepad: store.notepadText
        });
        await store.fetchAll();
    } catch { window.alert(t('settings_modal.categories.save_error')); }
};

const exportData = async () => {
    try {
        const res = await axios.get('export');
        const b = new Blob([JSON.stringify(res.data)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'balance_backup.json';
        a.click();
    } catch { /* ignored */ }
};

const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            await axios.post('import', data);
            await store.fetchAll();
            window.location.reload();
        } catch { window.alert(t('settings_modal.data.import_error')); }
    };
    reader.readAsText(file);
};

onMounted(initData);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
