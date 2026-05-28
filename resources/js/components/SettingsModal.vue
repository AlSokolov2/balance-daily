<template>
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-2xl p-4 sm:p-5 w-full max-w-[560px] max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl relative">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold tracking-tight">Настройки</h2>
                <span @click="$emit('close')" class="cursor-pointer text-2xl text-gray-400 hover:text-gray-600 transition-colors">&times;</span>
            </div>

            <div class="flex flex-wrap gap-1 mb-6 bg-gray-100/50 p-1 rounded-xl">
                <div v-for="t in ['cat', 'sub', 'notepad', 'data']" :key="t"
                     @click="tab = t"
                     :class="['flex-1 text-center py-2 rounded-lg cursor-pointer text-[11px] font-bold uppercase tracking-wider transition-all', tab === t ? 'bg-white text-[var(--color-text)] shadow-sm' : 'text-gray-400 hover:text-gray-600']">
                    {{ tabNames[t] }}
                </div>
            </div>

            <!-- Категории -->
            <div v-if="tab === 'cat'" class="space-y-2 pb-2">
                <div v-for="(c, slug) in editableCats" :key="slug" 
                     @click="openEditCategory(slug)"
                     class="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-white rounded-2xl cursor-pointer transition-all border border-transparent hover:border-gray-100 hover:shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="w-4 h-4 rounded-full shadow-inner border border-white/20" :style="{ backgroundColor: c.color }"></div>
                        <span class="font-bold text-sm text-gray-800">{{ c.name }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span v-if="c.hide_until" class="text-[10px] bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg font-bold">
                            До {{ c.hide_until.substring(0, 10) }}
                        </span>
                        <span class="text-xs font-black text-gray-300 w-10 text-right">{{ c.weight }}%</span>
                        <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                </div>
                <div class="flex gap-2 pt-4">
                    <button @click="addCategory" class="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors">+ Добавить</button>
                    <button @click="saveCats" class="flex-1 py-3 rounded-xl font-bold text-xs transition-all">Сохранить</button>
                </div>
            </div>

            <!-- Подкатегории -->
            <div v-if="tab === 'sub'" class="space-y-1">
                <div v-for="(coeff, name) in store.subcatCoeffs" :key="name" class="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <span class="flex-1 text-sm font-medium text-gray-700">{{ name }}</span>
                    <input v-model.number="store.subcatCoeffs[name]" type="range" min="0.5" max="4" step="0.1" class="w-24 accent-[var(--color-text)]">
                    <span class="text-xs font-bold text-gray-400 w-8">{{ Number(coeff).toFixed(1) }}</span>
                    <button @click="deleteSubcat(name)" class="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all border-none shadow-none bg-transparent">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <button @click="saveSubcats" class="w-full py-3.5 rounded-2xl font-bold text-sm mt-6 shadow-sm transition-all">Сохранить всё</button>
            </div>

            <!-- Блокнот -->
            <div v-if="tab === 'notepad'">
                <textarea v-model="localNotepad" class="w-full h-72 p-4 border border-gray-200 rounded-2xl text-sm mb-4 focus:ring-2 focus:ring-gray-100 outline-none transition-all bg-gray-50/30" placeholder="Заметки..."></textarea>
                <button @click="saveNotepad" class="w-full py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all">Сохранить</button>
            </div>

            <!-- Данные -->
            <div v-if="tab === 'data'" class="space-y-4">
                <div class="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-[12px] text-gray-600 leading-relaxed">
                    <p class="font-bold text-gray-900 mb-1">Управление данными</p>
                    Вы можете экспортировать свои данные в JSON-файл или импортировать бэкап. 
                    <br><span class="text-red-500 font-medium">Внимание:</span> Импорт полностью заменит текущие задачи и настройки!
                </div>
                <div class="grid grid-cols-1 gap-2">
                    <button @click="exportData" class="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Экспорт (JSON)
                    </button>
                    <button @click="$refs.fileInput.click()" class="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Импорт (JSON)
                    </button>
                </div>
                <input type="file" ref="fileInput" @change="handleImport" accept=".json" class="hidden">
            </div>
        </div>

        <EditCategoryModal 
            v-if="editingCategory" 
            :category="editingCategory.data" 
            :slug="editingCategory.slug"
            :isNew="editingCategory.isNew"
            @close="editingCategory = null"
            @save="handleSaveCategory"
            @delete="handleDeleteCategory"
            @weight-changed="syncWeights"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useBalanceStore } from '../stores/balance';
