"""Train Kyle's small language model: a character-level, decoder-only transformer (GPT-style).

Each training row is one sequence:  BOS question SEP answer ACT action EOS
Loss is taken on the answer and action only, so the model learns to respond, not to ask.
Exports float16 weights for the browser runtime in src/kale/slm.js.

Run: python slm/corpus.py && python slm/train.py
"""
import json
import math
import random
import struct
import sys
import time
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F

sys.path.insert(0, str(Path(__file__).parent))
from corpus import normalise  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "kale"
BOS, SEP, ACT, EOS = "\x02", "\x03", "\x04", "\x00"

CFG = dict(n_layer=4, n_head=4, d=128, block=352)
STEPS, BATCH, LR, DROPOUT = 1600, 48, 3e-3, 0.1
torch.manual_seed(0)
random.seed(0)


def seq(r):
    return BOS + r["q"] + SEP + r["a"] + ACT + r["act"] + EOS


rows = [json.loads(l) for l in (Path(__file__).with_name("corpus.jsonl")).read_text(encoding="utf8").splitlines()]
chars = sorted({c for r in rows for c in seq(r)} | set("abcdefghijklmnopqrstuvwxyz0123456789 .,?!'-:#@&/()%+"))
stoi = {c: i for i, c in enumerate(chars)}
V = len(chars)
longest = max(len(seq(r)) for r in rows)
assert longest <= CFG["block"], f"sequence of {longest} chars exceeds block {CFG['block']}"
print(f"{len(rows)} rows, vocab {V}, longest {longest}")


def encode(s):
    return [stoi.get(c, stoi[" "]) for c in s]


data = []
for r in rows:
    ids = encode(seq(r))
    start = len(r["q"]) + 2  # predict from the first answer character on
    data.append((ids, start))


