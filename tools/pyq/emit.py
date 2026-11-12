import json, sys, os
from collections import defaultdict
d = json.load(open(sys.argv[1])); out = sys.argv[2]
by = defaultdict(list)
for q in d["questions"]:
    by[q["subject"]].append({"id": q["id"], "t": q["text"], "k": q["kinds"], "m": q["marks"],
        "a": [[a["session"], a["kind"], a["marks"]] for a in q["asked"]], "c": q["count"]})
idx = {}
for s, qs in by.items():
    json.dump(qs, open(os.path.join(out, f"{s}.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    sess = sorted({a[0] for q in qs for a in q["a"]}, key=lambda x: (int(x.split()[1]), ["January","February","March","April","May","June","July","August","September","October","November","December"].index(x.split()[0])))
    idx[s] = {"questions": len(qs), "papers": len(sess), "from": sess[0], "to": sess[-1]}
json.dump(idx, open(os.path.join(out, "index.json"), "w"), indent=1)
print(idx)
