FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock .

RUN bun install --frozen-lockfile --production

COPY src/ ./src/

ENV PORT=3000
ENV DATABASE_URL=postgres://postgres:postgres@db:5432/ccp

EXPOSE $PORT

CMD ["bun", "run", "start"]

