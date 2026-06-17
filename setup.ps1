# 星链 AI Lex — 项目初始化脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   星链 AI Lex — 项目初始化" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 生成 Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma Client 生成失败" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "✅ Prisma Client 生成完成" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] 推送数据库结构到 Supabase..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 数据库推送失败，请检查 .env.local 中的 DATABASE_URL" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}
Write-Host "✅ 数据库结构推送完成" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] 检查项目能否启动..." -ForegroundColor Yellow
Write-Host "请手动运行: npm run dev" -ForegroundColor Cyan
Write-Host "然后在浏览器打开 http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ 初始化完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Read-Host "按 Enter 退出"
