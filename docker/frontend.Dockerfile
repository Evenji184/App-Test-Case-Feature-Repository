FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /app/public

RUN npm install -g serve

RUN printf '%s\n' \
  '<!doctype html>' \
  '<html lang="zh-CN">' \
  '<head>' \
  '  <meta charset="UTF-8" />' \
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />' \
  '  <title>Frontend Placeholder</title>' \
  '  <style>body{font-family:Arial,sans-serif;padding:40px;background:#0f172a;color:#e2e8f0}code{background:#1e293b;padding:2px 6px;border-radius:4px}</style>' \
  '</head>' \
  '<body>' \
  '  <h1>Frontend Placeholder</h1>' \
  '  <p>当前仓库尚未提供前端工程目录，容器仅作为部署占位。</p>' \
  '  <p>后续可将真实前端项目挂载或替换为正式构建流程。</p>' \
  '</body>' \
  '</html>' \
  > /app/public/index.html

EXPOSE 3000

CMD ["npx", "serve", "-s", "/app/public", "-l", "3000"]

