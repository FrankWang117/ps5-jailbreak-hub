# 临时构建/发布工具镜像；不作为常驻服务，不复制代码或环境文件。
FROM node:22.14.0-bookworm
RUN npm install --global pnpm@10.10.0
ENV HOME=/tmp
WORKDIR /workspace
