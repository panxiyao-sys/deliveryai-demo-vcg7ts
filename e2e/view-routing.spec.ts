import { test, expect } from '@playwright/test'
import {
  LEGACY_HOTPOT_HASHES,
  clearStudioStorage,
  gotoProjects,
  createProject,
} from './helpers/studio'

/**
 * 剧创平台 hash 路由 E2E（技术 Spec §8.1，覆盖 REQ-003/REQ-008）。
 * 视图收敛为：#/projects（工作台/项目列表）、#/project/:id（项目详情）。
 * 非法 hash 与旧火锅 hash 一律纠正到 #/projects，无白屏（REQ-003.2/008.2）。
 */
test.describe('剧创平台 · hash 路由与旧业务替换（REQ-003/008）', () => {
  test.beforeEach(async ({ page }) => {
    await clearStudioStorage(page)
  })

  test('ROUTE-001: 默认落地 #/projects，两视图拥有独立 hash', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/#\/projects$/)
    // 工作台视图可见新建项目入口
    await expect(
      page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first(),
    ).toBeVisible()

    // 进入项目详情，hash 切换为 #/project/<id>
    await createProject(page, '路由项目')
    await expect(page).toHaveURL(/#\/project\/[^/]+$/)
  })

  test('ROUTE-002: 深链接直达项目详情，浏览器后退/前进正确（REQ-003.1）', async ({ page }) => {
    await gotoProjects(page)
    await createProject(page, '深链接项目')
    const detailURL = page.url()
    expect(detailURL).toMatch(/#\/project\/[^/]+$/)
    const projectId = detailURL.split('#/project/')[1]

    // 直接输入地址深链接直达
    await page.goto(`/#/project/${projectId}`)
    await expect(page).toHaveURL(new RegExp(`#/project/${projectId}$`))
    await expect(page.getByRole('heading', { name: /深链接项目/ })).toBeVisible()

    // 后退回到工作台，再前进回到详情
    await page.goBack()
    await expect(page).toHaveURL(/#\/projects$/)
    await page.goForward()
    await expect(page).toHaveURL(new RegExp(`#/project/${projectId}$`))
  })

  test('ROUTE-003: 非法 hash 纠正到 #/projects 且无白屏（REQ-003.2）', async ({ page }) => {
    await page.goto('/#/not-a-view')
    await expect(page).toHaveURL(/#\/projects$/)
    // 纠正后应用仍正常渲染（新建入口可见，未白屏）
    await expect(
      page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first(),
    ).toBeVisible()
  })

  test('ROUTE-004: 旧火锅点单 hash 全部纠正到 #/projects，旧页面不可达（REQ-008.1/8.2）', async ({
    page,
  }) => {
    for (const hash of LEGACY_HOTPOT_HASHES) {
      await page.goto(`/${hash}`)
      await expect(page).toHaveURL(/#\/projects$/)
      // 旧餐饮入口（绑定桌台/进入点餐）不应出现
      await expect(page.getByRole('button', { name: /A08|进入点餐|Enter/ })).toHaveCount(0)
      // 新平台工作台入口正常
      await expect(
        page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first(),
      ).toBeVisible()
    }
  })

  test('ROUTE-005: 不存在的项目 id 纠正到 #/projects（REQ-003 失效地址）', async ({ page }) => {
    await page.goto('/#/project/non-existent-id-123')
    await expect(page).toHaveURL(/#\/projects$/)
    await expect(
      page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first(),
    ).toBeVisible()
  })
})
