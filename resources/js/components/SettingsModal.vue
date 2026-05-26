<template>
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
        <div class="bg-white rounded-2xl p-4 w-full max-w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <div class="flex justify-between items-center mb-3 font-semibold text-lg">
                Настройки
                <span @click="$emit('close')" class="cursor-pointer text-2xl">&times;</span>
            </div>

            <div class="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
                <div v-for="t in ['cat', 'sub', 'notepad', 'data']" :key="t"
                     @click="tab = t"
                     :class="['flex-1 text-center py-1.5 rounded-lg cursor-pointer text-xs transition-all', tab === t ? 'bg-white font-semibold shadow-sm' : 'text-gray-500 hover:bg-white/50']">
                    {{ tabNames[t] }}
                </div>
            </div>

            <!-- Категории -->
            <div v-if="tab === 'cat'" class="space-y-2">
                <div v-for="(c, slug) in editableCats" :key="slug" class="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                    <input v-model="c.name" type="text" class="w-20 p-1.5 border rounded-lg text-xs">
                    <input v-model.number="c.weight" type="range" min="1" max="99" @input="syncWeights(slug, c.weight)" class="flex-1 accent-blue-600">
                    <span class="text-[10px] text-gray-500 w-8 text-right">{{ c.weight }}%</span>
                    <div class="flex flex-col">
                        <label class="text-[8px] text-gray-400">До:</label>
                        <input v-model="c.hide_until" type="time" class="text-[10px] p-0.5 border rounded">
                    </div>
                    <input v-model="c.color" type="color" class="w-8 h-8 p-0.5 border rounded-lg cursor-pointer">
                    <button @click="deleteCategory(slug)" class="p-1 text-gray-400 hover:text-red-500">🗑</button>
                </div>
                <div class="flex gap-2 pt-2">
                    <button @click="addCategory" class="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold text-xs">+ Добавить</button>
                    <button @click="saveCats" class="flex-1 py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs">Сохранить</button>
                </div>
            </div>

            <!-- Подкатегории -->
            <div v-if="tab === 'sub'" class="space-y-2">
                <div v-for="(coeff, name) in store.subcatCoeffs" :key="name" class="flex items-center gap-2 py-2 border-b border-gray-50">
                    <span class="flex-1 text-sm">{{ name }}</span>
                    <input v-model.number="store.subcatCoeffs[name]" type="range" min="0.5" max="4" step="0.1" class="w-24 accent-blue-600">
                    <span class="text-xs text-gray-500 w-8">{{ coeff.toFixed(1) }}</span>
                    <button @click="deleteSubcat(name)" class="p-1 text-gray-400 hover:text-red-500">🗑</button>
                </div>
                <button @click="saveSubcats" class="w-full py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs mt-4">Сохранить</button>
            </div>

            <!-- Блокнот -->
            <div v-if="tab === 'notepad'">
                <textarea v-model="localNotepad" class="w-full h-64 p-3 border rounded-xl text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Заметки..."></textarea>
                <button @click="saveNotepad" class="w-full py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs">Сохранить</button>
            </div>

            <!-- Данные -->
            <div v-if="tab === 'data'" class="space-y-3">
                <div class="p-4 bg-blue-50 rounded-xl text-[11px] text-blue-800 leading-relaxed">
                    Вы можете экспортировать свои данные в JSON-файл или импортировать бэкап из оригинальной версии daily.html. 
                    <br><strong>Внимание:</strong> Импорт полностью заменит текущие данные!
                </div>
                <button @click="exportData" class="w-full py-3 bg-gray-100 text-blue-600 rounded-xl font-semibold text-sm hover:bg-gray-200">Экспорт данных (JSON)</button>
                <button @click="$refs.fileInput.click()" class="w-full py-3 bg-gray-100 text-blue-600 rounded-xl font-semibold text-sm hover:bg-gray-200">Импорт данных (JSON)</button>
                <input type="file" ref="fileInput" @change="handleImport" accept=".json" class="hidden">
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useBalanceStore } from '../stores/balance';
import axios from 'axios';

const emit = defineEmits(['close']);
const store = useBalanceStore();
const tab = ref('cat');
const tabNames = { cat: 'Категории', sub: 'Подкатегории', notepad: 'Блокнот', data: 'Данные' };

const editableCats = reactive({});
const localNotepad = ref('');

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

const addCategory = () => {
    const newKey = 'cat_' + Date.now();
    editableCats[newKey] = { name: 'Новая', weight: 10, color: '#8e8e93', hide_until: '' };
    syncWeights(newKey, 10);
};

const deleteCategory = (slug) => {
    if (Object.keys(editableCats).length <= 1) return;
    delete editableCats[slug];
    const firstRemaining = Object.keys(editableCats)[0];
    syncWeights(firstRemaining, editableCats[firstRemaining].weight);
};

const saveCats = async () => {
    try {
        // Here we'd ideally have a batch endpoint for categories, 
        // but for MVP we can use settings or update individually.
        // Let's implement a quick sync logic in store.
        await axios.post('/api/import', {
            categories: {
                ...editableCats,
                '__archive__': store.categories.find(c => c.slug === '__archive__')
            },
            tasks: store.tasks, // Keep existing
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
    await saveCats(); // Uses the same batch sync logic
};

const saveNotepad = async () => {
    await axios.post('/api/settings', { settings: { notepad_text: localNotepad.value } });
    store.notepadText = localNotepad.value;
    alert('Блокнот сохранен');
};

const exportData = async () => {
    const res = await axios.get('/api/export');
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
            await axios.post('/api/import', d);
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
