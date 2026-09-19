import { test } from "node:test";
import assert from "node:assert/strict";
import { setPin, verifyPin, resetAdmin } from "../admin.js";

const memory = () => {
  const map = new Map();
  return { map, getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
};

test("admin PINs are six digits and never stored in clear", async () => {
  const storage = memory();
  await assert.rejects(() => setPin(storage, "12345"));
  await assert.rejects(() => setPin(storage, "abcdef"));
  await setPin(storage, "123456");
  assert.equal(await verifyPin(storage, "123456"), "ok");
  assert.equal(await verifyPin(storage, "000000"), "wrong");
  assert.equal(storage.map.get("bp-admin").includes("123456"), false);
});

test("admin PIN locks after five failures and unlocks after sixty seconds", async () => {
  const storage = memory();
  await setPin(storage, "123456");
  for (let index = 0; index < 4; index += 1) assert.equal(await verifyPin(storage, "000000", 100000), "wrong");
  assert.equal(await verifyPin(storage, "000000", 100000), "locked");
  assert.equal(await verifyPin(storage, "123456", 161000), "ok");
});

test("resetAdmin removes the PIN and imported course but not staff state", async () => {
  const storage = memory();
  await setPin(storage, "123456");
  storage.setItem("bp-learning-course", "course");
  storage.setItem("bp-learning-v3", "staff");
  resetAdmin(storage);
  assert.equal(storage.getItem("bp-admin"), null);
  assert.equal(storage.getItem("bp-learning-course"), null);
  assert.equal(storage.getItem("bp-learning-v3"), "staff");
});
