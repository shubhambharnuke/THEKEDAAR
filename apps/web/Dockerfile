FROM node:20-alpine AS base

WORKDIR /app

# Copy package descriptors
COPY apps/web/package.json ./apps/web/
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy web app source
COPY apps/web ./apps/web

WORKDIR /app/apps/web

ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev"]