class Block(nn.Module):
    def __init__(self, d, h):
        super().__init__()
        self.h = h
        self.ln1 = nn.LayerNorm(d)
        self.qkv = nn.Linear(d, 3 * d)
        self.proj = nn.Linear(d, d)
        self.ln2 = nn.LayerNorm(d)
        self.fc = nn.Linear(d, 4 * d)
        self.out = nn.Linear(4 * d, d)

    def forward(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(self.ln1(x)).split(C, dim=2)
        q, k, v = (t.view(B, T, self.h, C // self.h).transpose(1, 2) for t in (q, k, v))
        p = DROPOUT if self.training else 0.0
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True)
        x = x + F.dropout(self.proj(y.transpose(1, 2).reshape(B, T, C)), p, self.training)
        return x + F.dropout(self.out(F.gelu(self.fc(self.ln2(x)), approximate="tanh")), p, self.training)


class GPT(nn.Module):
    def __init__(self, V, n_layer, n_head, d, block):
        super().__init__()
        self.tok = nn.Embedding(V, d)
        self.pos = nn.Embedding(block, d)
        self.blocks = nn.ModuleList(Block(d, n_head) for _ in range(n_layer))
        self.ln = nn.LayerNorm(d)
        self.apply(self._init)

    @staticmethod
    def _init(m):
        if isinstance(m, (nn.Linear, nn.Embedding)):
            nn.init.normal_(m.weight, std=0.02)
        if isinstance(m, nn.Linear) and m.bias is not None:
            nn.init.zeros_(m.bias)

    def forward(self, idx):
        x = F.dropout(self.tok(idx) + self.pos(torch.arange(idx.shape[1])), DROPOUT, self.training)
        for b in self.blocks:
            x = b(x)
        return self.ln(x) @ self.tok.weight.T  # tied output head


model = GPT(V, **CFG)
print(f"{sum(p.numel() for p in model.parameters()) / 1e6:.2f}M parameters")
opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.05, betas=(0.9, 0.98))


def batch():
    picks = random.sample(data, BATCH)
    T = max(len(ids) for ids, _ in picks)
    x = torch.zeros(BATCH, T - 1, dtype=torch.long)
    y = torch.full((BATCH, T - 1), -100, dtype=torch.long)
    for i, (ids, start) in enumerate(picks):
        t = torch.tensor(ids)
        x[i, : len(ids) - 1] = t[:-1]
        y[i, start - 1 : len(ids) - 1] = t[start:]
    return x, y


t0 = time.time()
for step in range(STEPS + 1):
    lr = LR * min(1, step / 100) * 0.5 * (1 + math.cos(math.pi * step / STEPS))
    for g in opt.param_groups:
        g["lr"] = lr
    x, y = batch()
    loss = F.cross_entropy(model(x).reshape(-1, V), y.reshape(-1), ignore_index=-100)
    opt.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    if step % 250 == 0:
        print(f"step {step:5d}  loss {loss.item():.4f}  {time.time() - t0:.0f}s", flush=True)


@torch.no_grad()
def generate(q):
    ids = encode(BOS + normalise(q) + SEP)
    for _ in range(CFG["block"] - len(ids)):
        nxt = model(torch.tensor([ids]))[0, -1].argmax().item()
        ids.append(nxt)
        if chars[nxt] == EOS:
            break
    out = "".join(chars[i] for i in ids).split(SEP, 1)[1].rstrip(EOS)
    return out.split(ACT)[0], (out.split(ACT) + [""])[1]


model.eval()
answers = {r["a"] for r in rows}
# Phrasings that never appear in the corpus: a rough check that the model generalises.
held_out = {
    "could you share omkar's resume": "download",
    "what was the pneumonia paper about": "scroll:#projects",
    "how does the student risk model work": "scroll:#projects",
    "what's trihub": "scroll:#lab",
    "what is he really skilled at": "scroll:#expertise",
    "how can i get in touch with him": "scroll:#contact",
    "where did omkar go to college": "scroll:#experience",
    "what's the weather in pune": "",
    "who won the football world cup": "",
    "tell me about his speech project": "scroll:#projects",
    "show me his github": "open:github",
    "what does omkar do": "scroll:#hero",
    "what are his main skills": "scroll:#expertise",
    "is he open to internships": "scroll:#contact",
    "what stack is the erp built on": "scroll:#lab",
    "write me a poem about rain": "",
}
ok = 0
for q, want in held_out.items():
    a, act = generate(q)
    hit = act == want and a in answers
    ok += hit
    print(f"{'ok ' if hit else 'MISS'} {q!r} -> [{act}] {a[:70]}")
print(f"held-out: {ok}/{len(held_out)}")

# Export: config + vocab as JSON, weights as one float16 blob in a fixed order.
OUT.mkdir(parents=True, exist_ok=True)
tensors, blob = [], bytearray()
names = ["tok.weight", "pos.weight"]
for i in range(CFG["n_layer"]):
    for n in ["ln1.weight", "ln1.bias", "qkv.weight", "qkv.bias", "proj.weight", "proj.bias",
              "ln2.weight", "ln2.bias", "fc.weight", "fc.bias", "out.weight", "out.bias"]:
        names.append(f"blocks.{i}.{n}")
names += ["ln.weight", "ln.bias"]
sd = model.state_dict()
for n in names:
    t = sd[n].contiguous().to(torch.float16)
    tensors.append({"name": n, "shape": list(t.shape), "offset": len(blob) // 2})
    blob += t.numpy().tobytes()
(OUT / "slm.bin").write_bytes(bytes(blob))
(OUT / "slm.json").write_text(json.dumps({**CFG, "vocab": chars, "tensors": tensors}, ensure_ascii=False), encoding="utf8")

# Reference logits for the JS parity test, computed from the float16 weights the browser gets.
with torch.no_grad():
    for p in model.parameters():
        p.copy_(p.half().float())
    probe = "hello"
    logits = model(torch.tensor([encode(BOS + probe + SEP)]))[0, -1]
(Path(__file__).with_name("reference.json")).write_text(json.dumps({"q": probe, "logits": [round(v, 4) for v in logits.tolist()], "answer": generate(probe)}), encoding="utf8")
print(f"wrote {OUT / 'slm.bin'} ({len(blob) / 1024:.0f} KB)")
