def paginate(query, page: int = 1, per_page: int = 50):
    page = max(1, page)
    per_page = min(500, max(1, per_page))
    items = query.limit(per_page).offset((page-1)*per_page).all()
    return items

def parse_bbox(bbox_str: str):
    # bbox_str = "minx,miny,maxx,maxy"
    try:
        minx, miny, maxx, maxy = map(float, bbox_str.split(","))
        return minx, miny, maxx, maxy
    except Exception:
        return None
