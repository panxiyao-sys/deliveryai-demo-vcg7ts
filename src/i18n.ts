import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  zh: {
    translation: {
      common: {
        title: '剧创平台 · 剧本创作工作台',
        meta_desc: '剧创平台 · 面向影视/短剧团队的剧本/短剧创作协同工作台（纯前端概念演示）',
        brand_name: '剧创平台',
        brand_subtitle: '剧本创作工作台',
        aria_lang: '切换语言',
        aria_close: '关闭',
        language: 'EN',
        save: '保存',
        cancel: '取消',
        create: '创建',
        confirm: '确认',
        unsaved_badge: '未保存',
      },
      projects: {
        heading: '我的剧本项目',
        subheading: '创建项目，按场次结构化地创作剧本与短剧。',
        new_project: '新建项目',
        aria_new_project: '新建剧本项目',
        empty_title: '还没有剧本项目',
        empty_desc: '新建一个项目，开始你的第一场创作。',
        empty_action: '立即新建项目',
        card_scenes: '{{count}} 个场次',
        card_updated: '更新于 {{time}}',
        dialog_title: '新建剧本项目',
        name_label: '项目名称',
        name_placeholder: '例如：破晓 · 第一集',
        name_required: '项目名称不能为空，请输入名称。',
        create_success: '项目已创建',
      },
      project: {
        back: '返回项目列表',
        aria_back: '返回项目列表',
        add_scene: '添加场次',
        aria_add_scene: '添加场次',
        scenes_title: '场次列表',
        empty_scene_title: '项目内还没有场次',
        empty_scene_desc: '添加一个场次，按场景、人物、对白结构化撰写。',
        scene_count: '第 {{order}} 场',
        untitled_scene: '未命名场次',
        current_badge: '当前',
      },
      scene: {
        title_label: '场次标题',
        title_placeholder: '必填，例如：第一场 雨夜巷口',
        title_required: '场次标题不能为空，请填写标题后再保存。',
        scene_label: '场景描述',
        scene_placeholder: '描述环境、氛围与镜头感（可留空）',
        location_label: '地点',
        location_placeholder: '例如：老街巷口',
        time_label: '时间',
        time_placeholder: '例如：外景 · 夜',
        characters_label: '出场人物',
        characters_placeholder: '多人可用换行或顿号罗列',
        dialogue_label: '对白 / 正文',
        dialogue_placeholder: '撰写本场对白与动作描写',
        saved_feedback: '已保存',
      },
      guard: {
        title: '有未保存的更改',
        desc: '离开当前场次将丢弃尚未保存的内容，已保存的内容不受影响。',
        stay: '留下继续编辑',
        discard: '放弃更改并离开',
      },
      storage: {
        memory_banner: '当前浏览器存储不可用，内容仅保存在本次会话中，刷新后将不保留。',
        memory_aria: '存储降级提示',
      },
    },
  },
  en: {
    translation: {
      common: {
        title: 'Drama Studio · Screenwriting Workspace',
        meta_desc: 'Drama Studio — a collaborative screenwriting workspace for film and short-drama teams (front-end concept demo)',
        brand_name: 'Drama Studio',
        brand_subtitle: 'Screenwriting Workspace',
        aria_lang: 'Switch language',
        aria_close: 'Close',
        language: '中',
        save: 'Save',
        cancel: 'Cancel',
        create: 'Create',
        confirm: 'Confirm',
        unsaved_badge: 'Unsaved',
      },
      projects: {
        heading: 'My Script Projects',
        subheading: 'Create a project and write your story scene by scene.',
        new_project: 'New Project',
        aria_new_project: 'Create a new script project',
        empty_title: 'No script projects yet',
        empty_desc: 'Create a project to start your first scene.',
        empty_action: 'Create a project now',
        card_scenes: '{{count}} scenes',
        card_updated: 'Updated {{time}}',
        dialog_title: 'New Script Project',
        name_label: 'Project name',
        name_placeholder: 'e.g. Daybreak · Episode 1',
        name_required: 'Project name cannot be empty.',
        create_success: 'Project created',
      },
      project: {
        back: 'Back to projects',
        aria_back: 'Back to project list',
        add_scene: 'Add Scene',
        aria_add_scene: 'Add a scene',
        scenes_title: 'Scenes',
        empty_scene_title: 'No scenes in this project yet',
        empty_scene_desc: 'Add a scene and write it with structure: setting, characters, dialogue.',
        scene_count: 'Scene {{order}}',
        untitled_scene: 'Untitled scene',
        current_badge: 'Current',
      },
      scene: {
        title_label: 'Scene title',
        title_placeholder: 'Required, e.g. Scene 1 — Rainy Alley',
        title_required: 'Scene title cannot be empty. Add a title before saving.',
        scene_label: 'Scene description',
        scene_placeholder: 'Describe the environment, mood and camera feel (optional)',
        location_label: 'Location',
        location_placeholder: 'e.g. Old street alley',
        time_label: 'Time',
        time_placeholder: 'e.g. Exterior · Night',
        characters_label: 'Characters',
        characters_placeholder: 'Separate multiple characters with line breaks or commas',
        dialogue_label: 'Dialogue / Body',
        dialogue_placeholder: 'Write the dialogue and action for this scene',
        saved_feedback: 'Saved',
      },
      guard: {
        title: 'Unsaved changes',
        desc: 'Leaving this scene will discard unsaved edits. Saved content is not affected.',
        stay: 'Keep editing',
        discard: 'Discard and leave',
      },
      storage: {
        memory_banner: 'Browser storage is unavailable. Content is kept only in this session and will be lost on refresh.',
        memory_aria: 'Storage degraded notice',
      },
    },
  },
}

const STORAGE_KEY = 'i18nextLng'

function getInitialLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'zh' || stored === 'en') return stored
  } catch {
    // localStorage 不可用时降级为默认中文
  }
  return 'zh'
}

void i18next.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
