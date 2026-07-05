FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages
COPY tsconfig*.json ./
COPY eslint.config.js ./
COPY .prettierrc ./
RUN npm ci
RUN npm run build:bookshop

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/widget/package.json ./apps/widget/package.json
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/game-content/package.json ./packages/game-content/package.json
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/widget/dist ./apps/widget/dist
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /app/packages/game-content/dist ./packages/game-content/dist
EXPOSE 3100
CMD ["node", "apps/server/dist/index.js"]
