import { ethers } from "ethers";
import * as dotenv from "dotenv"; dotenv.config();

const { RPC_URL, PRIVATE_KEY, NFT_ADDRESS } = process.env;
if (!RPC_URL || !PRIVATE_KEY || !NFT_ADDRESS)
  throw new Error("请在 .env 写 RPC_URL / PRIVATE_KEY / NFT_ADDRESS");

const COORD  = "0x8103B0A8A00be2DDC778E6e7eaa21791Cd364625"; // ✓ 40 hex
const LINK   = "0x779877A7B0D9E8603169DdbD7836e478b4624789";  // ✓
const FUND   = ethers.parseUnits("30", 18);                   // 30 LINK

const coordAbi = [
  "function createSubscription() returns (uint64)",
  "function addConsumer(uint64,address)",
];
const linkAbi  = [
  "function transferAndCall(address,uint256,bytes) returns (bool)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
const coord    = new ethers.Contract(COORD, coordAbi, wallet);
const link     = new ethers.Contract(LINK, linkAbi,  wallet);

(async () => {
  console.log("👛 钱包:", wallet.address);

  // ① create subscription
  const tx1 = await coord.createSubscription();
  const rc1 = await tx1.wait();
  const subId = rc1.logs[0].args.subId;
  console.log("✅ 新订阅 =", subId.toString());

  // ② fund 30 LINK
  const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [subId]);
  await (await link.transferAndCall(COORD, FUND, data)).wait();
  console.log("✅ 已充值 30 LINK");

  // ③ add consumer
  await (await coord.addConsumer(subId, NFT_ADDRESS)).wait();
  console.log("✅ 已添加 consumer:", NFT_ADDRESS);

  console.log("\n🎉 完成！subscriptionId =", subId.toString());
})();
