import { test, expect, type Page } from '@playwright/test'
import {
  STUDIO_STORAGE_KEY,
  SAMPLE_SCENE,
  clearStudioStorage,
  gotoProjects,
  createProject,
  openProjectByName,
  addScene,
  sceneField,
  fillSceneFields,
  saveScene,
  createProjectWithSavedScene,
} from './helpers/studio'

const PROJECT_NAME = '破晓·第一集'

/** 进入项目详情并新增一个场次，返回当前编辑区。 */
async function openProjectWithScene(page: Page, projectName: string): Promise<void> {
  await gotoProjects(page)
  await createProject(page, projectName)
  await addScene(page)
}

test.describe('剧创平台 · 最小创作闭环（REQ-001/002/004/005/006）', () => {
  test.beforeEach(async ({ page }) => {
    await clearStudioStorage(page)
  })

  test('STUDIO-001: 首次进入为空态并引导新建项目（REQ-002.2）', async ({ page }) => {
    await gotoProjects(page)
    // 全局无项目：展示空态说明与显著的新建引导
    await expect(page.getByText(/还没有|暂无|空|创建你的第一个|No projects/i).first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first(),
    ).toBeVisible()
  })

  test('STUDIO-002: 合法名称创建项目并进入详情、列表出现该项目（REQ-001.1/1.2）', async ({
    page,
  }) => {
    await gotoProjects(page)
    await createProject(page, PROJECT_NAME)
    // 已进入项目详情
    await expect(page).toHaveURL(/#\/project\//)
    await expect(page.getByRole('heading', { name: new RegExp(PROJECT_NAME) })).toBeVisible()
    // 返回列表，项目出现在列表中
    await page.getByRole('button', { name: /返回|Back|工作台|项目列表/i }).first().click()
    await expect(page).toHaveURL(/#\/projects$/)
    await expect(page.getByText(new RegExp(PROJECT_NAME)).first()).toBeVisible()
  })

  test('STUDIO-003: 项目名称为空被拦截、提示必填且不产生项目（REQ-001.3）', async ({
    page,
  }) => {
    await gotoProjects(page)
    await page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first().click()
    const nameInput = page.getByLabel(/项目名称|项目名|Name/i).first()
    // 仅空白
    await nameInput.fill('   ')
    await page.getByRole('button', { name: /^(创建|确定|Create)/i }).first().click()
    // 停留在表单并出现必填提示，未导航到详情
    await expect(page).toHaveURL(/#\/projects$/)
    await expect(page.getByText(/名称.*必填|请输入.*名称|name.*required/i).first()).toBeVisible()
    // 未产生任何项目：空态引导仍在
    await expect(
      page.getByRole('button', { name: /新建.*项目|新建项目|New project/i }).first(),
    ).toBeVisible()
  })

  test('STUDIO-004: 项目内空态引导添加场次，添加后新场次置为当前（REQ-003.3/004.1）', async ({
    page,
  }) => {
    await gotoProjects(page)
    await createProject(page, PROJECT_NAME)
    // 项目内无场次：展示添加场次引导
    await expect(
      page.getByRole('button', { name: /添加.*场次|新增.*场次|Add scene/i }).first(),
    ).toBeVisible()
    const beforeCount = await page.getByRole('listitem').count()
    await addScene(page)
    // 场次列表新增一条
    await expect.poll(async () => page.getByRole('listitem').count()).toBeGreaterThan(beforeCount)
    // 编辑区出现场次标题输入框，说明新场次已置为当前编辑对象
    await expect(sceneField(page, /场次标题|标题|Title/i)).toBeVisible()
  })

  test('STUDIO-005: 多场次按创建顺序稳定展示、归属同一项目且可切换（REQ-004.2/4.3）', async ({
    page,
  }) => {
    await openProjectWithScene(page, PROJECT_NAME)
    await sceneField(page, /场次标题|标题|Title/i).fill('场次甲')
    await saveScene(page)
    await addScene(page)
    await sceneField(page, /场次标题|标题|Title/i).fill('场次乙')
    await saveScene(page)

    const items = page.getByRole('listitem')
    await expect(items).toHaveCount(2)
    // 稳定顺序：先甲后乙
    await expect(items.nth(0)).toContainText(/场次甲/)
    await expect(items.nth(1)).toContainText(/场次乙/)

    // 切换回第一个场次，编辑区标题回显为场次甲
    await items.nth(0).click()
    await expect(sceneField(page, /场次标题|标题|Title/i)).toHaveValue('场次甲')
  })

  test('STUDIO-006: 填写全部结构化字段保存后按字段分别回显（REQ-005.1/5.4）', async ({
    page,
  }) => {
    await openProjectWithScene(page, PROJECT_NAME)
    await fillSceneFields(page, SAMPLE_SCENE)
    await saveScene(page)

    // 切换场次再切回，触发按字段回显（验证结构化存储而非拼接文本）
    const items = page.getByRole('listitem')
    await addScene(page)
    await items.nth(0).click()

    await expect(sceneField(page, /场次标题|标题|Title/i)).toHaveValue(SAMPLE_SCENE.title)
    await expect(sceneField(page, /场景|Scene(?!.*标题)/i)).toHaveValue(SAMPLE_SCENE.scene)
    await expect(sceneField(page, /地点|Location/i)).toHaveValue(SAMPLE_SCENE.location)
    await expect(sceneField(page, /时间|Time/i)).toHaveValue(SAMPLE_SCENE.time)
    await expect(sceneField(page, /出场人物|人物|Characters/i)).toHaveValue(
      SAMPLE_SCENE.characters,
    )
    await expect(sceneField(page, /对白|正文|Dialogue/i)).toHaveValue(SAMPLE_SCENE.dialogue)
  })

  test('STUDIO-007: 场次标题为空保存被拒、提示必填且其它字段不丢（REQ-005.2/006.5）', async ({
    page,
  }) => {
    await openProjectWithScene(page, PROJECT_NAME)
    // 标题留空，仅填其它字段
    await sceneField(page, /地点|Location/i).fill(SAMPLE_SCENE.location)
    await sceneField(page, /对白|正文|Dialogue/i).fill(SAMPLE_SCENE.dialogue)
    await saveScene(page)

    // 标题必填提示出现
    await expect(
      page.getByText(/标题.*必填|请输入.*标题|title.*required/i).first(),
    ).toBeVisible()
    // 已填写的其它字段内容保留
    await expect(sceneField(page, /地点|Location/i)).toHaveValue(SAMPLE_SCENE.location)
    await expect(sceneField(page, /对白|正文|Dialogue/i)).toHaveValue(SAMPLE_SCENE.dialogue)
    // 校验失败不写入持久化层
    const envelope = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as { scenes?: unknown[] }) : null
    }, STUDIO_STORAGE_KEY)
    expect(envelope?.scenes ?? []).toHaveLength(0)
  })

  test('STUDIO-008: 保存成功出现反馈并清除未保存标记（REQ-006.1/005.3）', async ({ page }) => {
    await openProjectWithScene(page, PROJECT_NAME)
    await fillSceneFields(page, SAMPLE_SCENE)
    // 编辑后存在未保存标记
    await expect(page.getByText(/未保存|Unsaved/i).first()).toBeVisible()
    await saveScene(page)
    // 成功反馈
    await expect(page.getByText(/已保存|保存成功|Saved/i).first()).toBeVisible()
    // 未保存标记消失
    await expect(page.getByText(/未保存|Unsaved/i).first()).toHaveCount(0)
  })

  test('STUDIO-009: 保存后刷新，项目与场次内容仍可回看（REQ-006.2）', async ({ page }) => {
    await createProjectWithSavedScene(page, PROJECT_NAME, SAMPLE_SCENE)
    // 刷新页面（持久化可用时数据应留存）
    await page.reload()
    await expect(page).toHaveURL(/#\/project\//)
    // 详情仍展示该场次结构化内容
    await expect(sceneField(page, /场次标题|标题|Title/i)).toHaveValue(SAMPLE_SCENE.title)
    await expect(sceneField(page, /地点|Location/i)).toHaveValue(SAMPLE_SCENE.location)
    await expect(sceneField(page, /对白|正文|Dialogue/i)).toHaveValue(SAMPLE_SCENE.dialogue)

    // 返回列表，项目仍存在
    await page.getByRole('button', { name: /返回|Back|工作台|项目列表/i }).first().click()
    await expect(page).toHaveURL(/#\/projects$/)
    await expect(page.getByText(new RegExp(PROJECT_NAME)).first()).toBeVisible()
  })

  test('STUDIO-010: 刷新后从项目列表重新进入，场次字段按保存值回显（G1 回看闭环）', async ({
    page,
  }) => {
    await createProjectWithSavedScene(page, PROJECT_NAME, SAMPLE_SCENE)
    // 主动回到列表并刷新，模拟重新打开浏览器
    await page.getByRole('button', { name: /返回|Back|工作台|项目列表/i }).first().click()
    await page.reload()
    await expect(page).toHaveURL(/#\/projects$/)
    await openProjectByName(page, PROJECT_NAME)
    await expect(sceneField(page, /场次标题|标题|Title/i)).toHaveValue(SAMPLE_SCENE.title)
    await expect(sceneField(page, /出场人物|人物|Characters/i)).toHaveValue(
      SAMPLE_SCENE.characters,
    )
  })
})
