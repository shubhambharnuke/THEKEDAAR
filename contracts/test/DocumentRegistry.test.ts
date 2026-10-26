import { expect } from "chai";
import { ethers } from "hardhat";
import { DocumentRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DocumentRegistry Smart Contract", function () {
  let registry: DocumentRegistry;
  let owner: HardhatEthersSigner;
  let authority1: HardhatEthersSigner;
  let unauthorizedUser: HardhatEthersSigner;

  const sampleDocId = "PL-SW-0001-V1-ABCDEF";
  const sampleDocHash = ethers.keccak256(ethers.toUtf8Bytes("Test PDF Document Content"));

  beforeEach(async function () {
    [owner, authority1, unauthorizedUser] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("DocumentRegistry");
    registry = await factory.deploy();
    await registry.waitForDeployment();
  });

  it("should set deployer as contract owner", async function () {
    expect(await registry.owner()).to.equal(owner.address);
    expect(await registry.authorizedIssuers(owner.address)).to.be.true;
  });

  it("should allow owner to authorize and revoke department issuers", async function () {
    await expect(registry.authorizeIssuer(authority1.address))
      .to.emit(registry, "IssuerAuthorized")
      .withArgs(authority1.address);

    expect(await registry.authorizedIssuers(authority1.address)).to.be.true;

    await expect(registry.revokeIssuer(authority1.address))
      .to.emit(registry, "IssuerRevoked")
      .withArgs(authority1.address);

    expect(await registry.authorizedIssuers(authority1.address)).to.be.false;
  });

  it("should record a document hash from authorized issuer", async function () {
    await registry.authorizeIssuer(authority1.address);

    await expect(registry.connect(authority1).recordDocument(sampleDocHash, sampleDocId, 1))
      .to.emit(registry, "DocumentRecorded");

    const record = await registry.getDocument(sampleDocHash);
    expect(record.documentHash).to.equal(sampleDocHash);
    expect(record.documentId).to.equal(sampleDocId);
    expect(record.version).to.equal(1n);
    expect(record.issuer).to.equal(authority1.address);
    expect(record.isRevoked).to.be.false;

    expect(await registry.isDocumentValid(sampleDocHash)).to.be.true;

    // Lookup by documentId
    const recordById = await registry.getDocumentByLetterId(sampleDocId);
    expect(recordById.documentHash).to.equal(sampleDocHash);
  });

  it("should reject duplicate document hash registration", async function () {
    await registry.recordDocument(sampleDocHash, sampleDocId, 1);

    await expect(
      registry.recordDocument(sampleDocHash, "PL-ANOTHER-ID", 1)
    ).to.be.revertedWith("DocumentRegistry: document hash already registered");
  });

  it("should reject document recording from unauthorized callers", async function () {
    await expect(
      registry.connect(unauthorizedUser).recordDocument(sampleDocHash, sampleDocId, 1)
    ).to.be.revertedWith("DocumentRegistry: caller is not an authorized issuer");
  });

  it("should allow original issuer or owner to revoke document", async function () {
    await registry.authorizeIssuer(authority1.address);
    await registry.connect(authority1).recordDocument(sampleDocHash, sampleDocId, 1);

    // Revocation by authorized issuer
    await expect(registry.connect(authority1).revokeDocument(sampleDocHash))
      .to.emit(registry, "DocumentRevoked");

    const record = await registry.getDocument(sampleDocHash);
    expect(record.isRevoked).to.be.true;
    expect(await registry.isDocumentValid(sampleDocHash)).to.be.false;
  });

  it("should reject revocation by unauthorized third party", async function () {
    await registry.authorizeIssuer(authority1.address);
    await registry.connect(authority1).recordDocument(sampleDocHash, sampleDocId, 1);

    await expect(
      registry.connect(unauthorizedUser).revokeDocument(sampleDocHash)
    ).to.be.revertedWith("DocumentRegistry: caller is not an authorized issuer");
  });
});
