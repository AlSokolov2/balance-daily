# SPECIFICATION: Переход на Vue Router и Tab Bar

## 1. Технический стек
- **Библиотека:** `vue-router@4`
- **Режим:** `createWebHashHistory`
- **Анимации:** `Animate.css` или кастомные `Vue Transitions` (Slide/Fade)

## 2. Структура маршрутов (Routes)
- `/` - `MainView` (Диаграмма пузырей)
- `/stats` - `StatsView` (перенос логики из StatsModal)
- `/notepad` - `NotepadView` (перенос логики из SettingsModal > Tab Notepad)
- `/settings` - `SettingsView` (перенос логики из SettingsModal)
- `/task/:id` - `EditTaskView` (Overlay)
- `/category/:slug` - `EditCategoryView` (Overlay)

## 3. Компоненты
### 3.1 MobileBottomNav.vue (Рефакторинг)
- Замена выпадающего меню аватара на ряд иконок:
  - [Icon] Главная (Home)
  - [Icon] Статистика (Chart)
  - [Center Button] Добавить (Plus)
  - [Icon] Блокнот (Notepad)
  - [Icon] Настройки (Gear)

### 3.2 App.vue (Рефакторинг)
- Внедрение `<router-view>` в качестве основного контейнера.
- Обертка для обработки "Стека" (наложение экранов редактирования поверх главной).

## 4. Логика навигации
- При открытии `/task/:id` или `/category/:slug` нижний Tab Bar скрывается.
- При переключении между `/`, `/stats`, `/notepad`, `/settings` Tab Bar остается видимым.
- Состояние `balance.js` (Pinia) сохраняется между всеми переходами.
