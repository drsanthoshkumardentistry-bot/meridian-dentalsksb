"""Parse TN Dr. MGR University BDS PYQ text dumps into structured JSON."""
import json, re, sys, os, glob, hashlib
from collections import defaultdict

SRC = sys.argv[1]
OUT = sys.argv[2]

MONTHS = "JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER"
DATE_RE = re.compile(rf"\b({MONTHS}|Februray)\b\s*[-–]?\s*(20\d\d)", re.I)

# file prefix -> (year, subject id or combined split)
FILES = {
    "anat": (1, ["anatomy"]),
    "pb": (1, ["physiology", "biochemistry"]),
    "p_and_b": (1, ["physiology", "biochemistry"]),
    "oh": (1, ["dental-anatomy"]),
    "pm": (2, ["pathology", "microbiology"]),
    "pharm": (2, ["pharmacology"]),
    "dm": (2, ["dental-materials"]),
}

SECTION_HDR = re.compile(r"^\s*(I{1,3}|IV)\s*\.\s*(.+?)\s*$")
MARKS_RE = re.compile(r"\(?\s*(\d+)\s*[xX×]\s*(\d+)\s*=\s*(\d+)\s*\)?")
QNUM_RE = re.compile(r"^\s{0,8}(\d{1,2})\s*[.)]\s+(.*)$")
TABLE_TAIL = re.compile(r"\s+(\d{1,2})\s+(\d{1,3})\s+(\d{1,2})\s*$")


def kind_for(marks, title):
    t = title.lower()
    if marks is not None:
        if marks >= 8:
            return "10m"
        if marks >= 3:
            return "5m"
        return "2m"
    if "essay" in t or "elaborate" in t:
        return "10m"
    if "short answer" in t:
        return "2m"
    if "note" in t:
        return "5m"
    return None


def clean(s):
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = re.sub(r"\s+", " ", s).strip()
    return s


def split_papers(text):
    blocks = re.split(r"\n\s*\*{4,}\s*\n", text)
    return [b for b in blocks if b.strip()]


def parse_paper(block, subjects):
    date = None
    for m in DATE_RE.finditer(block):
        tail = block[m.end():m.end() + 25]
        if "Examination Session" in tail or "Exam" in tail[:6]:
            continue
        date = (m.group(1).capitalize().replace("Februray","February"), int(m.group(2)))
        break
    lines = block.split("\n")
    sec_subject = subjects[0]
    kind = None
    marks = None
    cur = None
    out = []

    def flush():
        nonlocal cur
        if cur and cur["text"]:
            cur["text"] = clean(cur["text"])
            out.append(cur)
        cur = None

    for raw in lines:
        line = raw.rstrip()
        up = line.upper()
        if len(subjects) > 1:
            sm = re.search(r"(?:SECTION|PART)\s*[–-]?\s*([AB])\b", up)
            sub_line = re.match(r"^\s*\(?\s*(GENERAL\s+)?(HUMAN\s+)?(PHYSIOLOGY|BIOCHEMISTRY|PATHOLOGY|MICROBIOLOGY)\s*\)?\s*$", up)
            if sm or sub_line:
                flush(); kind = None
                if sub_line:
                    name = sub_line.group(3).lower()
                    sec_subject = name if name in subjects else sec_subject
                else:
                    sec_subject = subjects[0] if sm.group(1) == "A" else subjects[1]
                    if "MICROBIOLOGY" in up: sec_subject = "microbiology"
                    if "PATHOLOGY" in up and "MICRO" not in up: sec_subject = "pathology"
                continue
        if "*" in line and not line.strip().strip("*"):
            flush(); continue
        sh = SECTION_HDR.match(line)
        if sh and re.search(r"essay|elaborate|note|short|answer", sh.group(2), re.I):
            flush()
            title = sh.group(2)
            mm = MARKS_RE.search(title)
            marks = int(mm.group(2)) if mm else None
            kind = kind_for(marks, title)
            continue
        if kind is None:
            continue
        # skip headers/table header noise
        if "(Max.)" in line:
            continue
        if re.search(r"Sub\. ?Code|Q\s*\.?\s*P\s*\.?\s*Code|DEGREE EXAM|Maximum\s*:|Regulations? (for|\()|Modified (Revised )?Regulation|Common to|M\.G\.R\.", line, re.I):
            flush(); kind = None; continue
        qm = QNUM_RE.match(line)
        body = None
        if qm:
            flush()
            body = qm.group(2)
            cur = {"subject": sec_subject, "kind": kind, "marks": marks, "text": ""}
        elif cur is not None and line.strip():
            body = line.strip()
        elif not line.strip():
            continue
        if body is None:
            continue
        tt = TABLE_TAIL.search(body)
        if tt:
            body = body[: tt.start()]
            if cur and cur["marks"] is None:
                cur["marks"] = int(tt.group(3))
                cur["kind"] = kind_for(cur["marks"], "")
        cur["text"] += " " + body
    flush()
    return date, out


