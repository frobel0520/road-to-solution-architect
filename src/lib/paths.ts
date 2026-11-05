// 內容目錄可由環境變數切換，E2E 用 tests/fixtures/content 建置，不讓測試依賴正式內容的文字。
export const contentDir = process.env.RTSA_CONTENT_DIR ?? "content";
export const curriculumPath = "docs/curriculum.md";
