import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * 剧创平台 E2E 共享导航/夹具（技术 Spec §8.1 QA-1）。
 *
 * 契约来源：
 * - 存储 key / 信封：技术 Spec §4.1（juchuang.studio.v1，StorageEnvelope）
 * - 路由 hash：技术 Spec §5（#/projects、#/project/:id，非法/旧 hash 纠正到 #/projects）
 * - 场次字段：产品 Spec REQ-005 / 技术 Spec §3.1（title/scene/location/time/characters/dialogue）
 *
 * 定位优先级遵循 docs/agent-testing.md §5：
 * getByRole(带可访问名) > getByLabel/getByText > 语义 locator > 兜底 CSS。
 * 可见文案与组件命名以技术 Spec §2.1 的组件职责为准；前端落地若文案微调，
 * 仅需在本文件集中调整，不改各 spec 断言结构。
 */

/** 业务本地存储 key（技术 Spec §4.1 决策值，带域前缀与版本）。 */
export const STUDIO_STORAGE_KEY = 'juchuang.studio.v1'

/** 旧火锅点单业务 hash（REQ-008.1/8.2，均应被纠正到 #/projects）。 */
export const LEGACY_HOTPOT_HASHES = [
  '#/home',
  '#/welcome',
  '#/menu',
  '#/order',
  '#/checkout',
]

/** REQ-005 场次结构化字段（除标题外均可空）。 */
export interface SceneFields {
  title: string
  scene: string
  location: string
  time: string
  characters: string
  dialogue: string
}

export const SAMPLE_SCENE: SceneFields = {
  title: '第一场 雨夜巷口',
  scene: '暴雨倾盆，昏暗路灯下巷口积水反光。',
  location: '老街巷口',
  time: '外景·夜',
  characters: '林夏、老陈',
  dialogue: '林夏：「你终于还是来了。」\n老陈：「有些事，总得有人做。」',
}

/** 每个 test 前置清理业务 key，保证用例独立可乱序（技术 Spec §8.3）。 */
export async function clearStudioStorage(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // 存储不可用时无需清理，降级路径由 PERSIST 用例单独覆盖
    }
  }, STUDIO_STORAGE_KEY)
}

/** 直接读取业务存储信封（PERSIST-001 断言持久化内容用）。 */
export async function readStudioEnvelope(page: Page): Promise<unknown> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  }, STUDIO_STORAGE_KEY)
}

/** 打开工作台（项目列表视图）。 */
export async function gotoProjects(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/projects$/)
}

/**
 * 新建剧本项目并进入项目详情（STUDIO-002 主路径）。
 * 覆盖 REQ-001：点击新建入口 → 填写名称 → 提交 → 进入详情。
 */
export async function createProject(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first().click()
  const nameInput = page.getByLabel(/项目名称|项目名|Name/i).first()
  await nameInput.fill(name)
  await page.getByRole('button', { name: /^(创建|确定|Create)/i }).first().click()
  // 创建成功后进入项目详情视图（hash 携带 projectId）
  await expect(page).toHaveURL(/#\/project\//)
}

/** 从项目列表打开第一个项目（按名称匹配卡片入口）。 */
export async function openProjectByName(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(name) }).first().click()
  await expect(page).toHaveURL(/#\/project\//)
}

/** 在项目详情内新增一个场次并置为当前编辑对象（REQ-004.1）。 */
export async function addScene(page: Page): Promise<void> {
  await page.getByRole('button', { name: /添加.*场次|新增.*场次|Add scene/i }).first().click()
}

/** 场次编辑区字段输入框（按 label 关联，REQ-005 六字段）。 */
export function sceneField(page: Page, label: RegExp): Locator {
  return page.getByLabel(label).first()
}

/** 填写场次结构化字段（不点击保存）。 */
export async function fillSceneFields(page: Page, fields: SceneFields): Promise<void> {
  await sceneField(page, /场次标题|标题|Title/i).fill(fields.title)
  await sceneField(page, /场景|Scene(?!.*标题)/i).fill(fields.scene)
  await sceneField(page, /地点|Location/i).fill(fields.location)
  await sceneField(page, /时间|Time/i).fill(fields.time)
  await sceneField(page, /出场人物|人物|Characters/i).fill(fields.characters)
  await sceneField(page, /对白|正文|Dialogue/i).fill(fields.dialogue)
}

/** 点击显式「保存」（REQ-006.1，OQ-004 默认显式保存）。 */
export async function saveScene(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^保存|Save/i }).first().click()
}

/** 完整主路径：建项目 → 加场次 → 填字段 → 保存。 */
export async function createProjectWithSavedScene(
  page: Page,
  projectName: string,
  scene: SceneFields = SAMPLE_SCENE,
): Promise<void> {
  await gotoProjects(page)
  await createProject(page, projectName)
  await addScene(page)
  await fillSceneFields(page, scene)
  await saveScene(page)
}

/** 复用 test 导出，供 spec 直接引入，保持单一 import 来源。 */
export { test, expect }
