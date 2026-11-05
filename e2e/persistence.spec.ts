import { test, expect, type Page } from '@playwright/test'
import {
  STUDIO_STORAGE_KEY,
  SAMPLE_SCENE,
  clearStudioStorage,
  gotoProjects,
  createProject,
  addScene,
  sceneField,
  fillSceneFields,
  saveScene,
  readStudioEnvelope,
} from './helpers/studio'

/**
 * 持久化、降级与未保存拦截 E2E（技术 Spec §8.1，覆盖 REQ-006/007）。
 * - PERSIST：localStorage 版本化写入、setItem 抛错降级内存态、损坏数据容错。
 * - GUARD：未保存离开的「留下/放弃」两分支、无脏不打扰、beforeunload 弱断言。
 * 异常注入统一用 page.addInitScript 在页面脚本前覆写 Storage，不依赖隐私模式（§8.3）。
 */

/** 让 localStorage.setItem 始终抛错，模拟存储禁用/配额异常（REQ-006.3）。 */
async function blockStorageWrites(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new Error('mock: localStorage.setItem unavailable')
    }
  })
}

/** 向业务 key 注入损坏 JSON，模拟损坏/不可解析数据（技术 Spec §4.2-3）。 */
async function injectCorruptEnvelope(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    try {
      window.localStorage.setItem(key, '{not-valid-json,,,')
    } catch {
      // 忽略测试夹具自身写入异常
    }
  }, STUDIO_STORAGE_KEY)
}