def norm_key(t):
    t = t.lower()
    t = re.sub(r"\b(write|short|notes?|on|about|describe|discuss|explain|define|detail|in|the|a|an|of|and|its|with|add|note|mention|briefly|elaborate|what|is|are|give|list|name|enumerate|classify|classification)\b", " ", t)
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    t = re.sub(r"s\b", "", t)
    return " ".join(sorted(set(t.split())))


def main():
    all_q = []
    papers = []
    for path in sorted(glob.glob(os.path.join(SRC, "*.txt"))):
        name = os.path.basename(path)
        prefix = re.match(r"([a-z_]+?)_?\d", name).group(1).rstrip("_")
        year, subjects = FILES[prefix]
        text = open(path, encoding="utf-8").read()
        for block in split_papers(text):
            date, qs = parse_paper(block, subjects)
            if not qs:
                continue
            if date is None:
                print("WARN no date", name, qs[0]["text"][:60], file=sys.stderr)
                continue
            sess = f"{date[0]} {date[1]}"
            papers.append({"file": name, "session": sess, "n": len(qs)})
            for q in qs:
                q["bdsYear"] = year
                q["session"] = sess
                q["examYear"] = date[1]
                q["month"] = date[0]
                all_q.append(q)

    # dedupe identical (same paper parsed twice across overlapping files)
    seen = set(); uniq = []
    for q in all_q:
        k = (q["subject"], q["session"], q["kind"], q["text"].lower())
        if k in seen:
            continue
        seen.add(k); uniq.append(q)

    # group repeats
    groups = defaultdict(list)
    for q in uniq:
        groups[(q["subject"], norm_key(q["text"]))].append(q)

    # fuzzy merge of near-identical topic keys within a subject
    keys = list(groups.keys())
    parent = {k: k for k in keys}
    def find(k):
        while parent[k] != k:
            parent[k] = parent[parent[k]]; k = parent[k]
        return k
    bysub = defaultdict(list)
    for k in keys: bysub[k[0]].append(k)
    for subj, ks in bysub.items():
        sets = [(k, set(k[1].split())) for k in ks]
        for i in range(len(sets)):
            a, A = sets[i]
            if not A: continue
            for j in range(i + 1, len(sets)):
                b, B = sets[j]
                if not B: continue
                inter = len(A & B); uni = len(A | B)
                small = min(len(A), len(B))
                if inter / uni >= 0.8 or (inter == small and small >= 2 and uni - inter <= 1):
                    parent[find(a)] = find(b)
    merged = defaultdict(list)
    for k, qs in groups.items(): merged[find(k)].extend(qs)
    groups = merged

    items = []
    for (subj, key), qs in groups.items():
        qs.sort(key=lambda q: (q["examYear"], q["month"]))
        kinds = sorted({q["kind"] for q in qs})
        rep = max(qs, key=lambda q: len(q["text"]))
        sessions = sorted({q["session"] for q in qs}, key=lambda s: (int(s.split()[1]), s))
        items.append({
            "id": f"{subj}-{hashlib.sha1(key.encode()).hexdigest()[:8]}",
            "subject": subj,
            "bdsYear": qs[0]["bdsYear"],
            "text": rep["text"],
            "kinds": kinds,
            "marks": sorted({q["marks"] for q in qs if q["marks"]}),
            "asked": [{"session": q["session"], "kind": q["kind"], "marks": q["marks"]} for q in qs],
            "count": len(sessions),
        })
    items.sort(key=lambda i: (i["bdsYear"], i["subject"], -i["count"], i["text"]))
    assert len({i["id"] for i in items}) == len(items), "id collision"
    json.dump({"questions": items, "papers": papers}, open(OUT, "w"), indent=1, ensure_ascii=False)
    by = defaultdict(lambda: defaultdict(int))
    for it in items:
        for k in it["kinds"]:
            by[it["subject"]][k] += 1
    for s, d in by.items():
        print(s, dict(d), "repeats:", sum(1 for i in items if i["subject"] == s and i["count"] > 1))
    print("raw", len(all_q), "uniq", len(uniq), "grouped", len(items), "papers", len(papers))


main()
