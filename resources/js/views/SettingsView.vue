<template>
    <div class="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
        <!-- Header -->
        <div class="p-5 pb-3 shrink-0 flex justify-between items-center border-b border-[var(--color-border)]">
            <h2 class="text-lg font-bold tracking-tight text-[var(--color-text)] uppercase tracking-widest">
                {{ $t('settings.title') }}
            </h2>
            <button class="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center hover:opacity-80 transition-opacity border border-[var(--color-border)]" @click="router.push('/')">
                <svg class="w-5 h-5 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>

        <!-- Sub-Tabs Nav -->
        <div class="px-5 py-3 shrink-0">
            <div class="flex gap-1 bg-[var(--bg-secondary)]/50 p-1 rounded-xl border border-[var(--color-border)] overflow-x-auto scrollbar-hide">
                <button
                    v-for="tName in ['gen', 'cat', 'sub', 'data']"
                    :key="tName"
                    :class="['flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-none shadow-none relative', 
                             tab === tName ? 'bg-[var(--bg-card)] text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']"
                    @click="tab = tName"
                >
                    {{ $t(`settings.tabs.${tName}`) }}
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-5 pt-0 custom-scrollbar">
            <!-- Tab: General -->
            <div v-if="tab === 'gen'" class="space-y-6 pb-6">
                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.language') }}</label>
                    <div class="grid grid-cols-2 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                        <button v-for="l in ['ru', 'en']" :key="l" :class="['py-3 rounded-xl text-xs font-bold transition-all', store.locale === l ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']" @click="changeLanguage(l)">
                            {{ l === 'ru' ? 'Русский' : 'English' }}
                        </button>
                    </div>
                </div>

                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">{{ $t('settings.general.appearance') }}</label>
                    <div class="grid grid-cols-3 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                        <button v-for="m in ['system', 'light', 'dark']" :key="m" :class="['py-3 rounded-xl text-xs font-bold transition-all', store.theme === m ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']" @click="store.setTheme(m)">
                            {{ $t(`settings.general.theme.${m}`) }}
                        </button>
                    </div>
                </div>

                <div class="p-4 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between shadow-sm">
                    <div class="flex-1">
                        <p class="text-xs font-bold text-[var(--color-text)]">{{ $t('settings.general.notifications') }}</p>
                        <p class="text-[10px] text-[var(--color-secondary)] mt-0.5">{{ $t('settings.general.notifications_desc') }}</p>
                    </div>
                    <button :class="['w-12 h-6 rounded-full relative transition-all duration-300 border-none shadow-inner', store.notificationsEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]']" @click="store.toggleNotifications()">
                        <div :class="['absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm', store.notificationsEnabled ? 'translate-x-6' : 'translate-x-0']" />
                    </button>
                </div>
            </div>

            <!-- Tab: Categories -->
            <div v-if="tab === 'cat'" class="space-y-2 pb-6">
                <div v-for="(c, slug) in editableCats" :key="slug" class="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--color-border)] shadow-sm" @click="openEditCategory(slug)">
                    <div class="flex items-center gap-3">
                        <div class="w-4 h-4 rounded-full shadow-inner" :style="{ backgroundColor: c.color }" />
                        <span class="font-bold text-sm text-[var(--color-text)]">{{ c.name }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-black text-[var(--color-secondary)]">{{ c.weight }}%</span>
                        <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </div>
                </div>
                <div class="flex gap-2 pt-4">
                    <button class="flex-1 py-4 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-xl font-bold text-xs" @click="addCategory">
                        {{ $t('settings_modal.categories.add_button') }}
                    </button>
                    <button class="flex-1 py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl font-bold text-xs shadow-md" @click="saveCats">
                        {{ $t('settings_modal.categories.save_button') }}
                    </button>
                </div>
            </div>

            <!-- Tab: Subcategories -->
            <div v-if="tab === 'sub'" class="space-y-1 pb-6">
                <div v-for="(coeff, name) in store.subcatCoeffs" :key="name" class="flex items-center gap-3 py-4 border-b border-[var(--color-border)] last:border-0">
                    <span class="flex-1 text-sm font-medium text-[var(--color-text)]">{{ name }}</span>
                    <input v-model.number="store.subcatCoeffs[name]" type="range" min="0.5" max="4" step="0.1" class="w-24 accent-[var(--color-text)]">
                    <span class="text-xs font-bold text-[var(--color-secondary)] w-8">{{ Number(coeff).toFixed(1) }}</span>
                </div>
                <button class="w-full py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-2xl font-bold text-sm mt-6 shadow-md" @click="saveCats">
                    {{ $t('settings_modal.subcategories.save_all_button') }}
                </button>
            </div>

            <!-- Tab: Data -->
            <div v-if="tab === 'data'" class="space-y-4 pb-6">
                <div class="p-5 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl text-[12px] text-[var(--color-secondary)] shadow-sm">
                    <p class="font-bold text-[var(--color-text)] mb-1">{{ $t('settings_modal.data.title') }}</p>
                    {{ $t('settings_modal.data.description') }}
                </div>
                <div class="grid grid-cols-1 gap-2">
                    <button class="w-full py-4 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold text-sm flex items-center justify-center gap-3" @click="store.sync(true)">
                        {{ $t('settings_modal.data.sync_button') }}
                    </button>
                    <button class="w-full py-4 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm" @click="exportData">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        {{ $t('settings_modal.data.export_button') }}
                    </button>
                    <button class="w-full py-4 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-sm" @click="fileInput?.click()">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                        {{ $t('settings_modal.data.import_button') }}
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)]">
                    <a href="https://github.com/AlSokolov2/balance-daily/issues/new?template=bug-report.yml" target="_blank" class="flex-1 py-3 bg-[var(--bg-secondary)] text-red-500 rounded-2xl font-bold text-[10px] uppercase tracking-wider hover:opacity-80 transition-all flex items-center justify-center gap-2 border border-[var(--color-border)]">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        {{ $t('settings_modal.data.bug_report') }}
                    </a>
                    <a href="https://github.com/AlSokolov2/balance-daily/issues/new?template=feature-request.yml" target="_blank" class="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--color-primary)] rounded-2xl font-bold text-[10px] uppercase tracking-wider hover:opacity-80 transition-all flex items-center justify-center gap-2 border border-[var(--color-border)]">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5z"/></svg>
                        {{ $t('settings_modal.data.suggest_feature') }}
                    </a>
                </div>
                <input
                    ref="fileInput"
                    type="file"
                    accept=".json"
                    class="hidden"
                    @change="handleImport"
                >
            </div>
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
const tab = ref('gen');
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

const syncWeights = (slug, w) => {
    const keys = Object.keys(editableCats);
    if (keys.length === 1) { editableCats[slug].weight = 100; return; }
    const others = keys.filter(k => k !== slug);
    const sumO = others.reduce((s, k) => s + editableCats[k].weight, 0);
    const tot = w + sumO;
    if (tot > 100) {
        const ex = tot - 100;
        others.forEach(k => { editableCats[k].weight = Math.max(1, Math.round(editableCats[k].weight - ex * (editableCats[k].weight / sumO))); });
    } else if (tot < 100) {
        const df = 100 - tot;
        others.forEach(k => { editableCats[k].weight = Math.round(editableCats[k].weight + df * (editableCats[k].weight / sumO)); });
    }
    const currentSum = keys.reduce((s, k) => s + editableCats[k].weight, 0);
    if (currentSum !== 100) { editableCats[slug].weight += (100 - currentSum); }
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
    } catch (_e) { window.alert(t('settings_modal.categories.save_error')); }
};

const exportData = async () => {
    try {
        const res = await axios.get('export');
        const b = new Blob([JSON.stringify(res.data)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'balance_backup.json';
        a.click();
    } catch (_e) { console.error(_e); }
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
        } catch (_e) { window.alert(t('settings_modal.data.import_error')); }
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