test.describe('剧创平台 · 持久化与降级（REQ-006）', () => {
  test.beforeEach(async ({ page }) => {
    await clearStudioStorage(page)
  })

  test('PERSIST-001: 保存后数据写入预期 key，信封含所建项目（REQ-006.2/§4.1）', async ({
    page,
  }) => {
    await gotoProjects(page)
    await createProject(page, '持久化项目')
    // 创建项目即持久化（技术 Spec §4.3）
    let envelope = (await readStudioEnvelope(page)) as {
      version: number
      projects: { name: string }[]
      scenes: unknown[]
    } | null
    expect(envelope).not.toBeNull()
    expect(envelope?.version).toBe(1)
    expect(envelope?.projects.map((p) => p.name)).toContain('持久化项目')

    await addScene(page)
    await fillSceneFields(page, SAMPLE_SCENE)
    await saveScene(page)

    envelope = (await readStudioEnvelope(page)) as typeof envelope
    expect(envelope?.scenes.length).toBeGreaterThan(0)
    const savedScene = (envelope?.scenes as { title: string }[])[0]
    expect(savedScene.title).toBe(SAMPLE_SCENE.title)
  })

  test('PERSIST-002: 存储写入异常时降级内存态、提示刷新不保留且内容不丢（REQ-006.3）', async ({
    page,
  }) => {
    await blockStorageWrites(page)
    await page.goto('/')
    await expect(page).toHaveURL(/#\/projects$/)

    await createProject(page, '降级项目')
    await addScene(page)
    await fillSceneFields(page, SAMPLE_SCENE)
    await saveScene(page)

    // 出现「刷新后不保留」的内存态降级提示（非阻断）
    await expect(
      page.getByText(/刷新后.*不保留|不会保留|内存|in-memory|not.*retain/i).first(),
    ).toBeVisible()
    // 当前会话内容仍可见、可编辑，未崩溃
    await expect(sceneField(page, /场次标题|标题|Title/i)).toHaveValue(SAMPLE_SCENE.title)
    await sceneField(page, /地点|Location/i).fill('临时改地点')
    await expect(sceneField(page, /地点|Location/i)).toHaveValue('临时改地点')
  })

  test('PERSIST-003: 损坏数据容错回退空态，不白屏（技术 Spec §4.2-3）', async ({ page }) => {
    await injectCorruptEnvelope(page)
    await page.goto('/')
    await expect(page).toHaveURL(/#\/projects$/)
    // 回退空态：新建引导仍可用，应用正常渲染
    await expect(
      page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first(),
    ).toBeVisible()
  })
})

test.describe('剧创平台 · 未保存更改拦截（REQ-007）', () => {
  test.beforeEach(async ({ page }) => {
    await clearStudioStorage(page)
  })

  /** 建项目 → 加场次 → 填写但不保存，制造未保存脏态，并触发一次离开导航。 */
  async function makeDirtyAndAttemptLeave(page: Page): Promise<void> {
    await gotoProjects(page)
    await createProject(page, '守卫项目')
    await addScene(page)
    await fillSceneFields(page, SAMPLE_SCENE)
    // 尝试返回工作台，触发离开确认
    await page.getByRole('button', { name: /返回|Back|工作台|项目列表/i }).first().click()
  }

  test('GUARD-001: 有未保存更改离开时弹确认，选「留下」保留内容与脏态（REQ-007.1/7.2）', async ({
    page,
  }) => {
    await makeDirtyAndAttemptLeave(page)
    // 确认弹窗提供两个选择
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: /留下|继续编辑|Stay|Keep/i }).first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: /放弃|离开|Discard|Leave/i }).first(),
    ).toBeVisible()

    await page.getByRole('button', { name: /留下|继续编辑|Stay|Keep/i }).first().click()
    // 取消导航：仍在项目详情，编辑内容与未保存状态保留
    await expect(page).toHaveURL(/#\/project\//)
    await expect(sceneField(page, /场次标题|标题|Title/i)).toHaveValue(SAMPLE_SCENE.title)
    await expect(page.getByText(/未保存|Unsaved/i).first()).toBeVisible()
  })

  test('GUARD-002: 选「放弃更改并离开」丢弃改动并导航，已保存内容不受影响（REQ-007.3）', async ({
    page,
  }) => {
    // 先保存一个场次作为历史已提交内容
    await gotoProjects(page)
    await createProject(page, '守卫项目二')
    await addScene(page)
    await fillSceneFields(page, { ...SAMPLE_SCENE, title: '已保存场次' })
    await saveScene(page)
    await expect(page.getByText(/已保存|保存成功|Saved/i).first()).toBeVisible()

    // 再新增第二个场次制造未保存改动
    await addScene(page)
    await sceneField(page, /场次标题|标题|Title/i).fill('未保存场次')
    await page.getByRole('button', { name: /返回|Back|工作台|项目列表/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: /放弃|离开|Discard|Leave/i }).first().click()

    // 导航到工作台
    await expect(page).toHaveURL(/#\/projects$/)
    // 重新进入项目：已保存场次仍在，未保存场次被丢弃
    await page.getByRole('button', { name: /守卫项目二/ }).first().click()
    await expect(page).toHaveURL(/#\/project\//)
    await expect(page.getByText(/已保存场次/).first()).toBeVisible()
    await expect(page.getByText(/未保存场次/)).toHaveCount(0)
  })

  test('GUARD-003: 无未保存更改时导航不弹确认（REQ-007.4）', async ({ page }) => {
    await gotoProjects(page)
    await createProject(page, '干净项目')
    await addScene(page)
    await fillSceneFields(page, SAMPLE_SCENE)
    await saveScene(page)
    // 保存后无脏态，直接返回不应出现确认弹窗
    await page.getByRole('button', { name: /返回|Back|工作台|项目列表/i }).first().click()
    await expect(page).toHaveURL(/#\/projects$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('GUARD-004: 脏态下注册 beforeunload 监听（能力弱断言，REQ-007.5）', async ({
    page,
  }) => {
    // 在页面脚本前包裹 addEventListener，记录 beforeunload 注册情况
    await page.addInitScript(() => {
      const w = window as unknown as { __beforeUnloadRegistered?: boolean }
      const original = window.addEventListener.bind(window)
      window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === 'beforeunload') {
          w.__beforeUnloadRegistered = true
        }
        return original(type, listener)
      }) as typeof window.addEventListener
    })
    await gotoProjects(page)
    await createProject(page, '卸载监听项目')
    await addScene(page)
    await fillSceneFields(page, SAMPLE_SCENE)
    // 存在未保存更改后，应已注册 beforeunload（渐进增强，断言从宽）
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const w = window as unknown as { __beforeUnloadRegistered?: boolean }
          return w.__beforeUnloadRegistered === true
        }),
      )
      .toBeTruthy()
  })
})
