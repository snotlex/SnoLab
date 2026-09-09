import json, os, sys

print("Writing schemas and enriched materials...")

# Helper to normalize role
def get_role(cat, typ):
    comb = f"{cat} {typ}".lower()
    if any(x in comb for x in ["إسمنت", "cement", "ciment", "أسمنت"]):
        return "cement"
    if any(x in comb for x in ["ركام خفيف", "lightweight", "léger", "خفاف", "طين ممتد"]):
        return "lightweightAggregate"
    if any(x in comb for x in ["ركام ثقيل", "heavyweight", "lourd", "باريت", "ماغنتيت", "مغنتيت"]):
        return "heavyweightAggregate"
    if any(x in comb for x in ["معاد تدوير", "recycled", "recyclé", "rca"]):
        return "recycledAggregate"
    if any(x in comb for x in ["ماء", "مياه", "water", "eau"]):
        return "water"
    if any(x in comb for x in ["رمل", "رمال", "sand", "sable"]):
        return "sand"
    if any(x in comb for x in ["حصى", "حصمة", "gravel", "gravier", "ركام خشن", "coarse"]):
        return "gravel"
    if any(x in comb for x in ["كيميائية", "admixture", "adjuvant", "ملدن"]):
        return "admixture"
    if any(x in comb for x in ["معدنية", "scm", "pouzzolane", "بوزولان", "خبث", "غبار السيليكا", "رماد"]):
        return "scm"
    if any(x in comb for x in ["مالئة", "filler", "fillers", "كربونات"]):
        return "filler"
    if any(x in comb for x in ["ألياف", "fiber", "fibre"]):
        return "fiber"
    if any(x in comb for x in ["محتوى الهواء", "air", "entrained", "هواء"]):
        return "airContent"
    if any(x in comb for x in ["تربة", "soil", "sol"]):
        return "soil"
    if any(x in comb for x in ["زفت", "بيتومين", "اسفلت", "asphalt", "bitumen"]):
        return "bituminous"
    if any(x in comb for x in ["بناء", "طوب", "بلوك", "masonry", "brique", "bloc"]):
        return "masonry"
    if any(x in comb for x in ["مجلد", "روابط", "رابط", "binder", "liant", "جيوبوليمر", "geopolymer"]):
        return "specialBinder"
    return "other"

print("Role helper defined.")