import EditCategoryModal from './EditCategoryModal.vue';
import axios from 'axios';

const emit = defineEmits(['close']);
const store = useBalanceStore();
const tab = ref('cat');
const tabNames = { cat: 'Категории', sub: 'Подкатегории', notepad: 'Блокнот', data: 'Данные' };

const editableCats = reactive({});
const localNotepad = ref('');
const editingCategory = ref(null);

const initData = () => {
    store.categories.filter(c => c.slug !== '__archive__').forEach(c => {
        editableCats[c.slug] = {
            name: c.name,
            weight: Math.round(parseFloat(c.weight) * 100),
            color: c.color,
            hide_until: c.hide_until || ''
        };
    });
    localNotepad.value = store.notepadText;
};

const syncWeights = (slug, w) => {
    const keys = Object.keys(editableCats);
    if (keys.length === 1) {
        editableCats[slug].weight = 100;
        return;
    }
    const others = keys.filter(k => k !== slug);
    const sumO = others.reduce((s, k) => s + editableCats[k].weight, 0);
    const tot = w + sumO;
    
    if (tot > 100) {
        const ex = tot - 100;
        others.forEach(k => {
            editableCats[k].weight = Math.max(1, Math.round(editableCats[k].weight - ex * (editableCats[k].weight / sumO)));
        });
    } else if (tot < 100) {
        const df = 100 - tot;
        others.forEach(k => {
            editableCats[k].weight = Math.round(editableCats[k].weight + df * (editableCats[k].weight / sumO));
        });
    }
    
    // Final check for exactly 100%
    const currentSum = keys.reduce((s, k) => s + editableCats[k].weight, 0);
    if (currentSum !== 100) {
        editableCats[slug].weight += (100 - currentSum);
    }
};

const openEditCategory = (slug) => {
    editingCategory.value = {
        slug,
        data: { ...editableCats[slug] },
        isNew: false
    };
};

const handleSaveCategory = (slug, data) => {
    editableCats[slug] = data;
    syncWeights(slug, data.weight); // Ensure weights are balanced after save
    editingCategory.value = null;
};

const handleDeleteCategory = (slug) => {
    if (Object.keys(editableCats).length <= 1) {
        alert('Нельзя удалить последнюю категорию');
        return;
    }
    delete editableCats[slug];
    const firstRemaining = Object.keys(editableCats)[0];
    syncWeights(firstRemaining, editableCats[firstRemaining].weight);
    editingCategory.value = null;
};

const addCategory = () => {
    const newKey = 'cat_' + Date.now();
    const newData = { name: 'Новая', weight: 10, color: '#8e8e93', hide_until: '' };
    editableCats[newKey] = newData;
    syncWeights(newKey, 10);
    
    editingCategory.value = {
        slug: newKey,
        data: { ...newData },
        isNew: true
    };
};

const deleteCategory = (slug) => {
    if (Object.keys(editableCats).length <= 1) return;
    delete editableCats[slug];
    const firstRemaining = Object.keys(editableCats)[0];
    syncWeights(firstRemaining, editableCats[firstRemaining].weight);
};

const saveCats = async () => {
    try {
        await axios.post('import', {
            categories: {
                ...editableCats,
                '__archive__': store.categories.find(c => c.slug === '__archive__')
            },
            tasks: store.tasks, 
            subcatCoeffs: store.subcatCoeffs,
            notepad: store.notepadText
        });
        await store.fetchAll();
        emit('close');
    } catch (e) {
        alert('Ошибка при сохранении категорий');
    }
};

const deleteSubcat = (name) => {
    delete store.subcatCoeffs[name];
};

const saveSubcats = async () => {
    await saveCats(); 
};

const saveNotepad = async () => {
    await axios.post('settings', { settings: { notepad_text: localNotepad.value } });
    store.notepadText = localNotepad.value;
    alert('Блокнот сохранен');
};

const exportData = async () => {
    const res = await axios.get('export');
    const b = new Blob([JSON.stringify(res.data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'balance_backup_new.json';
    a.click();
};

const handleImport = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async (ev) => {
        try {
            const d = JSON.parse(ev.target.result);
            await axios.post('import', d);
            window.location.reload();
        } catch (ex) {
            console.error('Import error:', ex);
            const msg = ex.response?.data?.message || ex.message || 'Неверный формат JSON или ошибка сервера';
            alert('Ошибка при импорте: ' + msg);
        }
    };
    r.readAsText(f);
};

onMounted(initData);
</script>
