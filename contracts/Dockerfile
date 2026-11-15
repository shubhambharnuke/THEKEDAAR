FROM node:20-alpine

WORKDIR /app

# Copy contracts package files
COPY contracts/package.json ./contracts/
COPY package.json package-lock.json ./

# Install packages
RUN npm install

# Copy contract source code and scripts
COPY contracts ./contracts

WORKDIR /app/contracts

EXPOSE 8545

# Start local hardhat node and auto-deploy contract
CMD ["sh", "-c", "npx hardhat node & sleep 4 && npx hardhat run scripts/deploy.ts --network localhost && wait"]
